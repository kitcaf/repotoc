import { MappingRules } from "src/mapping/types.js";
import type { AdaptersConfig } from "../adapters/types.js";

/**
 * Nested mapping configuration
 * Uses '$' prefix for metadata to avoid conflicts with filenames
 */
export interface NestedMapping {
    /** Display name in TOC */
    $name?: string;
    /** Sort order (smaller numbers first) */
    $order?: number;
    /** Whether to hide this node and its children */
    $ignore?: boolean;
    /** Child path mappings */
    [subPath: string]: string | number | boolean | NestedMapping | undefined;
}

/**
 * Mapping value type
 * - string: Direct rename
 * - NestedMapping: Complex configuration object
 */
export type MappingValue = string | NestedMapping;

/**
 * Root mapping configuration object
 */
export type MappingConfig = Record<string, MappingValue>;


/**
 * User configuration interface (Input from toc.config.ts)
 */
export interface UserConfig {
    /**
      * Root directory to scan
      * @default 'docs'
      */
    baseDir?: string;

    /**
     * Output file path (relative to cwd)
     * @default 'README.md'
     */
    outDir?: string;

    /**
     * Glob patterns to ignore
     */
    ignore?: string[];

    /**
     * Max scan depth
     * @default 3
     */
    maxDepth?: number;

    /**
     * Custom mapping rules (rename, sort, hide)
     */
    mapping?: MappingConfig;

    /**
     * Adapters configuration
     * Key is adapter name, value is adapter-specific configuration
     * 
     * @example
     * ```ts
     * adapters: {
     *   vitepress: {
     *     enabled: true,
     *     outputPath: '.vitepress/sidebar.ts'
     *   },
     *   docusaurus: {
     *     enabled: false
     *   }
     * }
     * ```
     */
    adapters?: AdaptersConfig;
}

/**
 * Internal complete configuration (Resolved)
 */
export interface TocConfig {
    /** Current working directory */
    cwd: string;

    /** Absolute path of scan directory */
    scanPath: string;

    /** Absolute path of output file */
    readmePath: string;

    // /**
    //  * Glob patterns to ignore during scanning. 
    //  * as a parameter for fast-glob
    //  * Use this for general exclusion rules like excluding test files, 
    //  * drafts folders, or system directories.
    //  * * @example ['**/*.test.md', '**/_drafts/**']
    //  * @performance Files matching these patterns are NOT loaded into memory.
    //  */
    ignore?: string[];

    /** Max scan depth */
    maxDepth: number;

    /**
    * Custom mapping rules (rename, sort, hide).
    * Use '$ignore' inside mapping for specific, path-based hiding logic
    * after the files have been scanned.
    */
    mappingRules?: MappingRules;

    /**
     * Adapters configuration for multi-format output
     * Passed to MultiAdapterRunner to determine which adapters to enable
     */
    adaptersConfig?: AdaptersConfig;
}