import { normalizeFullWidth, SortKey } from "./utils.js";

/**
 * 从文件/文件夹名中提取阿拉伯数字前缀
 * 支持以下格式：
 * - 纯数字开头：1intro.md, 01intro.md, 123.md
 * - 下划线分隔：01_intro.md, 1_intro.md
 * - 点分隔：1.intro.md, 01.概述.md
 * - 横线分隔：1-intro.md, 01-intro.md
 * - 空格分隔：1 intro.md, 01 intro.md
 * - 多级编号：1.2.3, 1-2-3, 1.2-intro.md
 * 
 * @param name 文件/文件夹名（不含路径，可含扩展名）
 * @returns SortKey 数值数组或 null
 */
export function extractArabicNumber(name: string): SortKey {
    if (!name || name.length === 0) {
        return null;
    }

    // 先进行全角转半角处理
    const normalized = normalizeFullWidth(name);

    // 检查是否以数字开头
    if (!/^\d/.test(normalized)) {
        return null;
    }

    // 提取数字前缀部分（包括多级编号）
    // 多级编号格式：数字后跟点或横线，然后是更多数字
    // 例如：1.2.3, 1-2-3, 1.2-intro
    const numbers: number[] = [];
    let currentNum = '';
    let i = 0;

    while (i < normalized.length) {
        const char = normalized[i];

        if (/\d/.test(char)) {
            // 数字字符，累积到当前数字
            currentNum += char;
            i++;
        } else if ((char === '.' || char === '-') && currentNum.length > 0) {
            // 点或横线分隔符，检查后面是否还有数字
            const nextChar = normalized[i + 1];
            if (nextChar && /\d/.test(nextChar)) {
                // 后面还有数字，这是多级编号的分隔符
                numbers.push(parseInt(currentNum, 10));
                currentNum = '';
                i++;
            } else {
                // 后面不是数字，结束提取
                break;
            }
        } else {
            // 其他字符（下划线、空格等），结束提取
            break;
        }
    }

    // 处理最后一个数字
    if (currentNum.length > 0) {
        numbers.push(parseInt(currentNum, 10));
    }

    // 如果没有提取到任何数字，返回 null
    if (numbers.length === 0) {
        return null;
    }

    return numbers;
}