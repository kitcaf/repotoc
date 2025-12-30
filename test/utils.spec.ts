import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { normalizeFullWidth } from '../src/utils.js';

describe('Smart Sorting Utils', () => {
    it('should convert fullwidth digits to halfwidth digits', () => {
        fc.assert(
            fc.property(
                // 生成 0-9 的随机数字数组
                fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 10 }),
                (digits) => {
                    // 构造全角数字字符串 (０-９ 的 Unicode 是 0xFF10-0xFF19)
                    const fullWidthStr = digits.map(d => String.fromCharCode(0xff10 + d)).join('');
                    // 期望的半角数字字符串
                    const halfWidthStr = digits.join('');

                    // 验证转换结果
                    const result = normalizeFullWidth(fullWidthStr);
                    return result === halfWidthStr;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should convert fullwidth letters to halfwidth letters', () => {
        fc.assert(
            fc.property(
                // 生成随机的大写字母 A-Z (65-90)
                fc.array(fc.integer({ min: 0, max: 25 }), { minLength: 1, maxLength: 10 }),
                (letterOffsets) => {
                    // 构造全角大写字母字符串 (Ａ-Ｚ 的 Unicode 是 0xFF21-0xFF3A)
                    const fullWidthStr = letterOffsets.map(o => String.fromCharCode(0xff21 + o)).join('');
                    // 期望的半角大写字母字符串
                    const halfWidthStr = letterOffsets.map(o => String.fromCharCode(65 + o)).join('');

                    const result = normalizeFullWidth(fullWidthStr);
                    return result === halfWidthStr;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle mixed fullwidth and halfwidth strings', () => {
        fc.assert(
            fc.property(
                fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 5 }),
                fc.string({ minLength: 1, maxLength: 5 }),
                (digits, suffix) => {
                    // 构造混合字符串：全角数字 + 半角后缀
                    const fullWidthDigits = digits.map(d => String.fromCharCode(0xff10 + d)).join('');
                    const mixedStr = fullWidthDigits + suffix;

                    // 期望结果：半角数字 + 原后缀
                    const expectedDigits = digits.join('');
                    const expectedResult = expectedDigits + normalizeFullWidth(suffix);

                    const result = normalizeFullWidth(mixedStr);
                    return result === expectedResult;
                }
            ),
            { numRuns: 100 }
        );
    });

});
