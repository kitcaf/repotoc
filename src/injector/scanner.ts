/**
 * Responsible for regular expression matching 
 * and code block ignoring logic
 */

import { TocMarkInfo, TocEndInfo } from './types.js';

// Regex constants
// Matches <!--toc-->, <!-- toc -->, <!--TOC-->, <!-- TOC --> etc.
const TOC_MARK_REGEX = /<!--\s*toc\s*-->/i;
// Matches <!--tocEnd--> or <!--tocEnd:offset=N-->
const TOC_END_REGEX = /<!--\s*tocEnd(?::offset=(\d+))?\s*-->/i;
// Matches code block start/end (``` or ~~~)
const CODE_BLOCK_REGEX = /^(\s*)(`{3,}|~{3,})/;

/**
 * Scan document and return all valid tag positions
 * Implements Property 3 (Flexible Format) and Property 4 (Ignore Code Blocks)
 */
export function scanTags(lines: string[]): { tocMarks: TocMarkInfo[]; tocEnds: TocEndInfo[] } {
    const tocMarks: TocMarkInfo[] = []; // List of tocMarks by Scaning README.md
    const tocEnds: TocEndInfo[] = []; // List of tocEnds by Scaning README.md

    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check code block state
        if (CODE_BLOCK_REGEX.test(line)) {
            inCodeBlock = !inCodeBlock;
            continue;
        }

        if (inCodeBlock) {
            continue;
        }

        // Match TOC Mark
        if (TOC_MARK_REGEX.test(line)) {
            tocMarks.push({
                lineIndex: i,
                originalText: line.trim(),
                hasMatchingEnd: false // default false, while later will adjust
            });
            continue;
        }

        // Match TOC End
        const endMatch = line.match(TOC_END_REGEX);
        if (endMatch) {
            // Parse offset, actually must not 0 if present
            const offset = endMatch[1] ? parseInt(endMatch[1], 10) : 0;
            tocEnds.push({
                lineIndex: i,
                offset: isNaN(offset) ? 0 : offset,
                hasMatchingMark: false // default false, while later will adjust
            });
        }
    }

    return { tocMarks, tocEnds };
}
