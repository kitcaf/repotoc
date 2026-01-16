import { scanDocs } from './scanner.js';
import { buildTreeFromPaths } from './tree.js';
import { enrichTree } from './parser.js';
import { sortTree, renderToMarkdown } from './generator.js';
import { updateReadme, InjectorOptions, InjectionResult } from './injector/index.js';
import { TocConfig } from './type/index.js';
import { calculatePathPrefix } from './utils.js';
import { applyMapping } from './mapping/applier.js';
import { join } from 'node:path';
import { vitepressAdapter, writeAdapterOutput, type AdapterResult } from './adapters/index.js';

export interface RunCliResult {
    success: boolean;
    readmePath: string;
    injectionResult: InjectionResult;
    /** VitePress adapter result (if enabled) */
    vitepressResult?: AdapterResult;
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

    // Execute VitePress adapter if enabled
    const vitepressConfig = adaptersConfig?.vitepress;
    const vitepressEnabled = vitepressConfig?.enabled;
    
    // Determine if VitePress adapter should run:
    // - If explicitly enabled: true -> run
    // - If explicitly disabled: false -> skip
    // - If not configured: use auto-detection
    let shouldRunVitepress = false;
    
    if (vitepressEnabled === true) {
        shouldRunVitepress = true;
    } else if (vitepressEnabled === false) {
        shouldRunVitepress = false;
    } else {
        // Auto-detect
        shouldRunVitepress = await vitepressAdapter.detect(cwd);
    }

    if (shouldRunVitepress) {
        const vitepressResult = await executeVitepressAdapter(tree, cwd, vitepressConfig);
        result.vitepressResult = vitepressResult;
        
        // Show import hint on first run
        if (vitepressResult.isFirstRun && vitepressResult.importHint) {
            console.log('\n📝 VitePress sidebar generated for the first time!');
            console.log(vitepressResult.importHint);
        }
    }

    return result;
}

/**
 * Execute VitePress adapter and write output
 */
async function executeVitepressAdapter(
    tree: import('./type/docNode.js').DocNode[],
    rootPath: string,
    config?: { enabled?: boolean; outputPath?: string; [key: string]: unknown }
): Promise<AdapterResult> {
    try {
        const outputPath = config?.outputPath || vitepressAdapter.defaultOutputPath;
        const absoluteOutputPath = join(rootPath, outputPath);
        
        // Check if this is first run
        const { existsSync } = await import('node:fs');
        const isFirstRun = !existsSync(absoluteOutputPath);
        
        // Generate content
        const content = vitepressAdapter.generate(tree);
        
        // Write to file
        const writeResult = await writeAdapterOutput({
            outputPath: absoluteOutputPath,
            content,
            outputFormat: vitepressAdapter.outputFormat
        });
        
        if (!writeResult.success) {
            return {
                adapter: vitepressAdapter.name,
                success: false,
                outputPath,
                message: writeResult.message
            };
        }
        
        const result: AdapterResult = {
            adapter: vitepressAdapter.name,
            success: true,
            outputPath,
            message: `Generated ${outputPath}`,
            isFirstRun
        };
        
        if (isFirstRun) {
            result.importHint = vitepressAdapter.getImportHint();
        }
        
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            adapter: vitepressAdapter.name,
            success: false,
            outputPath: config?.outputPath || vitepressAdapter.defaultOutputPath,
            message: `Failed to execute VitePress adapter: ${errorMessage}`
        };
    }
}