import type { DocNode } from '../type/docNode.js';

/**
 * Output format types supported by adapters
 */
export type OutputFormat = 'ts' | 'json' | 'yaml' | 'js' | 'md';

/**
 * Base options for adapter generation
 */
export interface AdapterOptions {
    /** Project root directory path */
    rootPath: string;
    /** Custom output path (overrides defaultOutputPath) */
    outputPath?: string;
    /** Additional adapter-specific options */
    [key: string]: unknown;
}

/**
 * Adapter interface - standard contract for all document framework adapters
 * 
 * @description
 * Adapters transform the unified DocNode tree structure into configuration
 * formats required by specific documentation frameworks (VitePress, Docusaurus, etc.)
 */
export interface Adapter {
    /**
     * Unique identifier for the adapter
     */
    readonly name: string;

    /**
     * Output file format
     */
    readonly outputFormat: OutputFormat;

    /**
     * Default output file path (relative to project root)
     */
    readonly defaultOutputPath: string;

    /**
     * Detect if this adapter's framework is present in the project
     * @param rootPath - Project root directory path
     * @returns true if framework characteristics are detected
     */
    detect(rootPath: string): Promise<boolean>;

    /**
     * Generate formatted output content from DocNode tree
     * @param nodes - Array of DocNode representing the document tree
     * @param options - Generation options
     * @returns Formatted output content string
     */
    generate(nodes: DocNode[], options: AdapterOptions): string;

    /**
     * Get import hint for users on how to use the generated file
     * @returns Import hint string or undefined if not applicable
     */
    getImportHint?(): string;

    /**
     * Resolve the actual output path based on project structure
     * This allows adapters to dynamically determine the output location
     * (e.g., VitePress may output to docs/.vitepress/sidebar.ts instead of .vitepress/sidebar.ts)
     * @param rootPath - Project root directory path
     * @returns Resolved output path relative to rootPath, or undefined to use defaultOutputPath
     */
    resolveOutputPath?(rootPath: string): string | undefined;
}

/**
 * Result of a single adapter execution
 */
export interface AdapterResult {
    /** Adapter name */
    adapter: string;
    /** Whether execution succeeded */
    success: boolean;
    /** Output file path (absolute or relative) */
    outputPath: string;
    /** Result message (success info or error description) */
    message: string;
    /** Whether this is the first time generating output for this adapter */
    isFirstRun?: boolean;
    /** Import hint (only present on first run) */
    importHint?: string;
}

/**
 * Result of multi-adapter execution
 */
export interface MultiAdapterResult {
    /** Overall success status (true if all adapters succeeded) */
    success: boolean;
    /** Individual results for each adapter */
    results: AdapterResult[];
    /** Summary message */
    message: string;
}

/**
 * Configuration for a single adapter
 */
export interface SingleAdapterConfig {
    /** Explicitly enable or disable this adapter */
    enabled?: boolean;
    /** Custom output path (overrides adapter's defaultOutputPath) */
    outputPath?: string;
    /** Additional adapter-specific options */
    [key: string]: unknown;
}

/**
 * Adapters configuration in user config
 * Key is adapter name, value is adapter-specific configuration
 */
export type AdaptersConfig = Record<string, SingleAdapterConfig>;
