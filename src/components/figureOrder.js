// Helpers for analyzing the relative order of codes (plot types, etc.)
// across the figures of each paper.

/**
 * Extract the figure number from a subfigure label, ignoring the panel letter
 * (e.g., "3c" -> 3, "12" -> 12). Returns null if there is no number.
 * @param {string|null|undefined} subfigNum
 * @returns {number|null}
 */
export function parseFigureNumber(subfigNum) {
    if (subfigNum === null || subfigNum === undefined) return null;
    const match = String(subfigNum).match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

function quantile(sorted, p) {
    if (sorted.length === 0) return NaN;
    const i = (sorted.length - 1) * p;
    const lo = Math.floor(i);
    const hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/**
 * Compute, for each code, where it tends to appear within papers' figure
 * sequences, plus pairwise precedence between codes.
 *
 * Figure positions are relative rankings rather than raw figure numbers:
 * within each paper, the distinct figure numbers (computed from ALL of the
 * paper's subfigures, so that filtering does not change a paper's figure
 * sequence) are ranked and rescaled to [0, 1], where 0 = the paper's first
 * figure and 1 = its last. Papers with a single annotated figure carry no
 * ordering information and are excluded.
 *
 * Only subfigures in `matchingQuotes` (i.e., the current filter) contribute
 * code occurrences. Each (code, paper, figure) triple counts once, so
 * figures with many panels of the same code are not over-weighted.
 *
 * @param {object[]} allQuotes All quotations.
 * @param {object[]} matchingQuotes Quotations that match the current filter.
 * @returns {{ positions: object[], precedence: Map<string, Map<string, object>>, numPapers: number }}
 */
export function computeFigureOrder(allQuotes, matchingQuotes) {
    // Per paper: sorted distinct figure numbers.
    const paperFigures = new Map();
    allQuotes.forEach(quote => {
        const fig = parseFigureNumber(quote.data.subfig_num);
        if (fig === null) return;
        const paper = quote.data.sourceEntry.data.guid;
        if (!paperFigures.has(paper)) paperFigures.set(paper, new Set());
        paperFigures.get(paper).add(fig);
    });
    // Per paper: figure number -> relative position in [0, 1].
    const paperRelPos = new Map();
    paperFigures.forEach((figs, paper) => {
        const sorted = [...figs].sort((a, b) => a - b);
        if (sorted.length < 2) return;
        const lookup = new Map(sorted.map((fig, i) => [fig, i / (sorted.length - 1)]));
        paperRelPos.set(paper, lookup);
    });

    // code -> paper -> Set of relative positions.
    const codePaperPos = new Map();
    const papersUsed = new Set();
    matchingQuotes.forEach(quote => {
        const paper = quote.data.sourceEntry.data.guid;
        const lookup = paperRelPos.get(paper);
        const fig = parseFigureNumber(quote.data.subfig_num);
        if (!lookup || fig === null) return;
        const pos = lookup.get(fig);
        papersUsed.add(paper);
        new Set(quote.data.codeEntries.map(d => d.data.name)).forEach(name => {
            if (!codePaperPos.has(name)) codePaperPos.set(name, new Map());
            const byPaper = codePaperPos.get(name);
            if (!byPaper.has(paper)) byPaper.set(paper, new Set());
            byPaper.get(paper).add(pos);
        });
    });

    const positions = [];
    // code -> paper -> earliest relative position (used for precedence).
    const firstPos = new Map();
    codePaperPos.forEach((byPaper, name) => {
        const values = [];
        const firsts = new Map();
        byPaper.forEach((posSet, paper) => {
            let min = Infinity;
            posSet.forEach(p => {
                values.push(p);
                if (p < min) min = p;
            });
            firsts.set(paper, min);
        });
        values.sort((a, b) => a - b);
        firstPos.set(name, firsts);
        positions.push({
            name,
            values,
            numFigures: values.length,
            numPapers: byPaper.size,
            mean: values.reduce((s, v) => s + v, 0) / values.length,
            q10: quantile(values, 0.1),
            q25: quantile(values, 0.25),
            median: quantile(values, 0.5),
            q75: quantile(values, 0.75),
            q90: quantile(values, 0.9),
        });
    });
    positions.sort((a, b) => a.median - b.median || a.mean - b.mean || a.name.localeCompare(b.name));

    // Pairwise precedence: among papers containing both A and B, how often
    // does A's first appearance come in an earlier figure than B's?
    const precedence = new Map();
    const names = [...firstPos.keys()];
    names.forEach(a => {
        const row = new Map();
        const fa = firstPos.get(a);
        names.forEach(b => {
            if (a === b) return;
            const fb = firstPos.get(b);
            let before = 0;
            let after = 0;
            let tied = 0;
            fa.forEach((pa, paper) => {
                const pb = fb.get(paper);
                if (pb === undefined) return;
                if (pa < pb) before += 1;
                else if (pa > pb) after += 1;
                else tied += 1;
            });
            const total = before + after + tied;
            if (total > 0) row.set(b, { before, after, tied, total });
        });
        precedence.set(a, row);
    });

    return { positions, precedence, numPapers: papersUsed.size };
}
