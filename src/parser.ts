import fs from 'fs/promises';
import matter from 'gray-matter';
import { DocNode } from './type/docNode.js';
import path from 'node:path';

/**
 * H1 提取器 (State Machine Pattern)
 * 逐行扫描，通过 inCodeBlock 状态位来避开代码块中的注释
 */
function fastExtractH1(content: string): string | null {
    // 1. 按行切割 (兼容 Windows \r\n 和 Unix \n)
    const lines = content.split(/\r?\n/);

    let inCodeBlock = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // 2. 状态切换检查：遇到代码块标记 ```
        if (trimmed.startsWith('```')) {
            inCodeBlock = !inCodeBlock; // 切换开关：开 -> 关，或 关 -> 开
            continue;
        }

        // 3. 如果在代码块内部，直接跳过，看都不用看
        if (inCodeBlock) {
            continue;
        }

        // 4. 核心匹配：寻找 H1
        // 正则含义：
        // ^      : 行首
        // \s* : 允许 # 前面有空格
        // #      : 必须是一个 #
        // \s+    : # 后面必须有空格 (防止 #Tag 这种标签被误判)
        // (.*)   : 捕获后面的所有内容
        const match = line.match(/^\s*#\s+(.*)/);

        if (match) {
            return match[1].trim();
        }
    }

    // 读完整个文件都没找到
    return null;
}

/**
 * 单文件解析服务 --- Frontmatter去获得md文件标题
 */
async function parseFileMeta(filePath: string) {
    try {
        const rawContent = await fs.readFile(filePath, 'utf-8');

        // 解析 Frontmatter (gray-matter)
        const { data: frontmatter, content } = matter(rawContent);

        let h1Title = null;
        if (!frontmatter.title) {
            h1Title = fastExtractH1(content); //如果没有再去调用fastExtractH1
        }

        return {
            title: frontmatter.title || h1Title, // 优先 Meta，其次 H1
            order: frontmatter.order, // 排序权重
        };
    } catch (e) {
        console.warn(`解析失败 [${filePath}]:`, e);
        return { title: null, order: null };
    }
}

/**
 * 树的增强 (Enrichment) 遍历树节点，并行读取文件，回填meta信息
 */
export async function enrichTree(nodes: DocNode[], rootDir: string = ""): Promise<DocNode[]> {
    // 使用 Promise.all 实现并发 I/O
    const tasks = nodes.map(async (node) => {
        if (node.type === 'file') {
            // 1. 读取并解析
            const { title, order } = await parseFileMeta(path.join(rootDir, node.path));

            // 2. 回填显示名称
            node.displayName = cleanupName(node.name, title);

            // 3. 回填元数据
            node.meta = {
                title: title || undefined,
                order: order || undefined
            };

            // 4. 提取文件名前缀作为排序权重
            const prefixMatch = node.name.match(/^(\d+)[-_]/);
            if (!node.meta.order && prefixMatch) {
                node.meta.order = parseInt(prefixMatch[1]);
            }
        } else {
            // 文件夹处理逻辑
            node.displayName = cleanupName(node.name);
            // 递归处理子节点
            if (node.children) {
                await enrichTree(node.children, rootDir);
            }
        }

        return node;
    });

    return Promise.all(tasks);
}

/**
 * 工具函数：清洗名称 如果有标题就用标题，没有就处理文件名
 * 优先级 1 (最高)：Front Matter 中的 title (meta.title 里的值)。
 * 优先级 2：文件正文里的第一个 # H1 标题 (如果没写 Front Matter)。
 * 优先级 3 (最低)：文件名 (去掉后缀，去掉序号)。
 */
function cleanupName(filename: string, title?: string | null): string {
    if (title) return title;

    return filename
        .replace(/\.md$/, '')      // 移除扩展名
        .replace(/^\d+[-_]/, '');  // 移除 01_ 前缀
}
