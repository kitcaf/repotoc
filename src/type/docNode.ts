/**
 * 文件节点结构（类似文件树）
 */
export interface DocNode {
    /**
     * 文件名-源文件名
     */
    name: string
    /**
     * 物理路径 
     * 始终存储相对于 scanPath 的【相对路径】
     * 且强制使用 POSIX 风格（/ 分隔符）
     */
    path: string
    /**
     * Relative path prefix（Used for generating Markdown links Relative by README.md）
     */
    linkPath?: string
    /**
     * 文件类型
     */
    type: 'file' | 'dir'

    /**
     * dir中存在children
     */
    children?: DocNode[];

    /**
     * 实际展示（UI渲染/生成目录）展示的名字
     */
    displayName?: string

    /**
     * 元数据
     */
    meta?: {
        title?: string;     // comefrom Frontmatter
        order?: number;     // comefrom Frontmatter
        ignore?: boolean;   // comefrom Frontmatter


        // ---comefrom userConfig Mapping---
        mappingName?: string;
        mappingOrder?: number;
    }
}