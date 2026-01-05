/**
 * Transform document: clean stale regions and inject new TOC
 * 
 * Two-phase design:
 * 1. Preview phase: buildCleanupPreview() - returns what will be deleted for user confirmation
 * 2. Execute phase: transformDocument() - performs the actual transformation
 * 
 * Note:
 * 一、Situations that require user confirmation
 * The isolated TOC_End and the old directory above it
 * An inactive complete area
 * Move forward the detected old content
 * 二、Situations that do not require confirmation
 * Content replacement between Active_Mark and its matching End
 */



import { CleanupPreview, DocumentAnalysis, RegionPreview, StaleRegion } from './types.js';

/**
 * Build preview of what will be cleaned (for user confirmation)
 * Only stale regions require confirmation, normal TOC update does not.
 */
export function buildCleanupPreview(analysis: DocumentAnalysis): CleanupPreview {
    const { lines, staleRegions } = analysis;

    if (staleRegions.length === 0) {
        return {
            needsCleanup: false,
            regions: [],
            summary: ''
        };
    }

    const regions: RegionPreview[] = staleRegions.map((region, index) => ({
        regionIndex: index + 1,
        startLine: region.startLine,
        endLine: region.endLine,
        type: region.type,
        firstLineContent: lines[region.startLine] || '',
        lastLineContent: lines[region.endLine] || '',
        lineCount: region.endLine - region.startLine + 1
    }));

    const summary = formatCleanupSummary(regions);

    return {
        needsCleanup: true,
        regions,
        summary
    };
}

/**
 * Format cleanup summary for CLI display
 */
function formatCleanupSummary(regions: RegionPreview[]): string {
    const lines: string[] = [
        'Detected stale regions to clean:\n'
    ];

    for (const region of regions) {
        const typeLabel = getTypeLabel(region.type);
        lines.push(`Region ${region.regionIndex} [${typeLabel}] (line ${region.startLine + 1}-${region.endLine + 1}):`);
        lines.push(`  ${region.startLine + 1}: ${truncate(region.firstLineContent, 60)}`);

        if (region.lineCount > 2) {
            lines.push(`  ... (${region.lineCount - 2} more lines)`);
        }

        if (region.lineCount > 1) {
            lines.push(`  ${region.endLine + 1}: ${truncate(region.lastLineContent, 60)}`);
        }
        lines.push('');
    }

    lines.push('Tip: You can manually delete unwanted content（plase delete <!--tocEnd--> mark.） and keep only one <!--toc--> mark.');

    return lines.join('\n');
}

function getTypeLabel(type: StaleRegion['type']): string {
    switch (type) {
        case 'orphan-end': return 'orphan end tag';
        case 'complete': return 'duplicate region';
        case 'moved-content': return 'moved content';
        default: return 'unknown';
    }
}

function truncate(str: string, maxLen: number): string {
    const trimmed = str.trim();
    return trimmed.length > maxLen ? trimmed.slice(0, maxLen - 3) + '...' : trimmed;
}

/**
 * Transform document: clean stale regions and inject new TOC
 * Call this after user confirms cleanup (or if no cleanup needed)
 */
export function transformDocument(analysis: DocumentAnalysis, newToc: string): string[] {
    const { lines, staleRegions, activeMark } = analysis;

    // 1. Collect lines to remove
    const linesToRemove = new Set<number>();

    // A. Stale regions (user confirmed)
    for (const region of staleRegions) {
        for (let i = region.startLine; i <= region.endLine; i++) {
            linesToRemove.add(i);
        }
    }

    // B. Active region content (normal update, no confirmation needed)
    if (activeMark?.hasMatchingEnd && activeMark.matchingEndIndex !== undefined) {
        for (let i = activeMark.lineIndex + 1; i <= activeMark.matchingEndIndex; i++) {
            linesToRemove.add(i);
        }
    }

    // 2. Build new document
    const newLines: string[] = [];
    const tocContentLines = newToc.split('\n');
    const offset = tocContentLines.length;

    const tocBlock = [
        ...tocContentLines,
        `<!--tocEnd:offset=${offset}-->`
    ];

    for (let i = 0; i < lines.length; i++) {
        if (linesToRemove.has(i)) {
            continue;
        }

        newLines.push(lines[i]);

        // Inject after active mark
        if (activeMark && i === activeMark.lineIndex) {
            newLines.push(...tocBlock);
        }
    }

    // 3. Normalize blank lines
    return normalizeBlankLines(newLines);
}

/**
 * Remove consecutive blank lines (keep at most 2)
 */
function normalizeBlankLines(lines: string[]): string[] {
    const result: string[] = [];
    let consecutiveBlanks = 0;

    for (const line of lines) {
        const isBlank = line.trim() === '';

        if (isBlank) {
            consecutiveBlanks++;
            if (consecutiveBlanks > 2) {
                continue;
            }
        } else {
            consecutiveBlanks = 0;
        }

        result.push(line);
    }

    return result;
}
