import { describe, it, expect } from 'vitest';
import { applyMapping } from '../src/mapping/applier.js';
import { buildMappingTree } from '../src/mapping/mappingTree.js';
import { DocNode } from '../src/type/docNode.js';
import { MappingRules } from '../src/mapping/types.js';

// Helper function to create a simple DocNode
function createDocNode(name: string, type: 'file' | 'dir', children?: DocNode[]): DocNode {
    return {
        name,
        path: name,
        type,
        children
    };
}

// Helper function to create empty MappingRules
function emptyRules(): MappingRules {
    return {
        trie: new Map(),
        basename: new Map()
    };
}

describe('applyMapping', () => {

    describe('Empty rules', () => {
        it('should not modify nodes when rules are empty', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir', [
                    createDocNode('api.md', 'file')
                ])
            ];

            applyMapping(nodes, emptyRules());

            expect(nodes[0].meta).toBeUndefined();
            expect(nodes[0].children![0].meta).toBeUndefined();
        });
    });

    describe('Trie matching', () => {
        it('should apply displayName from Trie node', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir')
            ];

            const rules = buildMappingTree({
                'client': 'Frontend'
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingName).toBe('Frontend');
        });

        it('should apply order from Trie node', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir')
            ];

            const rules = buildMappingTree({
                'client': {
                    $order: 1
                }
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingOrder).toBe(1);
        });

        it('should apply ignore from Trie node', () => {
            const nodes: DocNode[] = [
                createDocNode('secret', 'dir')
            ];

            const rules = buildMappingTree({
                'secret': {
                    $ignore: true
                }
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingIgnore).toBe(true);
        });

        it('should apply all meta fields together', () => {
            const nodes: DocNode[] = [
                createDocNode('docs', 'dir')
            ];

            const rules = buildMappingTree({
                'docs': {
                    $name: 'Documentation',
                    $order: 10,
                    $ignore: false
                }
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingName).toBe('Documentation');
            expect(nodes[0].meta?.mappingOrder).toBe(10);
            expect(nodes[0].meta?.mappingIgnore).toBe(false);
        });
    });

    describe('Basename matching', () => {
        it('should apply displayName from basename rule', () => {
            const nodes: DocNode[] = [
                createDocNode('docs', 'dir', [
                    createDocNode('faq.md', 'file')
                ])
            ];

            const rules = buildMappingTree({
                '**/faq.md': 'FAQ'
            });

            applyMapping(nodes, rules);

            expect(nodes[0].children![0].meta?.mappingName).toBe('FAQ');
        });

        it('should match basename at any depth', () => {
            const nodes: DocNode[] = [
                createDocNode('level1', 'dir', [
                    createDocNode('level2', 'dir', [
                        createDocNode('level3', 'dir', [
                            createDocNode('readme.md', 'file')
                        ])
                    ])
                ])
            ];

            const rules = buildMappingTree({
                '**/readme.md': 'README'
            });

            applyMapping(nodes, rules);

            const readme = nodes[0].children![0].children![0].children![0];
            expect(readme.meta?.mappingName).toBe('README');
        });

        it('should apply all meta fields from basename rule', () => {
            const nodes: DocNode[] = [
                createDocNode('config.md', 'file')
            ];

            const rules = buildMappingTree({
                '**/config.md': {
                    $name: 'Config',
                    $order: 5,
                    $ignore: true
                }
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingName).toBe('Config');
            expect(nodes[0].meta?.mappingOrder).toBe(5);
            expect(nodes[0].meta?.mappingIgnore).toBe(true);
        });
    });

    describe('Priority: Trie over basename', () => {
        it('should prefer Trie displayName over basename', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir', [
                    createDocNode('faq.md', 'file')
                ])
            ];

            const rules = buildMappingTree({
                '**/faq.md': 'Global FAQ',
                'client': {
                    'faq.md': 'Client FAQ'
                }
            });

            applyMapping(nodes, rules);

            expect(nodes[0].children![0].meta?.mappingName).toBe('Client FAQ');
        });

        it('should prefer Trie order over basename', () => {
            const nodes: DocNode[] = [
                createDocNode('docs', 'dir', [
                    createDocNode('index.md', 'file')
                ])
            ];

            const rules = buildMappingTree({
                '**/index.md': { $order: 100 },
                'docs': {
                    'index.md': { $order: 1 }
                }
            });

            applyMapping(nodes, rules);

            expect(nodes[0].children![0].meta?.mappingOrder).toBe(1);
        });

        it('should fallback to basename when Trie has no value', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir', [
                    createDocNode('faq.md', 'file')
                ])
            ];

            const rules = buildMappingTree({
                '**/faq.md': {
                    $name: 'Global FAQ',
                    $order: 10
                },
                'client': {
                    'faq.md': {
                        $order: 1  // only order, no name
                    }
                }
            });

            applyMapping(nodes, rules);

            // order from Trie, name fallback to basename
            expect(nodes[0].children![0].meta?.mappingOrder).toBe(1);
            // Note: displayName comes from Trie which is undefined, so fallback to basename
            expect(nodes[0].children![0].meta?.mappingName).toBe('Global FAQ');
        });
    });

    describe('Nested scope traversal', () => {
        it('should pass Trie scope to children', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir', [
                    createDocNode('utils', 'dir', [
                        createDocNode('helper.md', 'file')
                    ])
                ])
            ];

            const rules = buildMappingTree({
                'client': {
                    $name: 'Frontend',
                    'utils': {
                        $name: 'Utils',
                        'helper.md': 'Helper'
                    }
                }
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingName).toBe('Frontend');
            expect(nodes[0].children![0].meta?.mappingName).toBe('Utils');
            expect(nodes[0].children![0].children![0].meta?.mappingName).toBe('Helper');
        });

        it('should still match basename when Trie scope is undefined', () => {
            const nodes: DocNode[] = [
                createDocNode('unknown', 'dir', [
                    createDocNode('faq.md', 'file')
                ])
            ];

            const rules = buildMappingTree({
                '**/faq.md': 'FAQ'
            });

            applyMapping(nodes, rules);

            // unknown dir has no Trie node, but child should still match basename
            expect(nodes[0].meta).toBeUndefined();
            expect(nodes[0].children![0].meta?.mappingName).toBe('FAQ');
        });

        it('should handle mixed Trie and basename in nested structure', () => {
            const nodes: DocNode[] = [
                createDocNode('docs', 'dir', [
                    createDocNode('guide', 'dir', [
                        createDocNode('faq.md', 'file'),
                        createDocNode('intro.md', 'file')
                    ])
                ])
            ];

            const rules = buildMappingTree({
                '**/faq.md': 'FAQ',
                'docs': {
                    $name: 'Docs',
                    'guide': {
                        $name: 'Guide',
                        'intro.md': 'Introduction'
                    }
                }
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingName).toBe('Docs');
            expect(nodes[0].children![0].meta?.mappingName).toBe('Guide');
            expect(nodes[0].children![0].children![0].meta?.mappingName).toBe('FAQ'); // basename match
            expect(nodes[0].children![0].children![1].meta?.mappingName).toBe('Introduction'); // Trie match
        });
    });

    describe('Exact path matching', () => {
        it('should match exact path through Trie', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir', [
                    createDocNode('api', 'dir', [
                        createDocNode('user.md', 'file')
                    ])
                ])
            ];

            const rules = buildMappingTree({
                'client/api/user.md': 'User API'
            });

            applyMapping(nodes, rules);

            const userFile = nodes[0].children![0].children![0];
            expect(userFile.meta?.mappingName).toBe('User API');
        });

        it('should not affect sibling nodes', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir', [
                    createDocNode('api', 'dir', [
                        createDocNode('user.md', 'file'),
                        createDocNode('order.md', 'file')
                    ])
                ])
            ];

            const rules = buildMappingTree({
                'client/api/user.md': 'User API'
            });

            applyMapping(nodes, rules);

            expect(nodes[0].children![0].children![0].meta?.mappingName).toBe('User API');
            expect(nodes[0].children![0].children![1].meta).toBeUndefined();
        });
    });

    describe('Edge cases', () => {
        it('should handle nodes with existing meta', () => {
            const nodes: DocNode[] = [
                {
                    name: 'client',
                    path: 'client',
                    type: 'dir',
                    meta: {
                        title: 'Existing Title',
                        order: 99
                    }
                }
            ];

            const rules = buildMappingTree({
                'client': {
                    $name: 'Frontend',
                    $order: 1
                }
            });

            applyMapping(nodes, rules);

            // Should preserve existing meta and add mapping fields
            expect(nodes[0].meta?.title).toBe('Existing Title');
            expect(nodes[0].meta?.order).toBe(99);
            expect(nodes[0].meta?.mappingName).toBe('Frontend');
            expect(nodes[0].meta?.mappingOrder).toBe(1);
        });

        it('should handle empty children array', () => {
            const nodes: DocNode[] = [
                createDocNode('empty', 'dir', [])
            ];

            const rules = buildMappingTree({
                'empty': 'Empty Folder'
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingName).toBe('Empty Folder');
        });

        it('should handle multiple root nodes', () => {
            const nodes: DocNode[] = [
                createDocNode('client', 'dir'),
                createDocNode('server', 'dir'),
                createDocNode('shared', 'dir')
            ];

            const rules = buildMappingTree({
                'client': 'Frontend',
                'server': 'Backend'
            });

            applyMapping(nodes, rules);

            expect(nodes[0].meta?.mappingName).toBe('Frontend');
            expect(nodes[1].meta?.mappingName).toBe('Backend');
            expect(nodes[2].meta).toBeUndefined();
        });
    });
});
