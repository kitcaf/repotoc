/**
 * Injector Module - Main Entry
 * 
 * Workflow:
 * 1. Read file content
 * 2. Scan tags (TOC_Mark and TOC_End)
 * 3. Analyze document state (identify Active_Mark and stale regions)
 * 4. If stale regions exist, prompt user for confirmation
 * 5. Transform document (clean stale regions + inject new TOC)
 * 6. Write back to file
 */

import fs from 'fs/promises';
import { scanTags } from './scanner.js';
import { analyzeDocument } from './analyzer.js';
import { buildCleanupPreview, transformDocument } from './transformer.js';
import { InjectionResult, InjectorOptions } from './types.js';

// Re-export types for external use
export * from './types.js';
export { buildCleanupPreview } from './transformer.js';

/**
 * Update TOC in target file
 * 
 * @param filePath - Target markdown file path
 * @param newToc - New TOC content to inject
 * @param options - Injector options (confirmation callback, autoApprove)
 * @returns Injection result
 */
export async function updateReadme(
    filePath: string,
    newToc: string,
    options: InjectorOptions = {}
): Promise<InjectionResult> {
    const { onCleanupConfirm, autoApprove = false } = options;

    // 1. Read file
    let content: string;
    try {
        content = await fs.readFile(filePath, 'utf-8');
    } catch {
        return {
            success: false,
            message: `Failed to read file: ${filePath}`,
            cleanedRegions: 0,
            moveDetected: false
        };
    }

    // 2. Scan tags
    const lines = content.split('\n');
    const { tocMarks, tocEnds } = scanTags(lines);

    // 3. Check if TOC_Mark exists
    if (tocMarks.length === 0) {
        // Clean orphan ends if any
        if (tocEnds.length > 0) {
            const analysis = analyzeDocument(lines, tocMarks, tocEnds);
            const newLines = transformDocument(analysis, '');
            await fs.writeFile(filePath, newLines.join('\n'));
        }
        return {
            success: false,
            message: 'No <!--toc--> mark found. Please add <!--toc--> where you want the TOC to appear.',
            cleanedRegions: tocEnds.length,
            moveDetected: false
        };
    }

    // 4. Analyze document
    const analysis = analyzeDocument(lines, tocMarks, tocEnds);

    // 5. Handle stale regions (require confirmation)
    if (analysis.staleRegions.length > 0) {
        const preview = buildCleanupPreview(analysis);

        if (!autoApprove && onCleanupConfirm) {
            const confirmed = await onCleanupConfirm({
                regions: analysis.staleRegions,
                totalLines: preview.regions.reduce((sum, r) => sum + r.lineCount, 0),
                description: preview.summary
            });

            if (!confirmed) { // Refuse to update the directory
                return {
                    success: false,
                    message: 'Cleanup cancelled by user.',
                    cleanedRegions: 0,
                    moveDetected: analysis.moveDetected
                };
            }
        } else if (!autoApprove) {
            // No callback provided and not auto-approve, return preview for manual handling
            return {
                success: false,
                message: preview.summary,
                cleanedRegions: 0,
                moveDetected: analysis.moveDetected
            };
        }
    }

    // 6. Transform document
    const newLines = transformDocument(analysis, newToc);

    // 7. Write back
    try {
        await fs.writeFile(filePath, newLines.join('\n'));
    } catch {
        return {
            success: false,
            message: `Failed to write file: ${filePath}`,
            cleanedRegions: 0,
            moveDetected: analysis.moveDetected
        };
    }

    return {
        success: true,
        message: 'TOC updated successfully.',
        cleanedRegions: analysis.staleRegions.length,
        moveDetected: analysis.moveDetected
    };
}
