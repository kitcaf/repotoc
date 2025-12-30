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