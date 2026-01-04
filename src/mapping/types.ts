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
    children: Map<string, ConfigMappingNode>;
}

