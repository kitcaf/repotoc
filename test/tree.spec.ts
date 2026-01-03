import { describe, it, expect } from 'vitest';
import { buildTreeFromPaths } from '../src/tree.js';

describe('Tree Builder', () => {
    it('enable Flat file', () => {
        const input = ['a.md', 'b.md'];
        const output = buildTreeFromPaths(input, 'test')

        expect(output).toHaveLength(2);
        expect(output[0].name).toBe('a.md');
        expect(output[0].type).toBe('file');
    })

    it('enable Single-layer nesting', () => {
        // 模拟 guide/a.md 和 guide/b.md
        const input = ['guide/a.md', 'guide/b.md'];
        const output = buildTreeFromPaths(input, 'test');

        // 应该只生成一个 guide 文件夹
        expect(output).toHaveLength(1);
        expect(output[0].name).toBe('guide');
        expect(output[0].type).toBe('dir');

        // guide 下面应该有两个文件
        expect(output[0].children).toHaveLength(2);
        expect(output[0].children![0].name).toBe('a.md');
    });

    it('enable Deep mixed nesting', () => {
        const input = [
            'README.md',
            'guide/intro.md',
            'guide/advanced/config.md'
        ];
        const output = buildTreeFromPaths(input, 'test');

        // 第一层：README.md 和 guide
        expect(output).toHaveLength(2);

        // 验证 guide/advanced/config.md 路径是否正确
        const guide = output.find(n => n.name === 'guide');
        const advanced = guide?.children?.find((n: { name: string; }) => n.name === 'advanced');
        const config = advanced?.children?.find((n: { name: string; }) => n.name === 'config.md');

        expect(config).toBeDefined();
        expect(config?.path).toBe('guide/advanced/config.md');
    });
})