/**
 * 扫描文件函数-函数服务
 */

import glob from 'fast-glob';
import path from 'node:path'
import { DEFAULT_IGNORE } from '@/constants.js';

/**
 * 扫描配置接口
 */
interface ScanOptions {
    cwd: string;           // 扫描的根目录 (Current Working Directory)
    ignore?: string[];     // 排除列表
}

/**
 * 扫描指定目录下的 Markdown 文件
 * @returns 返回标准化后的文件路径列表
 */
export async function scanDocs(options: ScanOptions) {
    const { cwd, ignore = [] } = options;

    // 执行扫描 只扫描md文件通过md文件去推断文件夹
    /**
     * 自动去噪
     */
    const files = await glob(
        '**/*.md',
        {
            cwd,
            ignore: [...DEFAULT_IGNORE, ...ignore],
            absolute: false,
            onlyFiles: true, // 只找文件，不找空文件夹
        }
    )
    //排序 (初步按文件名排序，保证确定性)
    return files.sort()
}

