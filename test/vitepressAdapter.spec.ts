import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { VitePressAdapter } from '../src/adapters/vitepressAdapter.js';
import type { DocNode } from '../src/type/docNode.js';

/**
 * Feature: multi-format-adapter
 * Property 5: VitePress 转换正确性
 * Validates: Requirements 5.3, 5.4, 5.5, 5.6
 * 
 * For any DocNode tree, VitePress adapter generated output should satisfy:
 * - Each file node converts to object with `text` and `link` properties
 * - Each directory node converts to object with `text`, `items`, and `collapsed` properties
 * - All `link` values don't contain `.md` extension
 */

const propertyConfig = { numRuns: 100 };

/**
 * Generate a valid file DocNode
 */
const fileNodeArb: fc.Arbitrary<DocNode> = fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => !s.includes('/') && !s.includes('\\'))
        .map(s => s + '.md'),
    path: fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => !s.includes('\\'))
        .map(s => s.replace(/\.md$/, '') + '.md'),
    type: fc.constant('file' as const),
    linkPath: fc.option(
        fc.string({ minLength: 1, maxLength: 50 })
            .filter(s => !s.includes('\\'))
            .map(s => s.replace(/\.md$/, '') + '.md'),
        { nil: undefined }
    ),
    meta: fc.option(
        fc.record({
            title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
            ignore: fc.option(fc.constant(false), { nil: undefined }),
        }),
        { nil: undefined }
    ),
});

/**
 * Generate a directory DocNode with file children (non-recursive for simplicity)
 */
const dirNodeWithFilesArb: fc.Arbitrary<DocNode> = fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => !s.includes('/') && !s.includes('\\')),
    path: fc.string({ minLength: 1, maxLength: 50 })
        .filter(s => !s.includes('\\')),
    type: fc.constant('dir' as const),
    children: fc.array(fileNodeArb, { minLength: 1, maxLength: 5 }),
    meta: fc.option(
        fc.record({
            title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
            ignore: fc.option(fc.constant(false), { nil: undefined }),
        }),
        { nil: undefined }
    ),
});

/**
 * Generate a mixed DocNode array (files and directories)
 */
const docNodeArrayArb: fc.Arbitrary<DocNode[]> = fc.array(
    fc.oneof(fileNodeArb, dirNodeWithFilesArb),
    { minLength: 1, maxLength: 5 }
);

describe('VitePressAdapter', () => {
    const adapter = new VitePressAdapter();

    describe('Property 5: VitePress 转换正确性', () => {
        /**
         * Property 5.1: File nodes convert to objects with text and link properties
         * Validates: Requirements 5.3
         */
        it('file nodes should convert to objects with text and link properties', () => {
            fc.assert(
                fc.property(
                    fc.array(fileNodeArb, { minLength: 1, maxLength: 5 }),
                    (nodes) => {
                        const output = adapter.generate(nodes);

                        // Parse the generated TypeScript to extract the sidebar array
                        const sidebarMatch = output.match(/export const sidebar[^=]*=\s*(\[[\s\S]*\]);/);
                        if (!sidebarMatch) return false;

                        const sidebarJson = sidebarMatch[1];
                        const sidebar = JSON.parse(sidebarJson);

                        // Each file node should produce an item with text and link
                        for (const item of sidebar) {
                            if (!('text' in item) || typeof item.text !== 'string') return false;
                            if (!('link' in item) || typeof item.link !== 'string') return false;
                        }

                        return true;
                    }
                ),
                propertyConfig
            );
        });

        /**
         * Property 5.2: Directory nodes convert to objects with text, items, and collapsed properties
         * Validates: Requirements 5.4, 5.5
         */
        it('directory nodes should convert to objects with text, items, and collapsed properties', () => {
            fc.assert(
                fc.property(
                    fc.array(dirNodeWithFilesArb, { minLength: 1, maxLength: 3 }),
                    (nodes) => {
                        const output = adapter.generate(nodes);

                        // Parse the generated TypeScript to extract the sidebar array
                        const sidebarMatch = output.match(/export const sidebar[^=]*=\s*(\[[\s\S]*\]);/);
                        if (!sidebarMatch) return false;

                        const sidebarJson = sidebarMatch[1];
                        const sidebar = JSON.parse(sidebarJson);

                        // Each directory node should produce an item with text, items, and collapsed
                        for (const item of sidebar) {
                            if (!('text' in item) || typeof item.text !== 'string') return false;
                            if (!('items' in item) || !Array.isArray(item.items)) return false;
                            if (!('collapsed' in item) || typeof item.collapsed !== 'boolean') return false;
                        }

                        return true;
                    }
                ),
                propertyConfig
            );
        });

        /**
         * Property 5.3: All link values don't contain .md extension
         * Validates: Requirements 5.6
         */
        it('all link values should not contain .md extension', () => {
            fc.assert(
                fc.property(
                    docNodeArrayArb,
                    (nodes) => {
                        const output = adapter.generate(nodes);

                        // Parse the generated TypeScript to extract the sidebar array
                        const sidebarMatch = output.match(/export const sidebar[^=]*=\s*(\[[\s\S]*\]);/);
                        if (!sidebarMatch) return false;

                        const sidebarJson = sidebarMatch[1];
                        const sidebar = JSON.parse(sidebarJson);

                        // Recursively check all links don't end with .md
                        function checkNoMdExtension(items: unknown[]): boolean {
                            for (const item of items) {
                                if (typeof item !== 'object' || item === null) continue;
                                const obj = item as Record<string, unknown>;

                                if ('link' in obj && typeof obj.link === 'string') {
                                    if (obj.link.endsWith('.md')) return false;
                                }

                                if ('items' in obj && Array.isArray(obj.items)) {
                                    if (!checkNoMdExtension(obj.items)) return false;
                                }
                            }
                            return true;
                        }

                        return checkNoMdExtension(sidebar);
                    }
                ),
                propertyConfig
            );
        });

        /**
         * Combined property test: Full VitePress transformation correctness
         * Validates: Requirements 5.3, 5.4, 5.5, 5.6
         */
        it('should correctly transform DocNode tree to VitePress sidebar format', () => {
            fc.assert(
                fc.property(
                    docNodeArrayArb,
                    (nodes) => {
                        const output = adapter.generate(nodes);

                        // Parse the generated TypeScript to extract the sidebar array
                        const sidebarMatch = output.match(/export const sidebar[^=]*=\s*(\[[\s\S]*\]);/);
                        if (!sidebarMatch) return false;

                        const sidebarJson = sidebarMatch[1];
                        const sidebar = JSON.parse(sidebarJson);

                        // Verify structure recursively
                        function verifyStructure(items: unknown[]): boolean {
                            for (const item of items) {
                                if (typeof item !== 'object' || item === null) return false;
                                const obj = item as Record<string, unknown>;

                                // Must have text property
                                if (!('text' in obj) || typeof obj.text !== 'string') return false;

                                // If has items (directory), must have collapsed
                                if ('items' in obj) {
                                    if (!Array.isArray(obj.items)) return false;
                                    if (!('collapsed' in obj) || typeof obj.collapsed !== 'boolean') return false;
                                    if (!verifyStructure(obj.items)) return false;
                                } else {
                                    // If no items (file), must have link without .md
                                    if (!('link' in obj) || typeof obj.link !== 'string') return false;
                                    if (obj.link.endsWith('.md')) return false;
                                }
                            }
                            return true;
                        }

                        return verifyStructure(sidebar);
                    }
                ),
                propertyConfig
            );
        });
    });
});
