import React, { useEffect, useRef } from 'react';
import { select, pointer } from 'd3-selection';
import { scaleLinear, scaleBand } from 'd3-scale';
import { axisTop } from 'd3-axis';

const BAR_COLOR = '#2a78d6';
const BAR_HOVER_COLOR = '#1c5aa6';
const TEXT_PRIMARY = '#0b0b0b';
const TEXT_SECONDARY = '#52514e';
const GRID_COLOR = 'rgba(0, 0, 0, 0.08)';

const ROW_HEIGHT = 18;
const BAR_RADIUS = 4;
const MARGIN = { top: 24, right: 56, bottom: 8 };
const LABEL_FONT = '11px system-ui, sans-serif';

// Measure label widths so the left margin fits the longest code name.
function measureMaxLabelWidth(labels) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = LABEL_FONT;
    return labels.reduce((max, label) => Math.max(max, ctx.measureText(label).width), 0);
}

// Horizontal bar path with rounded data-end (right side) and square baseline (left side).
function barPath(x0, y, w, h, r) {
    const rr = Math.min(r, w, h / 2);
    return `M${x0},${y}`
        + `H${x0 + w - rr}`
        + `A${rr},${rr} 0 0 1 ${x0 + w},${y + rr}`
        + `V${y + h - rr}`
        + `A${rr},${rr} 0 0 1 ${x0 + w - rr},${y + h}`
        + `H${x0}Z`;
}

/**
 * D3 horizontal bar chart of subfigure counts per code.
 * @param {object} props
 * @param {{ name: string, count: number }[]} props.data Sorted rows to plot.
 * @param {number} props.total Number of subfigures in the current (filtered) set.
 * @param {number} props.width Available width in pixels.
 */
export function CodeDistributionChart(props) {
    const { data, total, width } = props;
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const svg = select(svgRef.current);
        const tooltip = select(tooltipRef.current);
        svg.selectAll('*').remove();
        if (!width || data.length === 0) return;

        const labelWidth = Math.min(measureMaxLabelWidth(data.map(d => d.name)) + 8, 280);
        const marginLeft = labelWidth;
        const innerWidth = Math.max(width - marginLeft - MARGIN.right, 50);
        const innerHeight = data.length * ROW_HEIGHT;
        const height = innerHeight + MARGIN.top + MARGIN.bottom;

        svg.attr('width', width).attr('height', height);

        const x = scaleLinear()
            .domain([0, Math.max(1, ...data.map(d => d.count))])
            .nice()
            .range([0, innerWidth]);
        const y = scaleBand()
            .domain(data.map(d => d.name))
            .range([0, innerHeight])
            .paddingInner(0.2); // surface gap between adjacent bars

        const g = svg.append('g').attr('transform', `translate(${marginLeft},${MARGIN.top})`);

        // Recessive top axis + vertical gridlines.
        const axis = g.append('g')
            .call(axisTop(x).ticks(Math.max(2, Math.floor(innerWidth / 80))).tickSize(-innerHeight).tickSizeOuter(0));
        axis.select('.domain').remove();
        axis.selectAll('.tick line').attr('stroke', GRID_COLOR);
        axis.selectAll('.tick text').attr('fill', TEXT_SECONDARY).style('font-size', '10px');

        const rows = g.selectAll('g.row')
            .data(data, d => d.name)
            .join('g')
            .attr('class', 'row')
            .attr('transform', d => `translate(0,${y(d.name)})`);

        // Code name labels (left of baseline).
        rows.append('text')
            .attr('x', -6)
            .attr('y', y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .attr('fill', TEXT_PRIMARY)
            .style('font', LABEL_FONT)
            .text(d => d.name);

        const bars = rows.append('path')
            .attr('d', d => barPath(0, 0, x(d.count), y.bandwidth(), BAR_RADIUS))
            .attr('fill', BAR_COLOR);

        // Value labels at the end of each bar.
        rows.append('text')
            .attr('x', d => x(d.count) + 4)
            .attr('y', y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('fill', TEXT_SECONDARY)
            .style('font', '10px system-ui, sans-serif')
            .text(d => d.count.toLocaleString());

        // Full-row invisible hit target (bigger than the mark) for hover.
        rows.append('rect')
            .attr('x', -marginLeft)
            .attr('y', -(y.step() - y.bandwidth()) / 2)
            .attr('width', marginLeft + innerWidth + MARGIN.right)
            .attr('height', y.step())
            .attr('fill', 'transparent')
            .on('mouseenter', function (event, d) {
                bars.attr('fill', b => (b.name === d.name ? BAR_HOVER_COLOR : BAR_COLOR));
                const pct = total > 0 ? (100 * d.count / total).toFixed(1) : '0.0';
                tooltip
                    .style('display', 'block')
                    .html(`<strong>${d.name}</strong><br/>${d.count.toLocaleString()} subfigures (${pct}% of ${total.toLocaleString()})`);
            })
            .on('mousemove', function (event) {
                const [px, py] = pointer(event, svgRef.current);
                tooltip.style('left', `${px + 12}px`).style('top', `${py + 12}px`);
            })
            .on('mouseleave', function () {
                bars.attr('fill', BAR_COLOR);
                tooltip.style('display', 'none');
            });
    }, [data, total, width]);

    return (
        <div style={{ position: 'relative' }}>
            <svg ref={svgRef} role="img" aria-label="Number of subfigures per code" />
            <div
                ref={tooltipRef}
                className="chart-tooltip"
                style={{ display: 'none' }}
            />
        </div>
    );
}
