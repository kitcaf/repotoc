// test/scanner.test.ts
import { describe, it, expect } from 'vitest';
import { scanDocs } from '../src/scanner.js';

describe('Scanner', () => {
    it('扫描特定文件目录下的 md 文件', async () => {
        // 假设我们在项目根目录建了一个 README.md
        const files = await scanDocs({
            cwd: './docs', // 扫描当前项目根目录（目前的是不包含根目录文件）
        });

        console.log('扫描到的文件:', files);

        // 1. 结果必须是数组
        expect(Array.isArray(files)).toBe(true);
        const hasNodeModules = files.some(f => f.includes('node_modules'));
        expect(hasNodeModules).toBe(false);
    });
});