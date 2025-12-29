import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'node:path';
import { DocNode } from '@/type/docNode.js';
import { enrichTree } from '@/parser.js';


const TEMP_DIR = 'test_temp_docs_parser';

// 准备测试环境 --- 构建测试文件
beforeAll(async () => {
    await fs.mkdir(TEMP_DIR, { recursive: true });

    // Frontmatter 优先
    await fs.writeFile(
        path.join(TEMP_DIR, 'meta.md'),
        '---\ntitle: 我是Meta标题\n---\n# 我是H1标题(不该显示我)'
    );

    // 验证 fastExtractH1 逻辑
    await fs.writeFile(
        path.join(TEMP_DIR, 'code_trap.md'),
        `
这里有一些代码示例：
\`\`\`bash
# 这是一个注释，程序不应该把它当成标题！
npm install
\`\`\`

# 真正的标题在这里
这是正文内容...
    `
    );

    // 普通文件-文件夹 (无 Meta, 无 H1)
    await fs.writeFile(path.join(TEMP_DIR, '01_just_file.md'), '没有标题');
});

//清理环境
afterAll(async () => {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
});

describe('Parser', () => {
    it('priority1 Use title of frontmatter ', async () => {
        const nodes: DocNode[] = [{
            name: 'meta.md', path: path.join(TEMP_DIR, 'meta.md'), type: 'file'
        }];

        const res = await enrichTree(nodes);
        expect(res[0].displayName).toBe('我是Meta标题');
    });

    it('priority2 Use Extract h1', async () => {
        const nodes: DocNode[] = [{
            name: 'code_trap.md', path: path.join(TEMP_DIR, 'code_trap.md'), type: 'file'
        }];

        const res = await enrichTree(nodes);
        expect(res[0].displayName).toBe('真正的标题在这里');
    });

    it('priority3 Use the file name', async () => {
        const nodes: DocNode[] = [{
            name: '01_just_file.md', path: path.join(TEMP_DIR, '01_just_file.md'), type: 'file'
        }];

        const res = await enrichTree(nodes);
        expect(res[0].displayName).toBe('just_file');
        expect(res[0].meta?.order).toBe(1);
    });
});