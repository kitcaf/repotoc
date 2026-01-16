import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
    AdapterOptions,
    AdapterResult,
    AdaptersConfig,
    MultiAdapterResult
} from './types.js';
import type { AdapterRegistry } from './registry.js';
import type { DocNode } from '../type/docNode.js';

/**
 * Options for MultiAdapterRunner
 */
export interface MultiAdapterRunnerOptions {
    /** Project root directory path */
    rootPath: string;
    /** User-provided adapters configuration */
    adaptersConfig?: AdaptersConfig;
}

/**
 * MultiAdapterRunner - Executes multiple adapters concurrently
 * 
 * This runner combines smart detection with user configuration to determine
 * which adapters to enable, then executes them concurrently. Individual
 * adapter failures don't affect other adapters.
 */
export class MultiAdapterRunner {
    constructor(private registry: AdapterRegistry) { }

    /**
     * Get list of enabled adapters based on detection and user configuration
     * 
     * Priority rules:
     * - If adaptersConfig[name].enabled === false, adapter is disabled (even if detected)
     * - If adaptersConfig[name].enabled === true, adapter is enabled (even if not detected)
     * - If adaptersConfig is not provided, use detection results
     * 
     * @param rootPath - Project root directory path
     * @param adaptersConfig - User-provided adapters configuration
     * @returns Array of enabled adapter names
     */
    async getEnabledAdapters(
        rootPath: string,
        adaptersConfig?: AdaptersConfig
    ): Promise<string[]> {
        // Get all registered adapter names
        const allAdapters = this.registry.list();

        // Run detection for all adapters
        const detectedAdapters = await this.registry.detectAll(rootPath);
        const detectedSet = new Set(detectedAdapters);

        const enabledAdapters: string[] = [];

        for (const name of allAdapters) {
            const config = adaptersConfig?.[name];

            if (config?.enabled === false) {
                // Explicitly disabled - skip even if detected
                continue;
            }

            if (config?.enabled === true) {
                // Explicitly enabled - include even if not detected
                enabledAdapters.push(name);
                continue;
            }

            // No explicit config - use detection result
            if (detectedSet.has(name)) {
                enabledAdapters.push(name);
            }
        }

        return enabledAdapters;
    }

    /**
     * Run all enabled adapters concurrently
     * 
     * @param nodes - DocNode tree to process
     * @param options - Runner options
     * @returns Multi-adapter execution result
     */
    async run(
        nodes: DocNode[],
        options: MultiAdapterRunnerOptions
    ): Promise<MultiAdapterResult> {
        const { rootPath, adaptersConfig } = options;

        // Get enabled adapters
        const enabledAdapterNames = await this.getEnabledAdapters(rootPath, adaptersConfig);

        if (enabledAdapterNames.length === 0) {
            return {
                success: true,
                results: [],
                message: 'No adapters enabled'
            };
        }

        // Execute all adapters concurrently
        const results = await Promise.all(
            enabledAdapterNames.map(name =>
                this.executeAdapter(name, nodes, rootPath, adaptersConfig?.[name])
            )
        );

        // Determine overall success
        const allSucceeded = results.every(r => r.success);
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        let message: string;
        if (allSucceeded) {
            message = `All ${results.length} adapter(s) executed successfully`;
        } else if (successCount === 0) {
            message = `All ${failCount} adapter(s) failed`;
        } else {
            message = `${successCount} adapter(s) succeeded, ${failCount} failed`;
        }

        return {
            success: allSucceeded,
            results,
            message
        };
    }

    /**
     * Execute a single adapter
     * 
     * @param name - Adapter name
     * @param nodes - DocNode tree to process
     * @param rootPath - Project root directory path
     * @param config - Adapter-specific configuration
     * @returns Adapter execution result
     */
    private async executeAdapter(
        name: string,
        nodes: DocNode[],
        rootPath: string,
        config?: AdaptersConfig[string]
    ): Promise<AdapterResult> {
        try {
            const adapter = this.registry.get(name);

            // Determine output path
            const outputPath = config?.outputPath || adapter.defaultOutputPath;
            const absoluteOutputPath = join(rootPath, outputPath);

            // Check if this is first run (output file doesn't exist)
            const isFirstRun = !existsSync(absoluteOutputPath);

            // Build adapter options
            const adapterOptions: AdapterOptions = {
                rootPath,
                outputPath,
                ...config
            };

            // Generate content
            const content = adapter.generate(nodes, adapterOptions);

            // Build result
            const result: AdapterResult = {
                adapter: name,
                success: true,
                outputPath,
                message: `Generated ${outputPath}`,
                isFirstRun
            };

            // Include import hint on first run
            if (isFirstRun && adapter.getImportHint) {
                result.importHint = adapter.getImportHint();
            }

            // Note: Actual file writing is handled by a separate writer module
            // This runner only generates content and returns results
            // The content can be accessed via a separate method if needed

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                adapter: name,
                success: false,
                outputPath: config?.outputPath || '',
                message: `Failed to execute adapter "${name}": ${errorMessage}`
            };
        }
    }
}
