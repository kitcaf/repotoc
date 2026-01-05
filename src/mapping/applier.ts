import { DocNode } from "src/type/docNode.js";
import { ConfigMappingNode, MappingRules } from "./types.js";

/**
 * Apply mapping rules to the document tree.
 * Uses synchronous traversal (O(N) complexity) to match Trie nodes with DocNodes.
 */
export function applyMapping(
    nodes: DocNode[],
    rules: MappingRules,
    currentTrieScope?: Map<string, ConfigMappingNode> | undefined
) {
    const scope = currentTrieScope || rules.trie

    for (const node of nodes) {
        // only match node in current level will recurse
        const ruleTire = scope.get(node.name)
        const basenameRule = rules.basename.get(node.name)

        const displayName = ruleTire?.displayName ?? basenameRule?.displayName
        const order = ruleTire?.order ?? basenameRule?.order
        const ignore = ruleTire?.ignore ?? basenameRule?.ignore

        if (displayName != null || order != null || ignore != null) {
            if (!node.meta) node.meta = {};
            if (displayName != null) node.meta.mappingName = displayName;
            if (order != null) node.meta.mappingOrder = order;
            if (ignore != null) node.meta.mappingIgnore = ignore;
        }


        if (node.children && node.children.length > 0) {
            const nextScope = ruleTire ? ruleTire.children : undefined;
            applyMapping(node.children, rules, nextScope)

        }
    }
}