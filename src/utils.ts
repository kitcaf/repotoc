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
 * 中文数字映射表
 * 支持简体、繁体及大写数字
 */
const CHINESE_DIGITS: Record<string, number> = {
    '零': 0, '〇': 0,
    '一': 1, '壹': 1,
    '二': 2, '贰': 2, '两': 2,
    '三': 3, '叁': 3,
    '四': 4, '肆': 4,
    '五': 5, '伍': 5,
    '六': 6, '陆': 6,
    '七': 7, '柒': 7,
    '八': 8, '捌': 8,
    '九': 9, '玖': 9,
};

/**
 * 中文数字单位映射表
 */
const CHINESE_UNITS: Record<string, number> = {
    '十': 10, '拾': 10,
    '百': 100, '佰': 100,
    '千': 1000, '仟': 1000,
    '万': 10000,
};

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
    let temp = 0; // 当前累积的数值（用于处理单位前的数字）
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