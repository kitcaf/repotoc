import path from 'node:path';
import { TocOptions } from './orderParse.js';
import { scanDocs } from './scanner.js';
import { buildTreeFromPaths } from './tree.js';
import { enrichTree } from './parser.js';
import { sortTree, renderToMarkdown } from './generator.js';
import { updateReadme } from './injector.js';

export async function runCli(options: TocOptions) {
    const { rootDir } = options;
    const paths = await scanDocs({ cwd: rootDir });
    if (!paths.length) {
        throw new Error('No Markdown files found in the target directory.');
    }

    let tree = buildTreeFromPaths(paths);

    tree = await enrichTree(tree, rootDir);
    tree = sortTree(tree);

    const markdown = renderToMarkdown(tree);

    const readmePath = path.join(rootDir, 'README.md');
    await updateReadme(readmePath, markdown);

    return { success: true, readmePath };
}