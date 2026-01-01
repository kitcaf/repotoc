// test/utils.spec.ts
import { describe, it, expect } from 'vitest';
import { extractSortKey, compareSortKeys, calculatePathPrefix } from '../src/utils';

describe('calculatePathPrefix', () => {
    // README: ./README.md
    // Scan:   ./docs
    // Link:   docs/xxx.md
    it('should return sub-directory name when scanning a sub-folder from root', () => {
        const prefix = calculatePathPrefix('README.md', 'docs');
        expect(prefix).toBe('docs');
    });

    // README: ./README.md
    // Scan:   ./
    // Link:   ./xxx.md
    it('should return "." when scanning the same directory', () => {
        expect(calculatePathPrefix('./README.md', './')).toBe('.');
        expect(calculatePathPrefix('README.md', '.')).toBe('.');
    });

    // README: ./packages/pkg-a/README.md
    // Scan:   ./packages/pkg-b/docs
    // Link:   ../pkg-b/docs/xxx.md
    it('should handle sibling directories correctly', () => {
        const prefix = calculatePathPrefix('packages/pkg-a/README.md', 'packages/pkg-b/docs');
        expect(prefix).toBe('../pkg-b/docs');
    });

    it('should handle deep nesting', () => {
        const prefix = calculatePathPrefix('a/b/c/README.md', 'a/b/d/e');
        // c -> b (..) -> d -> e
        expect(prefix).toBe('../d/e');
    });

    // Although CLI typically handles relative paths, 
    // path.relative supports absolute paths
    it('should handle absolute paths', () => {
        const readme = '/usr/user/project/README.md';
        const scan = '/usr/user/project/src';
        expect(calculatePathPrefix(readme, scan)).toBe('src');
    });

    it('should ensure output uses forward slashes', () => {
        const prefix = calculatePathPrefix('README.md', 'docs/api');
        expect(prefix).not.toContain('\\');
        expect(prefix).toBe('docs/api');
    });
});


