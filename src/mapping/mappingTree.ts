// src/mapping/trie.ts
import { MappingConfig, MappingValue } from '../type/config.js';
import { ConfigMappingNode, MappingRules } from './types.js';

/**
 * Build mapping rules into a Trie structure + Basename Map.
 * * @param mapping The raw mapping config from user
 * @returns The structured MappingRules object
 */
export function buildMappingTree(mapping: MappingConfig = {}): MappingRules {
    const rules: MappingRules = {
        trie: new Map(),
        basename: new Map()
    }

    const applyMetaOnly = (
        target: { displayName?: string; order?: number; ignore?: boolean },
        value: MappingValue
    ) => {
        if (typeof value === 'string') {
            target.displayName = value;
        } else if (typeof value === 'object') {
            if (value.$name !== undefined) target.displayName = value.$name;
            if (value.$order !== undefined) target.order = value.$order;
            if (value.$ignore !== undefined) target.ignore = value.$ignore;
        }
    };

    const getOrCreateNode = (parentMap: Map<string, ConfigMappingNode>, key: string) => {
        if (!parentMap.has(key)) {
            parentMap.set(key, {
                name: key,
                children: new Map()
            })
        }
        return parentMap.get(key)
    }

    // Nested Function：Creating a Closure
    const parseExactPath = (key: string, value: MappingValue) => {
        //filter(Boolean) filter "" a//b/c/ [a, '', b, c, '']
        const segments = key.split('/').filter(item => Boolean(item))
        let curP = rules.trie
        let target: ConfigMappingNode | undefined = undefined

        for (const segment of segments) {
            // leaf node
            target = getOrCreateNode(curP, segment)!
            curP = target!.children!
        }

        if (target) {
            applyMetaOnly(target, value)
        }
    }

    const parseNested = (parentMap: Map<string, ConfigMappingNode>, key: string, value: MappingValue | string) => {
        const node = getOrCreateNode(parentMap, key)!

        // apply value
        applyMetaOnly(node!, value);

        if (typeof value === 'object') {
            for (const [subKey, subValue] of Object.entries(value)) {
                if (!subKey.startsWith("$") && subKey != null) {
                    parseNested(node.children!, subKey, subValue as MappingValue)
                }
            }
        }
    }

    for (const [key, value] of Object.entries(mapping)) {
        // Category 1: Global Match (Type 1)
        if (key.startsWith("**/")) {
            const cleanKey = key.slice(3);
            const basenameMeta: { displayName?: string; order?: number; ignore?: boolean } = {};
            applyMetaOnly(basenameMeta, value)
            rules.basename.set(cleanKey, basenameMeta);
        }

        // Category 3: Exact Path (Type 3) need bulid Tire split('\')
        else if (key.includes('/')) {
            parseExactPath(key, value)
        }

        // Category 2: Root / Nested Configuration(Type 2)
        else {
            parseNested(rules.trie, key, value)
        }
    }
    return rules
}