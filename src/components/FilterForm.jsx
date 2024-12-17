import React, { useState, useCallback } from 'react';

export function FilterForm(props) {
    const {
        codes,
        predicates,
        setPredicates,
    } = props;

    function updatePredicate(predicateIndex, codeName) {
        if(predicateIndex > predicates.length - 1) {
            const newPredicates = [...predicates, [codeName]];
            setPredicates(newPredicates);
        } else {
            const newPredicates = [...predicates];
            const predicate = newPredicates[predicateIndex];
            if(predicate.includes(codeName)) {
                newPredicates[predicateIndex] = predicate.filter((name) => name !== codeName);
                if(newPredicates[predicateIndex].length === 0) {
                    newPredicates.splice(predicateIndex, 1);
                }
            } else {
                newPredicates[predicateIndex] = [...predicate, codeName];
            }
            setPredicates(newPredicates);
        }
    }


    
    return (
        <div>
            Filter: {predicates.map(predicate => "(" + predicate.join(" AND ") + ")").join(" OR ")}
            {predicates.length > 0 ? (<button onClick={() => setPredicates([])}>Clear</button>) : null}
            
            <br/>
            {[...predicates, null].map((predicate, index) => (
                <span>
                    <div className="filter-button-group">
                        {codes.sort((a, b) => a.data.name.localeCompare(b.data.name)).map((code) => {
                            const includesCode = predicate && predicate.includes(code.data.name);
                            const codeStyle = {
                                fontSize: '11px',
                                backgroundColor: includesCode ? 'lightblue' : 'white'
                            };
                            return (
                                <button key={code.data.guid} style={codeStyle} onClick={() => updatePredicate(index, code.data.name)}>{code.data.name}</button>
                            );
                        })}
                    </div>
                    <br/>
                    <span>OR</span>
                    <br/>
                </span>
            ))}
            
        </div>
    );
}