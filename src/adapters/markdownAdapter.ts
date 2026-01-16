import type { Adapter, OutputFormat } from './types.js';
import type { DocNode } from '../type/docNode.js';
import { renderToMarkdown } from '../generator.js';

/**
 * MarkdownAdapter - Adapter for generating Markdown TOC
 * 
 * This adapter wraps the existing renderToMarkdown logic and serves as
 * the core adapter that is always enabled. It generates Markdown-formatted
 * table of contents that can be injected into README files.
 * 
 * @description
 * - detect() always returns true (README generation is the core feature)
 * - generate() calls the existing renderToMarkdown function
 * - Works with the injector module for README updates
 */
export class MarkdownAdapter implements Adapter {
    readonly name = 'markdown';
    readonly outputFormat: OutputFormat = 'md';
    readonly defaultOutputPath = 'README.md';

    /**
     * Detect if this adapter should be enabled
     * @returns Always returns true - Markdown/README generation is the core feature
     */
    async detect(): Promise<boolean> {
        // Markdown adapter is always enabled as it's the core functionality
        return true;
    }

    /**
     * Generate Markdown TOC from DocNode tree
     * @param nodes - Array of DocNode representing the document tree
     * @returns Markdown-formatted TOC string
     */
    generate(nodes: DocNode[]): string {
        return renderToMarkdown(nodes);
    }
}

/**
 * Singleton instance of MarkdownAdapter
 */
export const markdownAdapter = new MarkdownAdapter();
