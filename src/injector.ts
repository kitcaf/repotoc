// src/core/injector.ts
import fs from 'fs/promises';
import { END_TAG, START_TAG } from './constants.js';


/**
 * @param readmePath README 文件的路径
 * @param tocContent 生成好的 Markdown 目录内容
 */
export async function updateReadme(readmePath: string, tocContent: string): Promise<void> {
    let content = '';

    try {
        content = await fs.readFile(readmePath, 'utf-8');
    } catch (error) {
        console.error("file does not exist:", error)
    }

    const startIndex = content.indexOf(START_TAG);
    const endIndex = content.indexOf(END_TAG);

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        const newSection = `\n\n## 目录\n${START_TAG}\n${tocContent}\n${END_TAG}\n`;
        await fs.writeFile(readmePath, content + newSection);
        return;
    }

    // 执行替换 (Surgical Replacement)
    const before = content.substring(0, startIndex + START_TAG.length);
    const after = content.substring(endIndex);

    const newContent = `${before}\n${tocContent}\n${after}`;

    // 写入文件
    await fs.writeFile(readmePath, newContent);
}