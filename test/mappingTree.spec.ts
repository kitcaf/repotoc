import { describe, it, expect } from 'vitest';
import { buildMappingTree } from '../src/mapping/mappingTree.js';

describe('buildMappingTree', () => {

    describe('Empty config', () => {
        it('should return empty trie and basename for empty object', () => {
            const result = buildMappingTree({});
            expect(result.trie.size).toBe(0);
            expect(result.basename.size).toBe(0);
        });

        it('should return empty result for undefined config', () => {
            const result = buildMappingTree(undefined);
            expect(result.trie.size).toBe(0);
            expect(result.basename.size).toBe(0);
        });
    });

    describe('Category 1: Global match (**/filename)', () => {
        it('should parse string value as displayName', () => {
            const result = buildMappingTree({
                '**/faq.md': 'FAQ'
            });

            expect(result.basename.has('faq.md')).toBe(true);
            expect(result.basename.get('faq.md')?.displayName).toBe('FAQ');
            expect(result.trie.size).toBe(0); // should not enter trie
        });

        it('should parse object value with $name/$order/$ignore', () => {
            const result = buildMappingTree({
                '**/config.md': {
                    $name: 'Config Doc',
                    $order: 10,
                    $ignore: false
                }
            });

            const meta = result.basename.get('config.md');
            expect(meta?.displayName).toBe('Config Doc');
            expect(meta?.order).toBe(10);
            expect(meta?.ignore).toBe(false);
        });

        it('should handle multiple global match rules', () => {
            const result = buildMappingTree({
                '**/faq.md': 'FAQ',
                '**/readme.md': 'README'
            });

            expect(result.basename.size).toBe(2);
            expect(result.basename.get('faq.md')?.displayName).toBe('FAQ');
            expect(result.basename.get('readme.md')?.displayName).toBe('README');
        });
    });

    describe('Category 2: Nested configuration', () => {
        it('should parse root level string value', () => {
            const result = buildMappingTree({
                'client': 'Frontend'
            });

            expect(result.trie.has('client')).toBe(true);
            expect(result.trie.get('client')?.displayName).toBe('Frontend');
        });

        it('should parse root level object value with metadata', () => {
            const result = buildMappingTree({
                'client': {
                    $name: 'Frontend Module',
                    $order: 1,
                    $ignore: false
                }
            });

            const node = result.trie.get('client');
            expect(node?.displayName).toBe('Frontend Module');
            expect(node?.order).toBe(1);
            expect(node?.ignore).toBe(false);
        });

        it('should build subtree for nested sub-paths', () => {
            const result = buildMappingTree({
                'client': {
                    $name: 'Frontend',
                    'utils': 'Utils',
                    'api': {
                        $name: 'API Layer',
                        $order: 2
                    }
                }
            });

            const client = result.trie.get('client');
            expect(client?.displayName).toBe('Frontend');
            expect(client?.children?.size).toBe(2);

            const utils = client?.children?.get('utils');
            expect(utils?.displayName).toBe('Utils');

            const api = client?.children?.get('api');
            expect(api?.displayName).toBe('API Layer');
            expect(api?.order).toBe(2);
        });

        it('should handle deeply nested configuration', () => {
            const result = buildMappingTree({
                'docs': {
                    $name: 'Documentation',
                    'guide': {
                        $name: 'Guide',
                        'getting-started': {
                            $name: 'Getting Started',
                            $order: 1
                        }
                    }
                }
            });

            const docs = result.trie.get('docs');
            const guide = docs?.children?.get('guide');
            const gettingStarted = guide?.children?.get('getting-started');

            expect(docs?.displayName).toBe('Documentation');
            expect(guide?.displayName).toBe('Guide');
            expect(gettingStarted?.displayName).toBe('Getting Started');
            expect(gettingStarted?.order).toBe(1);
        });
    });

    describe('Category 3: Exact path', () => {
        it('should build Trie for simple path', () => {
            const result = buildMappingTree({
                'client/api/user.md': 'User API'
            });

            const client = result.trie.get('client');
            const api = client?.children?.get('api');
            const user = api?.children?.get('user.md');

            expect(client).toBeDefined();
            expect(api).toBeDefined();
            expect(user?.displayName).toBe('User API');
        });

        it('should parse exact path with object value', () => {
            const result = buildMappingTree({
                'server/legacy/old.md': {
                    $name: 'Legacy Code',
                    $ignore: true
                }
            });

            const server = result.trie.get('server');
            const legacy = server?.children?.get('legacy');
            const old = legacy?.children?.get('old.md');

            expect(old?.displayName).toBe('Legacy Code');
            expect(old?.ignore).toBe(true);
        });

        it('should handle multi-level exact path', () => {
            const result = buildMappingTree({
                'a/b/c/d/e.md': 'Deep File'
            });

            let current = result.trie.get('a');
            expect(current).toBeDefined();

            current = current?.children?.get('b');
            expect(current).toBeDefined();

            current = current?.children?.get('c');
            expect(current).toBeDefined();

            current = current?.children?.get('d');
            expect(current).toBeDefined();

            const file = current?.children?.get('e.md');
            expect(file?.displayName).toBe('Deep File');
        });
    });

    describe('Mixed configuration', () => {
        it('should merge nested config and exact path', () => {
            const result = buildMappingTree({
                'client': {
                    $name: 'Frontend',
                    'utils': 'Utils'
                },
                'client/api/user.md': 'User API'
            });

            const client = result.trie.get('client');
            expect(client?.displayName).toBe('Frontend');

            // nested config child node
            expect(client?.children?.get('utils')?.displayName).toBe('Utils');

            // exact path created child node
            const api = client?.children?.get('api');
            expect(api).toBeDefined();
            expect(api?.children?.get('user.md')?.displayName).toBe('User API');
        });

        it('should handle global match + nested config + exact path together', () => {
            const result = buildMappingTree({
                '**/faq.md': 'FAQ',
                'docs': {
                    $name: 'Docs',
                    $order: 1
                },
                'docs/api/index.md': 'API Index'
            });

            // global match
            expect(result.basename.get('faq.md')?.displayName).toBe('FAQ');

            // nested config
            const docs = result.trie.get('docs');
            expect(docs?.displayName).toBe('Docs');
            expect(docs?.order).toBe(1);

            // exact path
            const api = docs?.children?.get('api');
            const index = api?.children?.get('index.md');
            expect(index?.displayName).toBe('API Index');
        });

        it('should allow exact path to override nested config on same node', () => {
            const result = buildMappingTree({
                'client': {
                    $name: 'Frontend',
                    'api': 'API'
                },
                'client/api': {
                    $name: 'API Module',
                    $order: 5
                }
            });

            const client = result.trie.get('client');
            const api = client?.children?.get('api');

            // exact path should override nested config
            expect(api?.displayName).toBe('API Module');
            expect(api?.order).toBe(5);
        });
    });

    describe('Edge cases', () => {
        it('should handle extra slashes in path', () => {
            const result = buildMappingTree({
                'a//b///c.md': 'Test File'
            });

            const a = result.trie.get('a');
            const b = a?.children?.get('b');
            const c = b?.children?.get('c.md');

            expect(c?.displayName).toBe('Test File');
        });

        it('should handle config with only $ignore', () => {
            const result = buildMappingTree({
                'secret': {
                    $ignore: true
                }
            });

            const secret = result.trie.get('secret');
            expect(secret?.ignore).toBe(true);
            expect(secret?.displayName).toBeUndefined();
        });

        it('should handle config with only $order', () => {
            const result = buildMappingTree({
                'important': {
                    $order: -1
                }
            });

            const important = result.trie.get('important');
            expect(important?.order).toBe(-1);
            expect(important?.displayName).toBeUndefined();
        });
    });
});
