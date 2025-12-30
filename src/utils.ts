import { extractArabicNumber } from "./arabicToNumber.js";
import { extractChineseNumber } from "./chineseToNumber.js";
import { extractRomanNumber } from "./romanToNumber.js";

/**
 * 排序键类型
 * - number[]: 多级编号，如 [1, 2, 3] 表示 "1.2.3"
 * - null: 无法提取数字，使用默认排序
 */
export type SortKey = number[] | null;

/**
 * 使用 Intl.Collator 支持 "Numeric" 模式，解决 10 排在 2 前面的问题
 */
export const naturalSorter = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base'
}).compare;

/**
 * 全角字符转半角字符
 * 主要处理全角数字 ０-９ 转换为半角 0-9
 * 同时处理全角空格和其他常见全角字符
 * @param str 输入字符串
 * @returns 转换后的字符串
 */
export function normalizeFullWidth(str: string): string {
    return str.replace(/[\uff00-\uffef]/g, (char) => {
        const code = char.charCodeAt(0);
        // 全角字符范围 0xFF01-0xFF5E 对应半角 0x21-0x7E
        // 全角空格 0x3000 对应半角空格 0x20
        if (code === 0x3000) {
            return ' ';
        }
        if (code >= 0xff01 && code <= 0xff5e) {
            return String.fromCharCode(code - 0xfee0);
        }
        return char;
    });
}

/**
 * 从文件/文件夹名提取排序键
 * 按优先级尝试：阿拉伯数字 → 中文数字 → 罗马数字
 * @param name 文件名（不含路径，可含扩展名）
 * @returns SortKey 数值数组或 null
 */
export function extractSortKey(name: string): SortKey {
    if (!name || name.length === 0) {
        return null;
    }

    // 优先级 1：阿拉伯数字/多级编号（最常见）
    const arabicResult = extractArabicNumber(name);
    if (arabicResult !== null) {
        return arabicResult;
    }

    // 优先级 2：中文数字前缀
    const chineseResult = extractChineseNumber(name);
    if (chineseResult !== null) {
        return chineseResult;
    }

    // 优先级 3：罗马数字前缀
    const romanResult = extractRomanNumber(name);
    if (romanResult !== null) {
        return romanResult;
    }

    // 无法识别，返回 null
    return null;
}

/**
 * 比较两个排序键
 * - 多级编号逐级比较
 * - 短编号排在前面（[1] < [1, 1]）
 * - null 值排在最后
 * @param a 第一个排序键
 * @param b 第二个排序键
 * @returns 负数表示 a < b，正数表示 a > b，0 表示相等
 */
export function compareSortKeys(a: SortKey, b: SortKey): number {
    // null 值排在最后
    if (a === null && b === null) {
        return 0;
    }
    if (a === null) {
        return 1; // a 排在后面
    }
    if (b === null) {
        return -1; // b 排在后面
    }

    // 逐级比较多级编号
    const minLength = Math.min(a.length, b.length);
    for (let i = 0; i < minLength; i++) {
        if (a[i] !== b[i]) {
            return a[i] - b[i];
        }
    }

    // 如果前面都相等，短编号排在前面
    return a.length - b.length;
}