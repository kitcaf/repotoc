/**
 * Mapping Trie Node
 * comefrom MappingConfig value
 * Used for O(1) matching during tree traversal.
 */
export interface ConfigMappingNode {
    /** Node name (path segment) */
    name: string;

    /** Display name from config ($name) */
    displayName?: string;

    /** Sort weight from config ($order) */
    order?: number;

    /** Ignore flag from config ($ignore) */
    ignore?: boolean;

    /** Child nodes map (Key is the path segment name) */
    children: Map<string, ConfigMappingNode> | undefined;
}

/**
 * Complete set of mapping rules
 */
export interface MappingRules {
    /** * The root of the Trie structure for path-based matching.
     * Handles exact paths (e.g., "a/b/c") and nested configs.
     * because MappingRules fous on find 
     * so the type of trie is Map, rather a array
     */
    trie: Map<string, ConfigMappingNode>;

    /** * Fallback rules for basenames.
     * Key is the filename without path (e.g., "intro.md").
     * Used when no exact path match is found in the Trie.
     */
    basename: Map<string, { displayName?: string; order?: number; ignore?: boolean }>;
}


