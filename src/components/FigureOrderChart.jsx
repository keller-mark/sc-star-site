import React, { useEffect, useMemo, useRef, useState } from 'react';
import { select, pointer } from 'd3-selection';
import { scaleLinear, scaleBand } from 'd3-scale';
import { axisTop } from 'd3-axis';

const BOX_COLOR = '#2a78d6';
const SELECTED_COLOR = '#d6662a';
const TEXT_PRIMARY = '#0b0b0b';
const TEXT_SECONDARY = '#52514e';
const GRID_COLOR = 'rgba(0, 0, 0, 0.08)';
const EMPTY_CELL = '#f2f2f0';
// Diverging: orange = row code tends to come AFTER column code, blue = BEFORE.
const DIVERGING = ['#c4501b', '#f7f7f5', '#1c5aa6'];

const ROW_HEIGHT = 20;
const LABEL_FONT = '11px system-ui, sans-serif';
const MAX_LABEL_WIDTH = 220;

function measureMaxLabelWidth(labels) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = LABEL_FONT;
    return labels.reduce((max, label) => Math.max(max, ctx.measureText(label).width), 0);
}

function pct(n, total) {
    return total > 0 ? `${Math.round(100 * n / total)}%` : '0%';
}

function fmtPos(v) {
    return v.toFixed(2);
}

// Deterministic jitter so dots do not move around between renders.
function jitter(i) {
    const s = Math.sin(i * 12.9898) * 43758.5453;
    return s - Math.floor(s);
}

function attachTooltip(selection, tooltip, svgNode, html, onEnter, onLeave) {
    selection
        .on('mouseenter', function (event, d) {
            tooltip.style('display', 'block').html(html(d));
            if (onEnter) onEnter(d);
        })
        .on('mousemove', function (event) {
            const [px, py] = pointer(event, svgNode);
            tooltip.style('left', `${px + 12}px`).style('top', `${py + 12}px`);
        })
        .on('mouseleave', function () {
            tooltip.style('display', 'none');
            if (onLeave) onLeave();
        });
}

/**
 * Box plots of the relative figure position (0 = first figure of the paper,
 * 1 = last figure) at which each code appears.
 */
function PositionDistribution(props) {
    const { data, selectedCodes, width } = props;
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const svg = select(svgRef.current);
        const tooltip = select(tooltipRef.current);
        svg.selectAll('*').remove();
        if (!width || data.length === 0) return;

        const marginLeft = Math.min(measureMaxLabelWidth(data.map(d => d.name)) + 10, MAX_LABEL_WIDTH);
        const margin = { top: 30, right: 24, bottom: 8 };
        const innerWidth = Math.max(width - marginLeft - margin.right, 80);
        const innerHeight = data.length * ROW_HEIGHT;
        svg.attr('width', width).attr('height', innerHeight + margin.top + margin.bottom);

        const x = scaleLinear().domain([0, 1]).range([0, innerWidth]);
        const y = scaleBand().domain(data.map(d => d.name)).range([0, innerHeight]).paddingInner(0.3);
        const bw = y.bandwidth();

        const g = svg.append('g').attr('transform', `translate(${marginLeft},${margin.top})`);

        const tickLabels = { 0: 'first figure', 0.5: 'middle', 1: 'last figure' };
        const axis = g.append('g')
            .call(axisTop(x)
                .tickValues([0, 0.25, 0.5, 0.75, 1])
                .tickFormat(v => tickLabels[v] || '')
                .tickSize(-innerHeight)
                .tickSizeOuter(0));
        axis.select('.domain').remove();
        axis.selectAll('.tick line').attr('stroke', GRID_COLOR);
        axis.selectAll('.tick text').attr('fill', TEXT_SECONDARY).style('font-size', '10px');
        // Keep the edge labels inside the plot area.
        axis.selectAll('.tick text')
            .attr('text-anchor', v => (v === 0 ? 'start' : v === 1 ? 'end' : 'middle'));

        const colorOf = d => (selectedCodes.has(d.name) ? SELECTED_COLOR : BOX_COLOR);

        const rows = g.selectAll('g.row')
            .data(data, d => d.name)
            .join('g')
            .attr('class', 'row')
            .attr('transform', d => `translate(0,${y(d.name)})`);

        rows.append('text')
            .attr('x', -8)
            .attr('y', bw / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .attr('fill', TEXT_PRIMARY)
            .style('font', LABEL_FONT)
            .style('font-weight', d => (selectedCodes.has(d.name) ? 600 : 400))
            .text(d => d.name);

        // Individual (paper, figure) occurrences.
        rows.each(function (d) {
            select(this).append('g')
                .selectAll('circle')
                .data(d.values)
                .join('circle')
                .attr('cx', v => x(v))
                .attr('cy', (v, i) => bw * (0.15 + 0.7 * jitter(i + 1)))
                .attr('r', 1.6)
                .attr('fill', colorOf(d))
                .attr('fill-opacity', 0.25);
        });

        // Whisker: 10th-90th percentile.
        rows.append('line')
            .attr('x1', d => x(d.q10))
            .attr('x2', d => x(d.q90))
            .attr('y1', bw / 2)
            .attr('y2', bw / 2)
            .attr('stroke', colorOf)
            .attr('stroke-width', 1.5);

        // Box: interquartile range.
        const boxes = rows.append('rect')
            .attr('x', d => x(d.q25))
            .attr('y', bw * 0.15)
            .attr('width', d => Math.max(2, x(d.q75) - x(d.q25)))
            .attr('height', bw * 0.7)
            .attr('rx', 2)
            .attr('fill', colorOf)
            .attr('fill-opacity', 0.35)
            .attr('stroke', colorOf);

        // Median tick.
        rows.append('line')
            .attr('x1', d => x(d.median))
            .attr('x2', d => x(d.median))
            .attr('y1', 0)
            .attr('y2', bw)
            .attr('stroke', TEXT_PRIMARY)
            .attr('stroke-width', 2);

        const hit = rows.append('rect')
            .attr('x', -marginLeft)
            .attr('y', -(y.step() - bw) / 2)
            .attr('width', marginLeft + innerWidth + margin.right)
            .attr('height', y.step())
            .attr('fill', 'transparent');
        attachTooltip(
            hit, tooltip, svgRef.current,
            d => `<strong>${d.name}</strong><br/>`
                + `${d.numFigures.toLocaleString()} figures across ${d.numPapers.toLocaleString()} papers<br/>`
                + `median position: ${fmtPos(d.median)} (IQR ${fmtPos(d.q25)}–${fmtPos(d.q75)})<br/>`
                + `0 = paper's first figure, 1 = last figure`,
            d => boxes.attr('fill-opacity', b => (b.name === d.name ? 0.6 : 0.35)),
            () => boxes.attr('fill-opacity', 0.35),
        );
    }, [data, selectedCodes, width]);

    return (
        <div style={{ position: 'relative' }}>
            <svg ref={svgRef} role="img" aria-label="Relative figure position of each code within papers" />
            <div ref={tooltipRef} className="chart-tooltip" style={{ display: 'none' }} />
        </div>
    );
}

