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