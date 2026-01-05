import { getEffectiveDisplayName, getEffectiveOrder, isIgnored } from './metaSort.js';
import { DocNode } from './type/index.js';
import { naturalSorter, extractSortKey, compareSortKeys } from './utils.js';

/**
 * Recursively sort tree nodes at each level.
 * Sorting rules (in priority order):
 * 1. Highest: getEffectiveOrder (mappingOrder > meta.order)
 *    - Nodes with order always come before nodes without order
 * 2. Second: Sort_Key extracted from filename
 * 3. Third: Directories before files
 * 4. Lowest: Natural sort by filename
 */
export function sortTree(nodes: DocNode[]): DocNode[] {
    nodes.sort((a, b) => {
        // Rule A: Compare order (mappingOrder > meta.order)
        const orderA = getEffectiveOrder(a);
        const orderB = getEffectiveOrder(b);

        // Nodes with order come before nodes without order
        if (orderA !== undefined || orderB !== undefined) {
            const valA = orderA ?? Number.MAX_SAFE_INTEGER;
            const valB = orderB ?? Number.MAX_SAFE_INTEGER;
            if (valA !== valB) {
                return valA - valB; // Lower number comes first
            }
        }

        // Rule B: Compare Sort_Key extracted from filename
        const sortKeyA = extractSortKey(a.name);
        const sortKeyB = extractSortKey(b.name);

        if (sortKeyA !== null || sortKeyB !== null) {
            const sortKeyComparison = compareSortKeys(sortKeyA, sortKeyB);
            if (sortKeyComparison !== 0) {
                return sortKeyComparison;
            }
        }

        // Rule C: Directories come before files
        if (a.type !== b.type) {
            return a.type === 'dir' ? -1 : 1;
        }

        // Rule D: Natural sort by filename
        return naturalSorter(a.name, b.name);
    });

    // Recursively sort children
    for (const node of nodes) {
        if (node.children) {
            sortTree(node.children);
        }
    }

    return nodes;
}

/**
 * Render document tree to Markdown list format.
 * @param nodes Sorted tree nodes
 * @param depth Current indentation depth
 * @returns Markdown string
 */
export function renderToMarkdown(nodes: DocNode[], depth = 0): string {
    let output = '';
    const indent = '  '.repeat(depth);

    for (const node of nodes) {
        // Skip ignored nodes (mappingIgnore > meta.ignore)
        if (isIgnored(node)) {
            continue;
        }

        const displayName = getEffectiveDisplayName(node);

        if (node.type === 'file') {
            // URL encode to prevent 404 for Chinese paths
            const safePath = encodeURI(node.linkPath!);
            output += `${indent}- [${displayName}](${safePath})\n`;
        } else {
            output += `${indent}- ${displayName}\n`;

            // Recursively render children
            if (node.children) {
                output += renderToMarkdown(node.children, depth + 1);
            }
        }
    }

    return output;
}
