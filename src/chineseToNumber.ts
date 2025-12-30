import { CHINESE_DIGITS, CHINESE_UNITS } from "./constants.js";
import { normalizeFullWidth, SortKey } from "./utils.js";

/**
 * 将中文数字字符串转换为阿拉伯数字
 * 支持基础中文数字：零一二三四五六七八九十百千万
 * 支持复合数字：十一→11, 二十三→23, 一百二十三→123, 三百零五→305
 * 中文数字的表达方式其实就是一个数学公式。例如“三百二十五” = $3 \times 100 + 2 \times 10 + 5$。
 * @param chinese 中文数字字符串
 * @returns 转换后的阿拉伯数字，如果无法转换则返回 null
 */
export function chineseToNumber(chinese: string): number | null {
    if (!chinese || chinese.length === 0) {
        return null;
    }

    const allChars = { ...CHINESE_DIGITS, ...CHINESE_UNITS };
    for (const char of chinese) {
        if (!(char in allChars)) {
            return null;
        }
    }

    let result = 0;
    let temp = 0;
    /**
     * 一百万二千 
     * 分节，万之前的其实是一个新的节，需要存储下来 * 万，亿就不考虑了
     */
    let section = 0;

    for (let i = 0; i < chinese.length; i++) {
        const char = chinese[i];

        if (char in CHINESE_DIGITS) {
            const digit = CHINESE_DIGITS[char];
            temp = digit;
        } else if (char in CHINESE_UNITS) {
            const unit = CHINESE_UNITS[char];

            if (unit === 10000) {
                section = section + temp;
                result = result + section * unit;
                section = 0;
                temp = 0;
            } else {
                if (temp === 0) {
                    temp = 1;
                }
                section = section + temp * unit;
                temp = 0;
            }
        }
    }
    result = result + section + temp;

    return result;
}

/**
 * 从文件/文件夹名中提取中文数字前缀
 * 支持以下格式：
 * - 第X章/节/部分：第一章, 第二节, 第十一部分
 * - 中文序号：一、概述, 二、进阶, 十一、总结
 * - 带括号：（一）概述, (二)进阶, 【三】高级, 〔四〕说明
 * - 纯中文数字开头：一概述, 二进阶
 * 
 * @param name 文件/文件夹名（不含路径，可含扩展名）
 * @returns SortKey 数值数组或 null
 */
export function extractChineseNumber(name: string): SortKey {
    if (!name || name.length === 0) {
        return null;
    }

    // 先进行全角转半角处理
    const normalized = normalizeFullWidth(name);

    // 构建中文数字字符集合（用于正则）
    const chineseDigitChars = Object.keys(CHINESE_DIGITS).join('');
    const chineseUnitChars = Object.keys(CHINESE_UNITS).join('');
    const allChineseNumChars = chineseDigitChars + chineseUnitChars;

    // 第X章/节/部分 格式
    const pattern1 = new RegExp(`^第([${allChineseNumChars}]+)(?:章|节|部分|篇|卷|集|回)?`);
    const match1 = normalized.match(pattern1);
    if (match1) {
        const num = chineseToNumber(match1[1]);
        if (num !== null && num > 0) {
            return [num];
        }
    }

    // 带括号格式 （一）, (二), 【三】, 〔四〕
    const pattern2 = new RegExp(`^[（(【〔\\[]([${allChineseNumChars}]+)[）)】〕\\]]`);
    const match2 = normalized.match(pattern2);
    if (match2) {
        const num = chineseToNumber(match2[1]);
        if (num !== null && num > 0) {
            return [num];
        }
    }

    // 中文数字后跟顿号
    const pattern3 = new RegExp(`^([${allChineseNumChars}]+)、`);
    const match3 = normalized.match(pattern3);
    if (match3) {
        const num = chineseToNumber(match3[1]);
        if (num !== null && num > 0) {
            return [num];
        }
    }

    // 纯中文数字开头（后面跟非中文数字字符或结束）
    // 需要确保中文数字后面有边界（非中文数字字符）
    const pattern4 = new RegExp(`^([${allChineseNumChars}]+)(?:[^${allChineseNumChars}]|$)`);
    const match4 = normalized.match(pattern4);
    if (match4) {
        const num = chineseToNumber(match4[1]);
        if (num !== null && num > 0) {
            return [num];
        }
    }

    return null;
}