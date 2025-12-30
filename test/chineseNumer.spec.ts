import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { chineseToNumber, extractChineseNumber } from '../src/chineseToNumber.js';

/**
 * 中文数字转换正确性
 */
describe('Extract the Chinese numerals', () => {
    // 基础中文数字映射
    const basicChineseDigits: [string, number][] = [
        ['零', 0], ['〇', 0],
        ['一', 1], ['壹', 1],
        ['二', 2], ['贰', 2], ['两', 2],
        ['三', 3], ['叁', 3],
        ['四', 4], ['肆', 4],
        ['五', 5], ['伍', 5],
        ['六', 6], ['陆', 6],
        ['七', 7], ['柒', 7],
        ['八', 8], ['捌', 8],
        ['九', 9], ['玖', 9],
    ];

    // 生成 1-9 的中文数字
    const chineseDigitArb = fc.constantFrom(
        '一', '二', '三', '四', '五', '六', '七', '八', '九'
    );

    // 生成 1-9 对应的数值
    const digitToNumber = (d: string): number => {
        const map: Record<string, number> = {
            '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
            '六': 6, '七': 7, '八': 8, '九': 9
        };
        return map[d] || 0;
    };

    /**
     * THE Sorter SHALL 支持基础中文数字：零一二三四五六七八九十百千万
     */
    it('should convert basic Chinese digits correctly', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...basicChineseDigits),
                ([chinese, expected]) => {
                    const result = chineseToNumber(chinese);
                    return result === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 十一→11, 二十→20, 二十三→23, 一百→100, 一百二十三→123, 三百零五→305
     */
    it('should convert compound Chinese numbers (十X format) correctly', () => {
        fc.assert(
            fc.property(
                // 生成 11-19 的数字：十一 到 十九
                fc.integer({ min: 1, max: 9 }),
                (units) => {
                    const digitMap = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
                    const chinese = '十' + digitMap[units];
                    const expected = 10 + units;
                    const result = chineseToNumber(chinese);
                    return result === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should convert compound Chinese numbers (X十Y format) correctly', () => {
        fc.assert(
            fc.property(
                // 生成 20-99 的数字：二十 到 九十九
                fc.integer({ min: 2, max: 9 }),
                fc.integer({ min: 0, max: 9 }),
                (tens, units) => {
                    const digitMap = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
                    const chinese = digitMap[tens] + '十' + (units > 0 ? digitMap[units] : '');
                    const expected = tens * 10 + units;
                    const result = chineseToNumber(chinese);
                    return result === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should convert hundred-level Chinese numbers correctly', () => {
        fc.assert(
            fc.property(
                // 生成 100-999 的数字
                fc.integer({ min: 1, max: 9 }),
                fc.integer({ min: 0, max: 9 }),
                fc.integer({ min: 0, max: 9 }),
                (hundreds, tens, units) => {
                    const digitMap = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
                    let chinese = digitMap[hundreds] + '百';

                    if (tens > 0) {
                        chinese += digitMap[tens] + '十';
                        if (units > 0) {
                            chinese += digitMap[units];
                        }
                    } else if (units > 0) {
                        // 三百零五 格式
                        chinese += '零' + digitMap[units];
                    }

                    const expected = hundreds * 100 + tens * 10 + units;
                    const result = chineseToNumber(chinese);
                    return result === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 第X章/节/部分, 中文序号（一、）, 带括号格式
     */
    it('should extract Chinese numbers with 第X章 format', () => {
        fc.assert(
            fc.property(
                chineseDigitArb,
                fc.constantFrom('章', '节', '部分', '篇', '卷'),
                fc.string({ minLength: 0, maxLength: 5 }),
                (digit, suffix, rest) => {
                    const name = `第${digit}${suffix}${rest}`;
                    const result = extractChineseNumber(name);
                    const expected = digitToNumber(digit);
                    return result !== null && result[0] === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should extract Chinese numbers with 顿号 format (一、)', () => {
        fc.assert(
            fc.property(
                chineseDigitArb,
                fc.string({ minLength: 0, maxLength: 5 }),
                (digit, rest) => {
                    const name = `${digit}、${rest}`;
                    const result = extractChineseNumber(name);
                    const expected = digitToNumber(digit);
                    return result !== null && result[0] === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should extract Chinese numbers with bracket formats', () => {
        fc.assert(
            fc.property(
                chineseDigitArb,
                fc.constantFrom(
                    ['（', '）'],
                    ['(', ')'],
                    ['【', '】'],
                    ['〔', '〕'],
                    ['[', ']']
                ),
                fc.string({ minLength: 0, maxLength: 5 }),
                (digit, [open, close], rest) => {
                    const name = `${open}${digit}${close}${rest}`;
                    const result = extractChineseNumber(name);
                    const expected = digitToNumber(digit);
                    return result !== null && result[0] === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * WHEN 中文数字后有分隔符（、, ）, 】, 〕, 空格）THEN THE Sorter SHALL 正确识别边界
     */
    it('should correctly identify boundaries after Chinese numbers', () => {
        fc.assert(
            fc.property(
                chineseDigitArb,
                fc.constantFrom('、', ' ', ')', '）', '】', '〕', ']'),
                fc.string({ minLength: 1, maxLength: 5 }),
                (digit, separator, rest) => {
                    // 对于顿号，直接使用 X、rest 格式
                    if (separator === '、') {
                        const name = `${digit}${separator}${rest}`;
                        const result = extractChineseNumber(name);
                        const expected = digitToNumber(digit);
                        return result !== null && result[0] === expected;
                    }
                    // 对于括号类分隔符，需要有对应的开括号
                    const bracketMap: Record<string, string> = {
                        ')': '(',
                        '）': '（',
                        '】': '【',
                        '〕': '〔',
                        ']': '['
                    };
                    if (bracketMap[separator]) {
                        const name = `${bracketMap[separator]}${digit}${separator}${rest}`;
                        const result = extractChineseNumber(name);
                        const expected = digitToNumber(digit);
                        return result !== null && result[0] === expected;
                    }
                    // 空格分隔符 - 纯中文数字开头后跟空格
                    const name = `${digit}${separator}${rest}`;
                    const result = extractChineseNumber(name);
                    const expected = digitToNumber(digit);
                    return result !== null && result[0] === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 复合中文数字在前缀格式中的测试
     */
    it('should extract compound Chinese numbers in prefix formats', () => {
        // 测试 第十一章, 第二十三节 等格式
        const compoundCases: [string, number][] = [
            ['第十章', 10],
            ['第十一章', 11],
            ['第二十章', 20],
            ['第二十三章', 23],
            ['（十一）', 11],
            ['【二十】', 20],
        ];

        for (const [name, expected] of compoundCases) {
            const result = extractChineseNumber(name);
            expect(result).not.toBeNull();
            expect(result![0]).toBe(expected);
        }
    });
});