describe('Utils Core Logic', () => {
    describe('extractSortKey', () => {
        describe('Arabic Number Priority', () => {
            it.each([
                // [input, expected] - Arabic numbers should be extracted first
                ['1.md', [1]],
                ['01_intro.md', [1]],
                ['1-guide.txt', [1]],
                ['100.setup.ts', [100]],
                ['5 space.doc', [5]],
                ['007_bond', [7]],
                ['1', [1]],
                ['123', [123]],
            ])('should extract Arabic number from "%s"', (input, expected) => {
                expect(extractSortKey(input)).toEqual(expected);
            });
        });

        describe('Multi-level Arabic Numbers', () => {
            it.each([
                ['1.2.3 section.md', [1, 2, 3]],
                ['1-2-part.txt', [1, 2]],
                ['01.02.03_deep', [1, 2, 3]],
                ['1.10.100-end', [1, 10, 100]],
                ['1-2.3_mix', [1, 2, 3]],
                ['2.1', [2, 1]],
                ['1.1.1', [1, 1, 1]],
            ])('should extract multi-level numbers from "%s"', (input, expected) => {
                expect(extractSortKey(input)).toEqual(expected);
            });
        });

        describe('Chinese Number Fallback', () => {
            it.each([
                // Chinese numbers when no Arabic prefix
                ['第一章', [1]],
                ['第二节', [2]],
                ['第十一部分', [11]],
                ['一、概述', [1]],
                ['二、进阶', [2]],
                ['（一）概述', [1]],
                ['(二)进阶', [2]],
                ['【三】高级', [3]],
                ['第二十三章', [23]],
                ['第一百章', [100]],
            ])('should extract Chinese number from "%s"', (input, expected) => {
                expect(extractSortKey(input)).toEqual(expected);
            });
        });

        describe('Roman Number Fallback', () => {
            it.each([
                // Roman numbers when no Arabic or Chinese prefix
                ['I.intro', [1]],
                ['II.setup', [2]],
                ['III-guide', [3]],
                ['IV_chapter', [4]],
                ['V section', [5]],
                ['IX.advanced', [9]],
                ['X.final', [10]],
                ['XI.appendix', [11]],
                ['XX.extra', [20]],
            ])('should extract Roman number from "%s"', (input, expected) => {
                expect(extractSortKey(input)).toEqual(expected);
            });
        });

        describe('No Match Cases', () => {
            it.each([
                ['README.md', null],
                ['Introduction', null],
                ['index.ts', null],
                ['', null],
                ['_hidden', null],
                ['abc', null],
            ])('should return null for "%s"', (input, expected) => {
                expect(extractSortKey(input)).toEqual(expected);
            });
        });

        describe('Priority Order: Arabic > Chinese > Roman', () => {
            it('should prefer Arabic over Chinese when both could match', () => {
                // "1第一章" starts with Arabic, so Arabic wins
                expect(extractSortKey('1第一章')).toEqual([1]);
            });

            it('should prefer Arabic over Roman when both could match', () => {
                // "1.intro" starts with Arabic
                expect(extractSortKey('1.intro')).toEqual([1]);
            });

            it('should use Chinese when Arabic not present', () => {
                expect(extractSortKey('第一章intro')).toEqual([1]);
            });

            it('should use Roman when Arabic and Chinese not present', () => {
                expect(extractSortKey('IV.intro')).toEqual([4]);
            });
        });

        describe('Edge Cases', () => {
            it('should handle fullwidth numbers', () => {
                // Fullwidth numbers should be normalized and extracted
                expect(extractSortKey('１２３.md')).toEqual([123]);
            });

            it('should handle mixed separators', () => {
                expect(extractSortKey('1.2-3_intro')).toEqual([1, 2, 3]);
            });

            it('should handle large numbers', () => {
                expect(extractSortKey('99999_intro.md')).toEqual([99999]);
            });

            it('should handle deeply nested levels', () => {
                expect(extractSortKey('1.2.3.4.5')).toEqual([1, 2, 3, 4, 5]);
            });
        });
    });

    describe('compareSortKeys', () => {
        describe('Null Handling', () => {
            it('should treat null as greater (comes last)', () => {
                expect(compareSortKeys(null, [1])).toBeGreaterThan(0);
            });

            it('should treat non-null as smaller (comes first)', () => {
                expect(compareSortKeys([1], null)).toBeLessThan(0);
            });

            it('should treat two nulls as equal', () => {
                expect(compareSortKeys(null, null)).toBe(0);
            });

            it('should sort null after any number', () => {
                expect(compareSortKeys(null, [0])).toBeGreaterThan(0);
                expect(compareSortKeys(null, [999])).toBeGreaterThan(0);
                expect(compareSortKeys(null, [1, 2, 3])).toBeGreaterThan(0);
            });
        });

        describe('Single Level Comparison', () => {
            it.each([
                [[1], [2], -1],
                [[2], [1], 1],
                [[5], [5], 0],
                [[10], [2], 1],
                [[1], [10], -1],
                [[0], [1], -1],
                [[100], [99], 1],
            ])('compareSortKeys(%j, %j) should be %s', (a, b, expectedSign) => {
                const result = compareSortKeys(a, b);
                if (expectedSign < 0) {
                    expect(result).toBeLessThan(0);
                } else if (expectedSign > 0) {
                    expect(result).toBeGreaterThan(0);
                } else {
                    expect(result).toBe(0);
                }
            });
        });

        describe('Multi-level Comparison', () => {
            it('should compare first level first', () => {
                expect(compareSortKeys([1, 9], [2, 1])).toBeLessThan(0);
                expect(compareSortKeys([2, 1], [1, 9])).toBeGreaterThan(0);
            });

            it('should compare second level when first is equal', () => {
                expect(compareSortKeys([1, 1], [1, 2])).toBeLessThan(0);
                expect(compareSortKeys([1, 2], [1, 1])).toBeGreaterThan(0);
                expect(compareSortKeys([1, 5], [1, 5])).toBe(0);
            });

            it('should compare third level when first two are equal', () => {
                expect(compareSortKeys([1, 2, 1], [1, 2, 2])).toBeLessThan(0);
                expect(compareSortKeys([1, 2, 3], [1, 2, 1])).toBeGreaterThan(0);
            });

            it.each([
                [[1, 1], [1, 2], -1],
                [[1, 2], [1, 10], -1],
                [[1, 10], [2, 1], -1],
                [[1, 1, 1], [1, 1, 2], -1],
                [[1, 1, 1], [1, 2, 1], -1],
                [[2, 1], [1, 10], 1],
                [[1, 10, 2], [1, 2, 20], 1],
            ])('compareSortKeys(%j, %j) should be %s', (a, b, expectedSign) => {
                const result = compareSortKeys(a, b);
                if (expectedSign < 0) {
                    expect(result).toBeLessThan(0);
                } else if (expectedSign > 0) {
                    expect(result).toBeGreaterThan(0);
                } else {
                    expect(result).toBe(0);
                }
            });
        });

        describe('Different Depth Comparison (Shorter is Smaller)', () => {
            it('should treat shorter array as smaller when prefix matches', () => {
                expect(compareSortKeys([1], [1, 1])).toBeLessThan(0);
                expect(compareSortKeys([1, 1], [1])).toBeGreaterThan(0);
            });

            it.each([
                [[1], [1, 1], -1],
                [[1, 1], [1], 1],
                [[1, 2], [1, 2, 1], -1],
                [[1, 2, 1], [1, 2], 1],
                [[2], [2, 0], -1],
                [[1, 1, 1], [1, 1, 1, 1], -1],
            ])('compareSortKeys(%j, %j) should be %s (depth difference)', (a, b, expectedSign) => {
                const result = compareSortKeys(a, b);
                if (expectedSign < 0) {
                    expect(result).toBeLessThan(0);
                } else if (expectedSign > 0) {
                    expect(result).toBeGreaterThan(0);
                } else {
                    expect(result).toBe(0);
                }
            });
        });

        describe('Equal Arrays', () => {
            it.each([
                [[1], [1]],
                [[1, 2], [1, 2]],
                [[1, 2, 3], [1, 2, 3]],
                [[0], [0]],
                [[100, 200, 300], [100, 200, 300]],
            ])('compareSortKeys(%j, %j) should be 0', (a, b) => {
                expect(compareSortKeys(a, b)).toBe(0);
            });
        });

        describe('Sorting Array with compareSortKeys', () => {
            it('should sort an array of SortKeys correctly', () => {
                const keys = [[2], [1, 1], [1], [1, 2], null, [1, 1, 1]];
                const sorted = [...keys].sort(compareSortKeys);
                expect(sorted).toEqual([[1], [1, 1], [1, 1, 1], [1, 2], [2], null]);
            });

            it('should sort complex multi-level keys', () => {
                const keys = [[1, 10], [1, 2], [2, 1], [1, 1]];
                const sorted = [...keys].sort(compareSortKeys);
                expect(sorted).toEqual([[1, 1], [1, 2], [1, 10], [2, 1]]);
            });

            it('should sort with nulls at the end', () => {
                const keys = [null, [1], null, [2], [1, 1]];
                const sorted = [...keys].sort(compareSortKeys);
                expect(sorted).toEqual([[1], [1, 1], [2], null, null]);
            });
        });
    });
});
