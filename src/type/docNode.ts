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
     */
    path: string

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
        title?: string;  // 从文件内容提取的标题
        order?: number;  // 排序权重
    }
}