import { describe, it, expect } from 'vitest';
import { analyzeDocument } from '../src/injector/analyzer.js';
import { TocMarkInfo, TocEndInfo } from '../src/injector/types.js';

describe('Injector Analyzer', () => {
    describe('Active_Mark Identification', () => {
        it('should return null when no marks exist', () => {
            const lines = ['content'];
            const tocMarks: TocMarkInfo[] = [];
            const tocEnds: TocEndInfo[] = [];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            expect(result.activeMark).toBeNull();
        });

        it('should use single mark as active', () => {
            const lines = ['<!--toc-->', 'content'];
            const tocMarks: TocMarkInfo[] = [
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false }
            ];
            const tocEnds: TocEndInfo[] = [];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            expect(result.activeMark).toBe(tocMarks[0]);
        });

        it('should use last bare mark when multiple marks exist', () => {
            const lines = [
                '<!--toc-->',
                '- item',
                '<!--tocEnd:offset=1-->',
                '<!--toc-->'
            ];
            const tocMarks: TocMarkInfo[] = [
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false },
                { lineIndex: 3, originalText: '<!--toc-->', hasMatchingEnd: false }
            ];
            const tocEnds: TocEndInfo[] = [
                { lineIndex: 2, offset: 1, hasMatchingMark: false }
            ];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            expect(result.activeMark?.lineIndex).toBe(3);
        });

        it('should use first mark when all marks have matching ends', () => {
            const lines = [
                '<!--toc-->',
                '- item1',
                '<!--tocEnd:offset=1-->',
                '<!--toc-->',
                '- item2',
                '<!--tocEnd:offset=1-->'
            ];
            const tocMarks: TocMarkInfo[] = [
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false },
                { lineIndex: 3, originalText: '<!--toc-->', hasMatchingEnd: false }
            ];
            const tocEnds: TocEndInfo[] = [
                { lineIndex: 2, offset: 1, hasMatchingMark: false },
                { lineIndex: 5, offset: 1, hasMatchingMark: false }
            ];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            expect(result.activeMark?.lineIndex).toBe(0);
        });
    });

    describe('Stale Region Detection', () => {
        it('should detect orphan end tags', () => {
            const lines = [
                '- old item',
                '<!--tocEnd:offset=1-->',
                '<!--toc-->'
            ];
            const tocMarks: TocMarkInfo[] = [
                { lineIndex: 2, originalText: '<!--toc-->', hasMatchingEnd: false }
            ];
            const tocEnds: TocEndInfo[] = [
                { lineIndex: 1, offset: 1, hasMatchingMark: false }
            ];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            expect(result.staleRegions).toHaveLength(1);
            expect(result.staleRegions[0].type).toBe('orphan-end');
            expect(result.staleRegions[0].startLine).toBe(0);
            expect(result.staleRegions[0].endLine).toBe(1);
        });

        it('should detect non-active complete regions', () => {
            const lines = [
                '<!--toc-->',
                '- item1',
                '<!--tocEnd:offset=1-->',
                '<!--toc-->'
            ];
            const tocMarks: TocMarkInfo[] = [
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false },
                { lineIndex: 3, originalText: '<!--toc-->', hasMatchingEnd: false }
            ];
            const tocEnds: TocEndInfo[] = [
                { lineIndex: 2, offset: 1, hasMatchingMark: false }
            ];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            // The first mark pairs with the end, second mark is bare (active)
            // First complete region becomes stale
            const completeRegion = result.staleRegions.find(r => r.type === 'complete');
            expect(completeRegion).toBeDefined();
            expect(completeRegion!.startLine).toBe(0);
            expect(completeRegion!.endLine).toBe(2);

        });
    });

    describe('Move Detection', () => {
        it('should detect forward move when actual distance > offset', () => {
            const lines = [
                '<!--toc-->',
                'user content 1',
                'user content 2',
                '- old item',
                '<!--tocEnd:offset=1-->'
            ];
            const tocMarks: TocMarkInfo[] = [
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false }
            ];
            const tocEnds: TocEndInfo[] = [
                { lineIndex: 4, offset: 1, hasMatchingMark: false }
            ];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            const movedRegion = result.staleRegions.find(r => r.type === 'moved-content');
            expect(movedRegion).toBeDefined();
            expect(movedRegion?.startLine).toBe(3)
            expect(movedRegion?.endLine).toBe(4)
        });

        it('should not detect move when distance matches offset', () => {
            const lines = [
                '<!--toc-->',
                '- item1',
                '- item2',
                '<!--tocEnd:offset=2-->'
            ];
            const tocMarks: TocMarkInfo[] = [
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false }
            ];
            const tocEnds: TocEndInfo[] = [
                { lineIndex: 3, offset: 2, hasMatchingMark: false }
            ];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            expect(result.staleRegions.length).toBe(0)
            expect(result.staleRegions.filter(r => r.type === 'moved-content')).toHaveLength(0);
        });
    });

    describe('Pairing Logic', () => {
        it('should pair marks with nearest subsequent ends', () => {
            const lines = [
                '<!--toc-->',
                '- item',
                '<!--tocEnd:offset=1-->'
            ];
            const tocMarks: TocMarkInfo[] = [
                { lineIndex: 0, originalText: '<!--toc-->', hasMatchingEnd: false }
            ];
            const tocEnds: TocEndInfo[] = [
                { lineIndex: 2, offset: 1, hasMatchingMark: false }
            ];

            const result = analyzeDocument(lines, tocMarks, tocEnds);

            expect(result.tocMarks[0].hasMatchingEnd).toBe(true);
            expect(result.tocMarks[0].matchingEndIndex).toBe(2);
            expect(result.tocEnds[0].hasMatchingMark).toBe(true);
        });
    });
});
