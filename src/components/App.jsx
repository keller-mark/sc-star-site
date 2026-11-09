import React, { useState, useMemo, useCallback } from 'react';
import { FilterForm } from './FilterForm.jsx';
import { Card } from './Card.jsx';
import { CodeDistributionChart } from './CodeDistributionChart.jsx';
import { FigureOrderChart } from './FigureOrderChart.jsx';
import { computeFigureOrder } from './figureOrder.js';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";




const Example = () => (
    <Grid
      columnCount={1000}
      columnWidth={100}
      height={550}
      rowCount={1000}
      rowHeight={35}
      width={500}
    >
      {Cell}
    </Grid>
  );


export function App(props) {
    const {
        quotes,
        codes,
        nonemptyCodes,
        sources,
    } = props;

    const numPapers = sources.length;
    const numQuotes = quotes.length;
    const numCodes = nonemptyCodes.length;

    const [predicates, setPredicates] = useState([]);
    const [showSubfigNums, setShowSubfigNums] = useState(false);
    const [showCodes, setShowCodes] = useState(true);
    const [showChart, setShowChart] = useState(false);
    // Which chart (if any) is expanded to the full window height: null | 'distribution' | 'order'.
    const [expandedChart, setExpandedChart] = useState(null);
    // Unit for the code distribution chart: 'subfigures' or 'papers'.
    const [chartUnit, setChartUnit] = useState('subfigures');
    // Measure for the code distribution chart: 'count' or 'percent'.
    const [chartMeasure, setChartMeasure] = useState('count');
    const [showOrderChart, setShowOrderChart] = useState(false);

    const quoteMatches = useMemo(() => quotes.filter(quote => {
        const isMatch = predicates.length > 0 ? predicates.some(predicate => {
            return predicate.every(codeName => quote.data.codeEntries.map(d => d.data.name).includes(
                codeName
            ));
        }) : true;
        return isMatch;
    }), [quotes, predicates]);
    const paperMatches = quoteMatches.map(quote => quote.data.sourceEntry.data.guid);
    const numPaperMatches = (new Set(paperMatches)).size;

    // Distribution of the matching subfigures (or the papers they come from)
    // across the codes that are not already part of the filter (selected codes
    // trivially cover every match).
    const codeDistribution = useMemo(() => {
        if (!showChart) return [];
        const selectedCodes = new Set(predicates.flat());
        // Map of code name -> Set of unique units (subfigure ids or paper guids).
        const units = new Map();
        quoteMatches.forEach(quote => {
            const unitId = chartUnit === 'papers' ? quote.data.sourceEntry.data.guid : quote.id;
            quote.data.codeEntries.forEach(d => {
                const name = d.data.name;
                if (!units.has(name)) units.set(name, new Set());
                units.get(name).add(unitId);
            });
        });
        return nonemptyCodes
            .map(code => code.data.name)
            .filter(name => !selectedCodes.has(name) && units.has(name))
            .map(name => ({ name, count: units.get(name).size }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }, [showChart, chartUnit, predicates, quoteMatches, nonemptyCodes]);

    // Clicking a bar (or a code pill on a card) ANDs its code into the filter.
    // With several OR-ed predicates, the code is ANDed into the last one.
    const handleCodeClick = useCallback((codeName) => {
        setPredicates(prev => {
            if (prev.length === 0) return [[codeName]];
            const last = prev[prev.length - 1];
            if (last.includes(codeName)) return prev;
            return [...prev.slice(0, -1), [...last, codeName]];
        });
    }, []);

    const selectedCodes = useMemo(() => new Set(predicates.flat()), [predicates]);

    // Relative ordering of codes across each paper's figures (filter-aware).
    const figureOrder = useMemo(() => {
        if (!showOrderChart) return null;
        return computeFigureOrder(quotes, quoteMatches);
    }, [showOrderChart, quotes, quoteMatches]);

    const numColumns = 4;

    // Only honor the expanded state for a chart that is currently shown.
    const activeExpanded = (expandedChart === 'distribution' && showChart)
        || (expandedChart === 'order' && showOrderChart && figureOrder)
        ? expandedChart : null;
    const isShown = (chart) => activeExpanded === null || activeExpanded === chart;
    const expandButton = (chart) => (
        <button
            className="chart-expand-button"
            onClick={() => setExpandedChart(activeExpanded === chart ? null : chart)}
            title={activeExpanded === chart ? 'Restore chart height and show the subfigure grid' : 'Expand chart to the full window height'}
        >
            {activeExpanded === chart ? 'Collapse' : 'Expand to full height'}
        </button>
    );


    return (
        <main>
            <div className="sidebar">
                <div className="sidebar-inner">
                    <h1>The State of Single-Cell Atlas Data Visualization</h1>
                    <p>Number of papers: {numPapers}</p>
                    <p>Number of subfigures: {numQuotes.toLocaleString()}<span>{predicates.length > 0 ? ` (${quoteMatches.length.toLocaleString()} match filter, from ${numPaperMatches} unique papers)` : null}</span></p>
                    <p>Number of codes: {numCodes}</p>

                    <div>
                        <FilterForm
                            codes={nonemptyCodes}
                            predicates={predicates}
                            setPredicates={setPredicates}
                        />
                        {/*
                        <p>Filter by code:</p>
                        TODO (allow filtering quotations by multiple codes with AND or OR)

                        <p>Filter by paper:</p>
                        <p>Filter by number of cells:</p>
                        <p>Filter by paper containing quote with code:</p>
                        <p>Filter by code group: </p>
                        */}
                        <br/>
                        <button onClick={() => setShowSubfigNums(prev => !prev)}>Toggle figure numbers</button>
                        &nbsp;
                        <button onClick={() => setShowCodes(prev => !prev)}>Toggle codes</button>
                        &nbsp;
                        <button onClick={() => setShowChart(prev => !prev)}>{showChart ? 'Hide' : 'Show'} code distribution chart</button>
                        {/*&nbsp;
                        <button onClick={() => setShowOrderChart(prev => !prev)}>{showOrderChart ? 'Hide' : 'Show'} figure order chart</button>*/}
                    </div>
                </div>
            </div>
            <div className="cards-container">
                {showChart && isShown('distribution') ? (
                    <div className={`chart-container${activeExpanded === 'distribution' ? ' expanded' : ''}`}>
                        <p className="chart-title">
                            {expandButton('distribution')}
                            {chartMeasure === 'percent' ? '% of ' : ''}{chartUnit === 'papers' ? 'Papers' : 'Subfigures'} per code
                            {predicates.length > 0 ? ` (among ${chartUnit === 'papers' ? 'papers with subfigures' : 'subfigures'} matching the filter; selected codes omitted)` : ''}
                            {chartMeasure === 'percent' ? (
                                <span className="chart-subtitle">
                                    {` Denominator: ${(chartUnit === 'papers' ? numPaperMatches : quoteMatches.length).toLocaleString()} ${predicates.length > 0 ? 'matching ' : ''}${chartUnit}. A ${chartUnit === 'papers' ? 'paper' : 'subfigure'} can have multiple codes, so percentages do not sum to 100%.`}
                                </span>
                            ) : null}
                        </p>
                        <div className="chart-controls">
                            Count:&nbsp;
                            {[['subfigures', 'Subfigures'], ['papers', 'Papers']].map(([value, label]) => (
                                <label key={value}>
                                    <input
                                        type="radio"
                                        name="chart-unit"
                                        value={value}
                                        checked={chartUnit === value}
                                        onChange={() => setChartUnit(value)}
                                    />
                                    {label}
                                </label>
                            ))}
                            &nbsp;Show:&nbsp;
                            {[['count', 'Counts'], ['percent', 'Percentages']].map(([value, label]) => (
                                <label key={value}>
                                    <input
                                        type="radio"
                                        name="chart-measure"
                                        value={value}
                                        checked={chartMeasure === value}
                                        onChange={() => setChartMeasure(value)}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                        {codeDistribution.length > 0 ? (
                            <AutoSizer disableHeight>
                                {({ width }) => (
                                    <CodeDistributionChart
                                        data={codeDistribution}
                                        total={chartUnit === 'papers' ? numPaperMatches : quoteMatches.length}
                                        unit={chartUnit}
                                        measure={chartMeasure}
                                        onBarClick={handleCodeClick}
                                        width={width}
                                    />
                                )}
                            </AutoSizer>
                        ) : (
                            <p className="chart-empty">No other codes co-occur with the current filter.</p>
                        )}
                    </div>
                ) : null}
                {showOrderChart && figureOrder && isShown('order') ? (
                    <div className={`chart-container${activeExpanded === 'order' ? ' expanded' : ''}`}>
                        <p className="chart-title">
                            {expandButton('order')}
                            Order of codes across figures
                            {predicates.length > 0 ? ' (among subfigures matching the filter)' : ''}
                        </p>
                        <AutoSizer disableHeight>
                            {({ width }) => (
                                <FigureOrderChart
                                    order={figureOrder}
                                    selectedCodes={selectedCodes}
                                    width={width}
                                />
                            )}
                        </AutoSizer>
                    </div>
                ) : null}
                {activeExpanded === null ? (
                <div className="grid-container">
                <AutoSizer key={JSON.stringify(predicates)}>
                    {({ height, width }) => (
                        <Grid
                            columnCount={numColumns}
                            columnWidth={Math.floor(width / numColumns) - numColumns}
                            height={height - 1}
                            rowCount={Math.ceil(quoteMatches.length / numColumns)}
                            rowHeight={300}
                            width={width - 1}
                        >
                            {({ columnIndex, rowIndex, style }) => {
                                const quote = quoteMatches[rowIndex * numColumns + columnIndex];
                                return quote ? (
                                    <div style={{...style, border: '1px solid rgba(0, 0, 0, 0.1)' }}>
                                        <Card
                                            key={quote.id}
                                            data={quote.data}
                                            showSubfigNum={showSubfigNums}
                                            showCodes={showCodes}
                                            onCodeClick={handleCodeClick}
                                        />
                                    </div>
                                ) : null;
                            }}
                        </Grid>
                    )}
                </AutoSizer>
                </div>
                ) : null}
            </div>
        </main>
    );

}
