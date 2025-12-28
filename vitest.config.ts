import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        tsconfigPaths() // 它会自动读取 tsconfig.json 的 paths
    ],
    test: {
        environment: 'node', // 因为你是写 Node CLI，环境选 node
    },
});