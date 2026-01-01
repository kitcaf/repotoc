export interface UserConfig {
    /**
     * The root directory to scan for markdown files.
     * @default 'docs'
     */
    baseDir?: string;
    /**
     * The output path for the README file (relative to cwd).
     * @default 'README.md'
     */
    outDir?: string;
    /**
     * Glob patterns to ignore during scanning.
     */
    ignore?: string[];
    /**
     * Maximum depth for recursive scanning.
     */
    maxDepth?: number;
}

export interface TocConfig {
    /**
     * Current working directory
     */
    cwd: string;
    /**
     * Absolute path to scan directory (relative to cwd)
     */
    scanPath: string,
    /**
     * Absolute path to the output README(relative to cwd)
     */
    readmePath: string;
    /**
     * Ignore files
     */
    ignore?: string[],
    /**
     * Maximum depth
     */
    maxDepth: number,
}