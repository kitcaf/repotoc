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

    /** Ignore patterns */
    ignore: string[];

    /** Max scan depth */
    maxDepth: number;

    /** * Mapping rules 
     * (Defaults to empty object if not provided by user)
     */
    mapping: MappingConfig;
}