/**
 * Matrix of pairwise precedence. Cell (row A, column B) shows, among papers
 * containing both codes, whether A's first appearance tends to be in an
 * earlier figure than B's first appearance.
 */
function PrecedenceMatrix(props) {
    const { codes, precedence, selectedCodes, minPapers, width } = props;
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const svg = select(svgRef.current);
        const tooltip = select(tooltipRef.current);
        svg.selectAll('*').remove();
        if (!width || codes.length < 2) return;

        const labelWidth = Math.min(measureMaxLabelWidth(codes) + 10, MAX_LABEL_WIDTH);
        const marginLeft = labelWidth;
        const marginTop = Math.ceil(labelWidth * 0.75) + 8; // rotated column labels
        const marginRight = 16;
        const cell = Math.max(10, Math.min(24, Math.floor((width - marginLeft - marginRight) / codes.length)));
        const inner = cell * codes.length;
        svg.attr('width', Math.max(width, marginLeft + inner + marginRight))
            .attr('height', marginTop + inner + 8);

        const pos = scaleBand().domain(codes).range([0, inner]);
        const color = scaleLinear().domain([-1, 0, 1]).range(DIVERGING).clamp(true);

        const g = svg.append('g').attr('transform', `translate(${marginLeft},${marginTop})`);

        const labelWeight = name => (selectedCodes.has(name) ? 600 : 400);
        g.append('g').selectAll('text')
            .data(codes)
            .join('text')
            .attr('x', -6)
            .attr('y', d => pos(d) + cell / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .attr('fill', TEXT_PRIMARY)
            .style('font', LABEL_FONT)
            .style('font-weight', labelWeight)
            .text(d => d);
        g.append('g').selectAll('text')
            .data(codes)
            .join('text')
            .attr('transform', d => `translate(${pos(d) + cell / 2},-6) rotate(-50)`)
            .attr('dy', '0.35em')
            .attr('fill', TEXT_PRIMARY)
            .style('font', LABEL_FONT)
            .style('font-weight', labelWeight)
            .text(d => d);

        const cells = [];
        codes.forEach(a => codes.forEach(b => {
            const stats = a === b ? null : precedence.get(a)?.get(b) || null;
            cells.push({ a, b, stats });
        }));

        const valueOf = s => (s.before - s.after) / s.total;
        const rects = g.append('g').selectAll('rect')
            .data(cells)
            .join('rect')
            .attr('x', d => pos(d.b) + 0.5)
            .attr('y', d => pos(d.a) + 0.5)
            .attr('width', cell - 1)
            .attr('height', cell - 1)
            .attr('fill', d => (d.stats ? color(valueOf(d.stats)) : EMPTY_CELL))
            .attr('fill-opacity', d => (d.stats && d.stats.total < minPapers ? 0.35 : 1));

        attachTooltip(
            rects.filter(d => d.stats), tooltip, svgRef.current,
            ({ a, b, stats: s }) => `Among <strong>${s.total}</strong> papers with both<br/>`
                + `<strong>${a}</strong> and <strong>${b}</strong>,<br/>`
                + `${a} first appears:<br/>`
                + `&nbsp;&nbsp;in an earlier figure: ${s.before} (${pct(s.before, s.total)})<br/>`
                + `&nbsp;&nbsp;in the same figure: ${s.tied} (${pct(s.tied, s.total)})<br/>`
                + `&nbsp;&nbsp;in a later figure: ${s.after} (${pct(s.after, s.total)})`
                + (s.total < minPapers ? `<br/><em>fewer than ${minPapers} papers (faded)</em>` : ''),
            d => rects.attr('stroke', r => (r === d ? TEXT_PRIMARY : null)),
            () => rects.attr('stroke', null),
        );
    }, [codes, precedence, selectedCodes, minPapers, width]);

    return (
        <div style={{ position: 'relative' }}>
            <svg ref={svgRef} role="img" aria-label="Pairwise precedence of codes across figures" />
            <div ref={tooltipRef} className="chart-tooltip" style={{ display: 'none' }} />
            <div className="chart-legend">
                <span className="chart-legend-swatch" style={{ background: DIVERGING[2] }} /> row code usually comes first
                <span className="chart-legend-swatch" style={{ background: DIVERGING[1], border: '1px solid rgba(0,0,0,0.2)' }} /> no consistent order / same figure
                <span className="chart-legend-swatch" style={{ background: DIVERGING[0] }} /> column code usually comes first
            </div>
        </div>
    );
}

