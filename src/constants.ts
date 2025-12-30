/**
 * 默认排除规则
 * 这是一个“通用标准”，把系统文件和资源文件通过黑名单过滤
 */
export const DEFAULT_IGNORE = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/images/**',
    '**/assets/**'
];

/**
 * 定义目录标记常量
 * TAG_MARK: 用户手动在md文件中输入的开始标记
 * TAG_CLOSE: 系统自动生成的结束标记（用户无需手动输入）
 */
export const TAG_MARK = '<!--toc-->';
export const TAG_CLOSE = '<!--tocEnd-->';

/**
 * 中文数字映射表
 * 支持简体、繁体及大写数字
 */
export const CHINESE_DIGITS: Record<string, number> = {
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
export const CHINESE_UNITS: Record<string, number> = {
    '十': 10, '拾': 10,
    '百': 100, '佰': 100,
    '千': 1000, '仟': 1000,
    '万': 10000,
};