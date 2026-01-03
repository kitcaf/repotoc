// test/scanner.test.ts
import { describe, it, expect } from 'vitest';
import { scanDocs } from '../src/scanner.js';

describe('Scanner', () => {
    it('Scan the specific file（md） directory', async () => {
        const files = await scanDocs({
            cwd: './docs',
        });

        expect(Array.isArray(files)).toBe(true);
        const hasNodeModules = files.some(f => f.includes('node_modules'));
        expect(hasNodeModules).toBe(false);
    });
});