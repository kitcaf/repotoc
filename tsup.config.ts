// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        outDir: 'dist',
        dts: true,
        clean: true,
        splitting: false,
        //Keep the code lightweight，npm auto install 
        external: ['fast-glob', 'gray-matter', 'chalk', 'jiti']
    },
    {
        entry: [
            'src/commands/*.ts',
        ],
        format: ['esm'],
        clean: true,
        outDir: 'dist',
        banner: {
            js: '#!/usr/bin/env node',
        },
        minify: true,
        splitting: false,
        external: ['fast-glob', 'gray-matter', 'chalk', 'jiti']
    }])