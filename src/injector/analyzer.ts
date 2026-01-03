/**
 * Analyze document state, identify Active_Mark and stale regions
 * 
 * Active_Mark Identification Rules:
 * 1. No TOC_Mark → activeMark = null (prompt user to add)
 * 2. Single TOC_Mark → that mark is Active
 * 3. Multiple TOC_Marks with bare marks (no matching end) → last bare mark is Active
 * 4. Multiple TOC_Marks all with ends → first one is Active
 * 
 * Stale Region Identification Rules:
 * 1. Orphan TOC_End (no matching mark) → use offset to locate old TOC range [end - offset, end]
 * 2. Non-active complete regions → entire region [mark, end] is stale
 * 3. Forward move (actual distance > offset) → old TOC at [end - offset, end] is stale
 */

import { DocumentAnalysis, TocMarkInfo, TocEndInfo, StaleRegion } from './types.js';

/**
 * Analyze document and return analysis result
 * Implements Property (Active_Mark Identification) and Property (Move Detection)
 */
export function analyzeDocument(
    lines: string[],
    tocMarks: TocMarkInfo[],
    tocEnds: TocEndInfo[]
): DocumentAnalysis {
    const staleRegions: StaleRegion[] = [];
    let moveDetected = false;

    // 1. Pair marks with ends (each mark connects to nearest subsequent end)
    // (Optimized: O(N + M)) tocMarks and tocEnds is sort by lineIndex after Scanner
    // Only look at the position sequence (mark the nearest end after)
    let endIdx = 0;

    for (const mark of tocMarks) {
        while (
            endIdx < tocEnds.length &&
            (tocEnds[endIdx].lineIndex < mark.lineIndex || tocEnds[endIdx].hasMatchingMark)
        ) {
            endIdx++;
        }

        if (endIdx < tocEnds.length) {
            const matchingEnd = tocEnds[endIdx];

            mark.hasMatchingEnd = true;
            mark.matchingEndIndex = matchingEnd.lineIndex;

            matchingEnd.hasMatchingMark = true;
            matchingEnd.matchingMarkIndex = mark.lineIndex;

            // Advance pointer (an End can only be used once)
            endIdx++;
        }
    }

    // 2. Identify Active_Mark
    let activeMark: TocMarkInfo | null = null;

    if (tocMarks.length === 1) {
        activeMark = tocMarks[0];
    } else if (tocMarks.length > 1) {
        // find not match tocMarks
        const bareMarks = tocMarks.filter(m => !m.hasMatchingEnd);

        if (bareMarks.length > 0) {
            // Use last bare mark (most likely user's new position)
            activeMark = bareMarks[bareMarks.length - 1];
        } else {
            // All have ends, use first one
            activeMark = tocMarks[0];
        }
    }

    // 3. Identify stale regions 

    // A. Orphan TOC_Ends (backward move or deleted mark)
    const orphanEnds = tocEnds.filter(e => !e.hasMatchingMark);
    for (const end of orphanEnds) {
        // Use offset to locate old TOC range
        const startLine = Math.max(0, end.lineIndex - end.offset);
        staleRegions.push({
            type: 'orphan-end',
            startLine,
            endLine: end.lineIndex
        });
        moveDetected = true;
    }

    // B. Non-active complete regions (duplicate/copy-paste) 
    // have many regions block 
    for (const mark of tocMarks) {
        if (mark === activeMark) continue;

        if (mark.hasMatchingEnd && mark.matchingEndIndex !== undefined) {
            staleRegions.push({
                type: 'complete',
                startLine: mark.lineIndex,
                endLine: mark.matchingEndIndex
            });
        }
    }

    // C. Forward move detection (active mark moved up, content between mark and end increased)
    // need cal offset and actualDistance
    if (activeMark?.hasMatchingEnd && activeMark.matchingEndIndex !== undefined) {
        const matchingEnd = tocEnds.find(e => e.lineIndex === activeMark!.matchingEndIndex);

        if (matchingEnd && matchingEnd.offset > 0) {
            // TODO: Whether to subtract 1 or not. 
            const actualDistance = matchingEnd.lineIndex - activeMark.lineIndex - 1;

            if (actualDistance > matchingEnd.offset) {
                // Forward move detected: old TOC is at the bottom of the region
                const oldTocStart = matchingEnd.lineIndex - matchingEnd.offset;
                staleRegions.push({
                    type: 'moved-content',
                    startLine: oldTocStart,
                    endLine: matchingEnd.lineIndex
                });
                moveDetected = true;
            }
        }
    }

    // Sort stale regions by startLine descending (for safe deletion from bottom up)
    staleRegions.sort((a, b) => b.startLine - a.startLine);

    return {
        lines,
        tocMarks,
        tocEnds,
        activeMark,
        staleRegions,
        moveDetected
    };
}
