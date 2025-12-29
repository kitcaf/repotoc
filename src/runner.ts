import path from 'node:path';
import { TocOptions } from './orderParse.js';
import { scanDocs } from './scanner.js';
import { buildTreeFromPaths } from './tree.js';
import { enrichTree } from './parser.js';
import { sortTree, renderToMarkdown } from './generator.js';
import { updateReadme } from './injector.js';

/**
 * TOC 生成的核心流水线
 * 纯业务逻辑，不涉及 CLI 参数解析
 */
export async function runCli(options: TocOptions) {
    const { rootDir } = options;

    const paths = await scanDocs({ cwd: rootDir });

    if (!paths.length) {
        throw new Error('No Markdown files found in the target directory.');
    }

    let tree = buildTreeFromPaths(paths);

    tree = await enrichTree(tree);

    tree = sortTree(tree);

    const markdown = renderToMarkdown(tree);

    const readmePath = path.join(rootDir, 'README.md');
    await updateReadme(readmePath, markdown);

    return { success: true, readmePath };
}