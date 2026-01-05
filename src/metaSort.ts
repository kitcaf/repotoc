import { DocNode } from './type/docNode.js';

/**
 * Get effective display name with priority:
 * 1. mappingName (from user config) - highest priority
 * 2. title (from frontmatter/H1)
 * 3. cleaned filename (fallback)
 */
export function getEffectiveDisplayName(node: DocNode): string {
    // Priority 1: mapping config
    if (node.meta?.mappingName) {
        return node.meta.mappingName;
    }

    // Priority 2: frontmatter/H1 title
    if (node.meta?.title) {
        return node.meta.title;
    }

    // Priority 3: clean up filename
    return cleanupName(node.name);
}

/**
 * Get effective order with priority:
 * 1. mappingOrder (from user config) - highest priority
 * 2. order (from frontmatter)
 * 3. undefined (use default sorting)
 */
export function getEffectiveOrder(node: DocNode): number | undefined {
    return node.meta?.mappingOrder ?? node.meta?.order;
}

/**
 * Check if node should be ignored with priority:
 * 1. mappingIgnore (from user config) - highest priority
 * 2. ignore (from frontmatter)
 * 3. false (default: not ignored)
 */
export function isIgnored(node: DocNode): boolean {
    return node.meta?.mappingIgnore ?? node.meta?.ignore ?? false;
}

/**
 * Clean up filename for display
 * - Remove .md extension
 * - Remove numeric prefix (e.g., "01_", "1-")
 */
function cleanupName(filename: string): string {
    return filename
        .replace(/\.md$/, '')      // Remove .md extension
        .replace(/^\d+[-_]/, '');  // Remove numeric prefix like "01_" or "1-"
}
