import { DocNode } from './type/index.js';
import { naturalSorter, extractSortKey, compareSortKeys } from './utils.js';

/**
    * 递归排序树（排序同层的节点）
    * 规则：
    * 1. 优先级最高：Meta 中的 order 字段
    * 2. 优先级次之：从文件/文件夹名提取的 Sort_Key
    * 3. 优先级再次：文件夹排在文件前面
    * 4. 优先级最低：显示名称(DisplayName) 的自然排序
*/
export function sortTree(nodes: DocNode[]): DocNode[] {
    // 1. 先对当前层级进行排序
    nodes.sort((a, b) => {
        // 规则 A: 比较 Order (如果都有 order)
        const orderA = a.meta?.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.meta?.order ?? Number.MAX_SAFE_INTEGER;

        if (orderA !== orderB) {
            return orderA - orderB; // 数字小的排前面
        }

        // 规则 B: 比较从文件名提取的 Sort_Key
        const sortKeyA = extractSortKey(a.name);
        const sortKeyB = extractSortKey(b.name);

        // 只有当至少一个有 Sort_Key 时才比较
        if (sortKeyA !== null || sortKeyB !== null) {
            const sortKeyComparison = compareSortKeys(sortKeyA, sortKeyB);
            if (sortKeyComparison !== 0) {
                return sortKeyComparison;
            }
        }

        // 规则 C: 文件夹优先
        if (a.type !== b.type) {
            // 文件夹(-1) 排在 文件(1) 前面
            return a.type === 'dir' ? -1 : 1;
        }

        // 规则 D: 按名称自然排序
        return naturalSorter(a.displayName!, b.displayName!);
    });

    // 2. 递归排序子节点
    for (const node of nodes) {
        if (node.children) {
            sortTree(node.children);
        }
    }

    return nodes;
}

/**
 * 渲染 Markdown 列表
 * @param nodes 排序后的树
 * @param depth 当前缩进深度
 * @returns 
 */
export function renderToMarkdown(nodes: DocNode[], depth = 0): string {
    let output = '';
    const indent = '  '.repeat(depth); // 使用 2 空格缩进

    for (const node of nodes) {
        // 1. 处理文件节点（文件节点是需要带链接的）
        if (node.type === 'file') { //URL 编码，防止中文路径 404
            // replace(/ /g, '%20') 是为了处理空格，encodeURI 处理中文
            const safePath = encodeURI(node.linkPath!);
            output += `${indent}- [${node.displayName}](${safePath})\n`;
        }
        // 2. 处理文件夹节点
        else {
            output += `${indent}- ${node.displayName}\n`;

            // 递归渲染子节点
            if (node.children) {
                output += renderToMarkdown(node.children, depth + 1);
            }
        }
    }

    return output;
}





