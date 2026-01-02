// src/core/injector.ts
import fs from 'fs/promises';
import { TAG_MARK, TAG_CLOSE } from "./constants.js"

/**
 * 在原md文中注入或更新目录
 * 用户只需在md文件中输入一次 <!--toc--> 即可
 * 第一次执行：自动在目录后面补充 <!--tocEnd-->
 * 第二次执行：在两个标记之间自动更新目录内容
 * 还存在很多的边界情况 --- 后面考虑
 * @param readmePath 目标md文件路径
 * @param newToc 生成的新目录内容
 */
export async function updateReadme(readmePath: string, newToc: string): Promise<void> {
    let content = '';

    try {
        content = await fs.readFile(readmePath, 'utf-8');
    } catch (error) {
        console.error("can't read the file:", error);
        return;
    }

    // 查找开始标记
    const startIdx = content.indexOf(TAG_MARK);

    if (startIdx === -1) {
        await fs.writeFile(readmePath, content + `\n\n${TAG_MARK}\n${newToc}\n${TAG_CLOSE}\n`);
        return;
    }

    // 从开始标记之后查找结束标记
    const closeIdx = content.indexOf(TAG_CLOSE, startIdx);

    // 保留开始标记及之前的内容
    const before = content.substring(0, startIdx + TAG_MARK.length);
    let after = '';

    if (closeIdx !== -1) {
        after = content.substring(closeIdx + TAG_CLOSE.length);
    } else {
        after = content.substring(startIdx + TAG_MARK.length);
    }

    const newContent = `${before}\n${newToc}\n${TAG_CLOSE}${after}`;

    await fs.writeFile(readmePath, newContent);
}