/**
 * Toggle-able analysis of the order in which codes appear across a paper's
 * figures, based on relative figure ranking (panel letters are ignored).
 * @param {object} props
 * @param {ReturnType<import('./figureOrder.js').computeFigureOrder>} props.order
 * @param {Set<string>} props.selectedCodes Codes used in the current filter.
 * @param {number} props.width Available width in pixels.
 */
export function FigureOrderChart(props) {
    const { order, selectedCodes, width } = props;
    const [view, setView] = useState('distribution');
    const [minPapers, setMinPapers] = useState(5);
    const [maxCodes, setMaxCodes] = useState(25);

    const distributionData = useMemo(
        () => order.positions.filter(d => d.numPapers >= minPapers || selectedCodes.has(d.name)),
        [order, minPapers, selectedCodes],
    );

    // Matrix: the codes present in the most papers (plus any selected codes),
    // ordered by median relative position so the diagonal reads early -> late.
    const matrixCodes = useMemo(() => {
        const top = new Set(
            [...distributionData]
                .sort((a, b) => b.numPapers - a.numPapers || a.name.localeCompare(b.name))
                .slice(0, maxCodes)
                .map(d => d.name),
        );
        distributionData.forEach(d => { if (selectedCodes.has(d.name)) top.add(d.name); });
        return distributionData.filter(d => top.has(d.name)).map(d => d.name);
    }, [distributionData, maxCodes, selectedCodes]);

    // AutoSizer renders children inside a zero-width wrapper, so HTML content
    // (unlike the explicitly-sized SVG) needs an explicit width.
    return (
        <div style={{ width }}>
            <div className="chart-controls">
                <label>
                    <input type="radio" checked={view === 'distribution'} onChange={() => setView('distribution')} />
                    Position within paper
                </label>
                <label>
                    <input type="radio" checked={view === 'precedence'} onChange={() => setView('precedence')} />
                    Pairwise order
                </label>
                <label>
                    Min. papers per code:&nbsp;
                    <input type="number" min={1} value={minPapers} style={{ width: '4em' }}
                        onChange={e => setMinPapers(Math.max(1, parseInt(e.target.value, 10) || 1))} />
                </label>
                {view === 'precedence' ? (
                    <label>
                        Max. codes:&nbsp;
                        <input type="number" min={2} value={maxCodes} style={{ width: '4em' }}
                            onChange={e => setMaxCodes(Math.max(2, parseInt(e.target.value, 10) || 2))} />
                    </label>
                ) : null}
            </div>
            <p className="chart-note">
                Figure numbers are converted to a relative rank within each paper (0 = first figure, 1 = last);
                panel letters are ignored. {order.numPapers.toLocaleString()} papers with 2+ figures contribute.
                {selectedCodes.size > 0 ? ' Codes in the current filter are highlighted.' : ''}
            </p>
            {view === 'distribution' ? (
                distributionData.length > 0 ? (
                    <PositionDistribution data={distributionData} selectedCodes={selectedCodes} width={width} />
                ) : <p className="chart-empty">No codes meet the minimum number of papers.</p>
            ) : (
                matrixCodes.length >= 2 ? (
                    <PrecedenceMatrix
                        codes={matrixCodes}
                        precedence={order.precedence}
                        selectedCodes={selectedCodes}
                        minPapers={minPapers}
                        width={width}
                    />
                ) : <p className="chart-empty">At least two codes are needed for a pairwise comparison.</p>
            )}
        </div>
    );
}
