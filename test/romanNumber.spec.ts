// test/extractRomanNumber.test.ts
import { describe, it, expect } from 'vitest';
import { extractRomanNumber } from '../src/romanToNumber'; // 假设你的 utils.ts 在这里

describe('extractRomanNumber', () => {

    describe('Basic recognition ability', () => {
        it.each([
            ['I. Intro', 1],
            ['II_Section', 2],
            ['III-Part', 3],
            ['IV Setup', 4],
            ['V.md', 5],
            ['IX_end', 9],
            ['X-files', 10],
            ['XI.txt', 11],
            ['L_large', 50],
            ['C_century', 100],
            ['D_data', 500],
            ['M_millennium', 1000],
        ])('Roman numeral prefixes should be correctly identified: "%s" -> %i', (input, expected) => {
            expect(extractRomanNumber(input)).toEqual([expected]);
        });

        it('Pure Roman numeral file names should be supported', () => {
            expect(extractRomanNumber('I')).toEqual([1]);
            expect(extractRomanNumber('x')).toEqual([10]);
        });
    });

    describe('Case compatibility', () => {
        it.each([
            ['i. test', 1],
            ['v_version', 5],
            ['x-file', 10],
            ['mc.md', 1100], // M(1000) + C(100)
        ])('Lowercase Roman numerals should be supported: "%s"', (input, expected) => {
            expect(extractRomanNumber(input)).toEqual([expected]);
        });
    });

    describe('Separator recognition', () => {
        it.each([
            ['I.Test', 1],    // 点
            ['II-Test', 2],   // 横线
            ['III_Test', 3],  // 下划线
            ['IV Test', 4],   // 空格
        ])('Different delimiters should be supported', (input, expected) => {
            expect(extractRomanNumber(input)).toEqual([expected]);
        });
    });

    describe('Common word misjudgment protection', () => {
        it.each([
            ['Introduction', null], // 以 I 开头，但后面是 n (字母)，且无分隔符
            ['Image.png', null],    // I, m 也是罗马字符(1000)，但 a 不是，且 im 后面紧跟 a
            ['Version 1', null],    // V 开头，后面 e
            ['List', null],         // L 开头，后面 i
            ['Civil', null],        // C 开头，i 也是罗马字符...
            ['Level', null],        // L 开头，e 是字母且非分隔符 -> null
            ['Model', null],
            ['Xylophone', null],    // X 开头，y 非罗马 -> null
        ])('Ordinary words should not be used "%s" It was wrongly judged as a Roman numeral', (input, expected) => {
            expect(extractRomanNumber(input)).toEqual(expected);
        });
    });

    describe('Full-width character support', () => {
        it('Full-width Roman numerals and delimiters should be supported', () => {
            expect(extractRomanNumber('Ｉ．　测试')).toEqual([1]);
            expect(extractRomanNumber('Ｖ＿测试')).toEqual([5]);
        });
    });

    describe('Exceptions and empty input', () => {
        it('An empty string or null should return null', () => {
            expect(extractRomanNumber('')).toBeNull();
        });

        it('No Roman numeral prefix should be returned null', () => {
            expect(extractRomanNumber('1. Test')).toBeNull(); // 阿拉伯数字
            expect(extractRomanNumber('你好')).toBeNull();      // 中文
            expect(extractRomanNumber('test.md')).toBeNull();   // 小写非罗马开头
        });
    });
});