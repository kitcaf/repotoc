import { scanDocs } from './scanner.js';
import { buildTreeFromPaths } from './tree.js';
import { enrichTree } from './parser.js';
import { sortTree, renderToMarkdown } from './generator.js';
import { updateReadme } from './injector.js';
import { TocConfig } from './type/index.js';
import { calculatePathPrefix } from './utils.js';

export async function runCli(options: TocConfig) {
    const { scanPath, readmePath } = options;

    const paths = await scanDocs({ cwd: scanPath });
    if (!paths.length) {
        throw new Error('No Markdown files found in the target directory.');
    }

    const pathPrefix = calculatePathPrefix(readmePath, scanPath);

    let tree = buildTreeFromPaths(paths, pathPrefix);

    tree = await enrichTree(tree, scanPath);
    tree = sortTree(tree);

    const markdown = renderToMarkdown(tree);

    await updateReadme(readmePath, markdown);

    return { success: true, readmePath };
}