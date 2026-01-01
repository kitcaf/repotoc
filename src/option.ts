import { createJiti } from "jiti";
import { TocConfig, UserConfig } from "./type/index.js";
import path from "node:path";
import fs from 'node:fs';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: UserConfig = {
    baseDir: 'docs',
    outDir: 'README.md',
    maxDepth: 3,
    ignore: []
};

const CONFIG_FILE_NAME = "toc.config"

/**
 * Resolves the configuration by searching for config files in the current working directory.
 */
export async function resolveConfig(): Promise<TocConfig> {
    const cwd = process.cwd()
    const configPath = path.resolve(cwd, CONFIG_FILE_NAME)

    let userConfig: UserConfig = {}
    if (fs.existsSync(configPath)) {
        try {
            const jiti = createJiti(import.meta.url);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mod = await jiti.import(configPath) as any;
            userConfig = mod.default || mod
        } catch (error) {
            console.error("The configuration file failed to load", error)
            console.error("Continue execution using the 【Default Configuration】")
            userConfig = {}
        }
    }

    const finalConfig = { ...DEFAULT_CONFIG, ...userConfig };

    const scanPath = path.resolve(cwd, finalConfig.baseDir || 'docs');
    const readmePath = path.resolve(cwd, finalConfig.outDir || 'README.md');

    return {
        cwd,
        scanPath: scanPath,
        readmePath: readmePath,
        ignore: finalConfig.ignore || [],
        maxDepth: finalConfig.maxDepth || 3,
    }
}

/**
 * Helper function for defining configuration with type inference.
 * @param config 
 * @returns 
 */
export function defineConfig(config: UserConfig): UserConfig {
    return config;
}