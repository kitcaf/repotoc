import { scanDocs } from './scanner.js';
import { buildTreeFromPaths } from './tree.js';
import { enrichTree } from './parser.js';
import { sortTree, renderToMarkdown } from './generator.js';
import { updateReadme, InjectorOptions, InjectionResult } from './injector/index.js';
import { TocConfig } from './type/index.js';
import { calculatePathPrefix } from './utils.js';
import { applyMapping } from './mapping/applier.js';
import {
    defaultRegistry,
    MultiAdapterRunner,
    type MultiAdapterResult
} from './adapters/index.js';

export interface RunCliResult {
    success: boolean;
    readmePath: string;
    injectionResult: InjectionResult;
    /** Adapter execution results (if any adapters were enabled) */
    adapterResults?: MultiAdapterResult;
}

export async function runCli(
    options: TocConfig,
    injectorOptions: InjectorOptions = {}
): Promise<RunCliResult> {
    const { scanPath, readmePath, ignore, mappingRules, cwd, adaptersConfig } = options;

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

    const result: RunCliResult = {
        success: injectionResult.success,
        readmePath,
        injectionResult
    };

    // Execute adapters using MultiAdapterRunner
    const runner = new MultiAdapterRunner(defaultRegistry);
    const adapterResults = await runner.run(tree, {
        rootPath: cwd,
        adaptersConfig
    });

    if (adapterResults.results.length > 0) {
        result.adapterResults = adapterResults;

        // Show import hints for first-run adapters
        for (const adapterResult of adapterResults.results) {
            if (adapterResult.isFirstRun && adapterResult.importHint) {
                console.log(`\n ${adapterResult.adapter} generated for the first time!`);
                console.log(adapterResult.importHint);
            }
        }
    }

    return result;
}