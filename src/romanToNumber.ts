import { ROMAN_VALUES } from "./constants.js";
import { normalizeFullWidth, SortKey } from "./utils.js";

/**
 * 将罗马数字字符串转换为阿拉伯数字
 * 支持 I, V, X, L, C, D, M 及其组合
 * 处理减法规则：IV=4, IX=9, XL=40, XC=90, CD=400, CM=900
 * @param roman 罗马数字字符串（大小写均可）
 * @returns 转换后的阿拉伯数字，如果无法转换则返回 null
 */
export function romanToNumber(roman: string): number | null {
    if (!roman || roman.length === 0) {
        return null;
    }

    // 转换为大写进行处理
    const upperRoman = roman.toUpperCase();

    // 验证是否只包含有效的罗马数字字符
    for (const char of upperRoman) {
        if (!(char in ROMAN_VALUES)) {
            return null;
        }
    }

    let result = 0;
    let prevValue = 0;

    // 从右向左遍历，处理减法规则
    for (let i = upperRoman.length - 1; i >= 0; i--) {
        const currentValue = ROMAN_VALUES[upperRoman[i]];

        // 如果当前值小于前一个值，则减去（减法规则）
        // 例如 IV: I(1) < V(5)，所以 5 - 1 = 4
        if (currentValue < prevValue) {
            result -= currentValue;
        } else {
            result += currentValue;
        }

        prevValue = currentValue;
    }

    return result > 0 ? result : null;
}

/**
 * 校验字符串是否符合严格的罗马数字结构
 * 规则：Thousands(M) + Hundreds(C/D) + Tens(X/L) + Units(I/V)
 */
 
function isValidRomanStructure(roman: string): boolean {
    // 严格罗马数字正则
    // M* : 千位 (0-N个M)
    // (CM|CD|D?C{0,3}) : 百位 (900, 400, 0-300, 500-800)
    // (XC|XL|L?X{0,3}) : 十位 (90, 40, 0-30, 50-80)
    // (IX|IV|V?I{0,3}) : 个位 (9, 4, 0-3, 5-8)
    const strictRomanPattern = /^M*(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i;

    return strictRomanPattern.test(roman);
}

/**
 * 从文件/文件夹名中提取罗马数字前缀
 * 支持大小写罗马数字，识别边界分隔符
 * 避免误判普通单词（如 Introduction）为罗马数字
 * @param name 文件/文件夹名（不含路径，可含扩展名）
 * @returns SortKey 数值数组或 null
 */
export function extractRomanNumber(name: string): SortKey {
    if (!name || name.length === 0) {
        return null;
    }

    // 先进行全角转半角处理
    const normalized = normalizeFullWidth(name);

    // 罗马数字字符（大小写）
    const romanChars = 'IVXLCDMivxlcdm';

    // 边界分隔符：点、横线、下划线、空格
    const separators = /^[.\-_\s]/;

    // 提取开头的罗马数字字符序列
    let romanPart = '';
    let i = 0;

    while (i < normalized.length) {
        const char = normalized[i];
        if (romanChars.includes(char)) {
            romanPart += char;
            i++;
        } else {
            break;
        }
    }

    // 如果没有提取到罗马数字字符，返回 null
    if (romanPart.length === 0) {
        return null;
    }

    const remaining = normalized.slice(i);

    if (remaining.length > 0 && !separators.test(remaining)) {
        // 检查剩余部分是否以字母开头（排除数字和其他字符）
        const firstRemainingChar = remaining[0];
        // 如果是字母（但不是罗马数字字符后的分隔符），则认为是普通单词
        if (/[a-zA-Z]/.test(firstRemainingChar)) {
            return null;
        }
    }

    // 验证罗马数字结构是否合法
    if (!isValidRomanStructure(romanPart)) {
        return null;
    }

    // 尝试转换罗马数字
    const num = romanToNumber(romanPart);

    if (num !== null && num > 0) {
        return [num];
    }

    return null;
}
