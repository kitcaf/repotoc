import { scanDocs } from './scanner.js';
import { buildTreeFromPaths } from './tree.js';
import { enrichTree } from './parser.js';
import { sortTree, renderToMarkdown } from './generator.js';
import { updateReadme, InjectorOptions, InjectionResult } from './injector/index.js';
import { TocConfig } from './type/index.js';
import { calculatePathPrefix } from './utils.js';
import { applyMapping } from './mapping/applier.js';

export interface RunCliResult {
    success: boolean;
    readmePath: string;
    injectionResult: InjectionResult;
}

export async function runCli(
    options: TocConfig,
    injectorOptions: InjectorOptions = {}
): Promise<RunCliResult> {
    const { scanPath, readmePath, ignore, mappingRules } = options;

    const paths = await scanDocs({ cwd: scanPath, ignore });
    if (!paths.length) {
        throw new Error('No Markdown files found in the target directory.');
    }

    const pathPrefix = calculatePathPrefix(readmePath, scanPath);

    let tree = buildTreeFromPaths(paths, pathPrefix);

    tree = await enrichTree(tree, scanPath);

    if (mappingRules != null) {
        applyMapping(tree, mappingRules)
    }

    tree = sortTree(tree);

    const markdown = renderToMarkdown(tree);

    const injectionResult = await updateReadme(readmePath, markdown, injectorOptions);

    return {
        success: injectionResult.success,
        readmePath,
        injectionResult
    };
}