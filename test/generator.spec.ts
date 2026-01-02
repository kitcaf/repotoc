import { describe, it, expect } from 'vitest';
import { DocNode } from '../src/type/docNode.js';
import { renderToMarkdown, sortTree } from '../src/generator.js';

describe('Generator (排序与渲染)', () => {
    // 准备一组乱序的测试数据
    const mockNodes: DocNode[] = [
        {
            name: '10_Guide.md', path: '10_Guide.md', type: 'file', displayName: 'Guide',
            meta: { order: 10 }
        },
        {
            name: '2_Intro.md', path: '2_Intro.md', type: 'file', displayName: 'Intro',
            meta: { order: 2 } // 应该排在 10 前面
        },
        {
            name: 'Folder', path: 'Folder', type: 'dir', displayName: '高级章节',
            children: [
                { name: 'b.md', path: 'Folder/b.md', type: 'file', displayName: 'B', meta: {} },
                { name: 'a.md', path: 'Folder/a.md', type: 'file', displayName: 'A', meta: {} }
            ]
        },
        {
            // 测试中文路径
            name: '中文.md', path: 'docs/测试.md', type: 'file', displayName: '测试文档', meta: { order: 1 }
        }
    ];

    it('right order (Order > Folder > Name)', () => {
        // 执行排序
        sortTree(mockNodes);

        // 验证第一层顺序
        // 1. order: 1 (中文.md)
        expect(mockNodes[0].displayName).toBe('测试文档');
        // 2. order: 2 (Intro)
        expect(mockNodes[1].displayName).toBe('Intro');
        // 3. order: 10 (Guide) - 验证 2 排在 10 前面
        expect(mockNodes[2].displayName).toBe('Guide');
        // 4. Folder (无 order，默认很大，但在相同条件下怎么排)
        expect(mockNodes[3].displayName).toBe('高级章节');

        // 验证子节点 (Folder 内部) 是否也排序了 (A 应该在 B 前面)
        const folder = mockNodes[3];
        expect(folder.children![0].displayName).toBe('A');
    });

    it('right Markdown', () => {
        const md = renderToMarkdown(sortTree(mockNodes));
        console.log('生成的 Markdown:\n', md);

        // 验证缩进
        // expect(md).toContain('- [测试文档](docs/%E6%B5%8B%E8%AF%95.md)'); // 验证 URL 编码
        // expect(md).toContain('  - [A](Folder/a.md)'); // 验证子级缩进
    });
});