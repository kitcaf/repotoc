import path from "node:path";
import { TocConfig } from "./type/index.js"

/**
 * 解析 TOC 命令的参数
 * @param cwd 当前工作目录
 * @param args 命令行参数数组 (去除了 node 和 脚本路径后的)
 */
export function parseCliArgs(tocConfig: TocConfig, args: string[]): TocConfig {
    // 1. 提取深度参数 (-d)
    const depthIndex = args.indexOf('-d');
    const maxDepth = depthIndex !== -1 && args[depthIndex + 1]
        ? parseInt(args[depthIndex + 1])
        : 3; // 默认深度

    // 2. 提取目标目录
    const directoryArgs = args.filter((_, i) => i !== depthIndex && i !== depthIndex + 1);
    const specificDir = directoryArgs[0];

    // 逻辑：如果有指定目录，就用指定的；否则默认用 'docs'
    const rootDir = specificDir
        ? path.resolve(tocConfig.cwd, specificDir)
        : path.resolve(tocConfig.cwd, 'docs');

    tocConfig.maxDepth = maxDepth
    tocConfig.scanPath = rootDir
    return tocConfig
}