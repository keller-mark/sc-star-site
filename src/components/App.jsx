import React, { useState, useMemo } from 'react';
import { FilterForm } from './FilterForm.jsx';
import { Card } from './Card.jsx';
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

    const quoteMatches = quotes.filter(quote => {            
        const isMatch = predicates.length > 0 ? predicates.some(predicate => {
            return predicate.every(codeName => quote.data.codeEntries.map(d => d.data.name).includes(
                codeName
            ));
        }) : true;
        return isMatch;
    });
    const paperMatches = quoteMatches.map(quote => quote.data.sourceEntry.data.guid);
    const numPaperMatches = (new Set(paperMatches)).size;

    const numColumns = 4;


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
                    </div>
                </div>
            </div>
            <div className="cards-container">
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
                                        />
                                    </div>
                                ) : null;
                            }}
                        </Grid>
                    )}
                </AutoSizer>
       
            </div>
        </main>
    );

}