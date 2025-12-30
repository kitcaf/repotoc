import { describe, it, expect } from 'vitest';
import { extractArabicNumber } from '../src/arabicToNumber';

describe('Arabic Number Extraction (Vitest Simplified)', () => {
    describe('Single Level Number', () => {
        it.each([
            // [文件名, 期望结果]
            ['01_intro.md', [1]],       // 下划线
            ['1-guide.txt', [1]],       // 横线
            ['100.setup.ts', [100]],    // 点
            ['5 space.doc', [5]],       // 空格
            ['007_bond', [7]],          // 多重前导零
            ['1', [1]],                 // 纯数字无后缀
            ['1.md', [1]],              // 仅有扩展名
        ])('should extract number from "%s"', (input, expected) => {
            expect(extractArabicNumber(input)).toEqual(expected);
        });
    });

    describe('Multi-level Numbering', () => {
        it.each([
            ['1.2.3 section.md', [1, 2, 3]],       // 标准点分隔
            ['1-2-part-two.txt', [1, 2]],          // 横线分隔
            ['1-2 part-two.txt', [1, 2]],          // 下滑线分隔
            ['01.02.03_deep', [1, 2, 3]],          // 带前导零的多级
            ['1.10.100-end', [1, 10, 100]],        // 数字位数不同
        ])('should extract multi-level numbers from "%s"', (input, expected) => {
            expect(extractArabicNumber(input)).toEqual(expected);
        });
    });

    describe('Separators & Edge Cases', () => {
        it('should stop extraction at non-numeric separator (e.g. underscore)', () => {
            expect(extractArabicNumber('1.2.3_v2.md')).toEqual([1, 2, 3]);
        });

        it('should return null for non-numeric start', () => {
            expect(extractArabicNumber('intro_01.md')).toBeNull();
            expect(extractArabicNumber('a1_test.ts')).toBeNull();
            expect(extractArabicNumber('_01_hidden')).toBeNull();
        });

        it('should handle Mixed delimiters if supported', () => {
            expect(extractArabicNumber('1-2.3_mix')).toEqual([1, 2, 3]);
        });
    });

});