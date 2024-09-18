import React, { useState } from 'react';
import { FilterForm } from './FilterForm.jsx';
import { Card } from './Card.jsx';

export function App(props) {
    const {
        quotes,
        codes,
        nonemptyCodes,
        sources,
    } = props;

    const numPapers = sources.length;
    const numQuotes = quotes.length;
    const numCodes = codes.length;

    const [predicates, setPredicates] = useState([]);

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

    return (
        <main>
            <div>
                <h1>scSTAR</h1>
                <p>Number of papers: {numPapers}</p>
                <p>Number of quotations: {numQuotes}<span>{predicates.length > 0 ? ` (${quoteMatches.length} match filter, from ${numPaperMatches} unique papers)` : null}</span></p>
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
                </div>

            </div>
            <div className="cards-container">
                <div className="quote-cards">
                    {quoteMatches.map(quote => (
                        <Card
                            key={quote.id}
                            data={quote.data}
                        />
                    ))}
                </div>
            </div>
        </main>
    );

}