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
            Filter: {predicates.map(predicate => "(" + predicate.join(" AND ") + ")").join(" OR ")}<br/>
            {[...predicates, null].map((predicate, index) => (
                <span>
                    {codes.map((code) => {
                        const includesCode = predicate && predicate.includes(code.data.name);
                        const codeStyle = {
                            fontSize: '11px',
                            backgroundColor: includesCode ? 'lightblue' : 'white'
                        };
                        return (
                            <button style={codeStyle} onClick={() => updatePredicate(index, code.data.name)}>{code.data.name}</button>
                        );
                    })}
                    <br/>
                    <span>OR</span>
                </span>
            ))}
            
        </div>
    );
}