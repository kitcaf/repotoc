import { describe, it, expect } from 'vitest';
import { buildCleanupPreview, transformDocument } from '../src/injector/transformer.js';
import { DocumentAnalysis, TocMarkInfo, TocEndInfo, StaleRegion } from '../src/injector/types.js';

// Helper to create analysis object
function createAnalysis(
    lines: string[],
    activeMark: TocMarkInfo | null,
    staleRegions: StaleRegion[] = [],
    tocMarks: TocMarkInfo[] = [],
    tocEnds: TocEndInfo[] = []
): DocumentAnalysis {
    return {
        lines,
        tocMarks: activeMark ? [activeMark, ...tocMarks] : tocMarks,
        tocEnds,
        activeMark,
        staleRegions,
        moveDetected: staleRegions.length > 0
    };
}

describe('Injector Transformer', () => {
    describe('buildCleanupPreview', () => {
        it('should return needsCleanup=false when no stale regions', () => {
            const analysis = createAnalysis(
                ['<!--toc-->', 'content'],
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false }
            );

            const preview = buildCleanupPreview(analysis);

            expect(preview.needsCleanup).toBe(false);
            expect(preview.regions).toHaveLength(0);
        });

        it('should return preview info for stale regions', () => {
            const lines = ['- old item', '<!--tocEnd:offset=1-->', '<!--toc-->'];
            const analysis = createAnalysis(
                lines,
                { lineIndex: 2, originalText: '<!--toc-->', hasMatchingEnd: false },
                [{ type: 'orphan-end', startLine: 0, endLine: 1 }]
            );

            const preview = buildCleanupPreview(analysis);

            expect(preview.needsCleanup).toBe(true);
            expect(preview.regions).toHaveLength(1);
            expect(preview.regions[0].startLine).toBe(0);
            expect(preview.regions[0].endLine).toBe(1);
            expect(preview.regions[0].type).toBe('orphan-end');
        });

        it('should include summary with line numbers', () => {
            const lines = ['- old item', '<!--tocEnd:offset=1-->'];
            const analysis = createAnalysis(
                lines,
                null,
                [{ type: 'orphan-end', startLine: 0, endLine: 1 }]
            );

            const preview = buildCleanupPreview(analysis);

            expect(preview.summary).toContain('line 1-2');
            expect(preview.summary).toContain('orphan end tag');
        });
    });

    describe('transformDocument', () => {
        it('should inject TOC after active mark', () => {
            const lines = ['# Title', '<!--toc-->', 'footer'];
            const analysis = createAnalysis(
                lines,
                { lineIndex: 1, originalText: '<!--toc-->', hasMatchingEnd: false }
            );

            const result = transformDocument(analysis, '- item1\n- item2');

            expect(result).toContain('<!--toc-->');
            expect(result).toContain('- item1');
            expect(result).toContain('- item2');
            expect(result.some(l => l.includes('tocEnd:offset=2'))).toBe(true);
        });

        it('should replace content between active mark and its end', () => {
            const lines = [
                '# Title',
                '<!--toc-->',
                '- old item',
                '<!--tocEnd:offset=1-->',
                'footer'
            ];
            const activeMark: TocMarkInfo = {
                lineIndex: 1,
                originalText: '<!--toc-->',
                hasMatchingEnd: true,
                matchingEndIndex: 3
            };
            const analysis = createAnalysis(lines, activeMark);

            const result = transformDocument(analysis, '- new item');

            expect(result).not.toContain('- old item');
            expect(result).toContain('- new item');
            expect(result).toContain('footer');
        });

        it('should remove stale regions', () => {
            const lines = [
                '- stale item',
                '<!--tocEnd:offset=1-->',
                '<!--toc-->',
                'footer'
            ];
            const analysis = createAnalysis(
                lines,
                { lineIndex: 2, originalText: '<!--toc-->', hasMatchingEnd: false },
                [{ type: 'orphan-end', startLine: 0, endLine: 1 }]
            );

            const result = transformDocument(analysis, '- new item');

            expect(result).not.toContain('- stale item');
            expect(result).not.toContain('<!--tocEnd:offset=1-->');
            expect(result).toContain('- new item');
            expect(result).toContain('footer');
        });

        it('should generate correct offset in end tag', () => {
            const lines = ['<!--toc-->', 'footer'];
            const analysis = createAnalysis(
                lines,
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false }
            );

            const result = transformDocument(analysis, '- item1\n- item2\n- item3');

            const endTagLine = result.find(l => l.includes('tocEnd'));
            expect(endTagLine).toContain('offset=3');
        });

        it('should normalize consecutive blank lines', () => {
            const lines = ['<!--toc-->', '', '', '', '', 'footer'];
            const analysis = createAnalysis(
                lines,
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false }
            );

            const result = transformDocument(analysis, '- item');

            // Count consecutive blank lines
            let maxConsecutive = 0;
            let current = 0;
            for (const line of result) {
                if (line.trim() === '') {
                    current++;
                    maxConsecutive = Math.max(maxConsecutive, current);
                } else {
                    current = 0;
                }
            }

            expect(maxConsecutive).toBeLessThanOrEqual(2);
        });

        it('should preserve user content outside TOC region', () => {
            const lines = [
                '# Title',
                'Introduction paragraph',
                '<!--toc-->',
                '- old item',
                '<!--tocEnd:offset=1-->',
                'Footer content',
                'More footer'
            ];
            const activeMark: TocMarkInfo = {
                lineIndex: 2,
                originalText: '<!--toc-->',
                hasMatchingEnd: true,
                matchingEndIndex: 4
            };
            const analysis = createAnalysis(lines, activeMark);

            const result = transformDocument(analysis, '- new item');

            expect(result).toContain('# Title');
            expect(result).toContain('Introduction paragraph');
            expect(result).toContain('Footer content');
            expect(result).toContain('More footer');
        });
    });
});
