// Public API exports for adapters module
export * from './types.js';
export * from './registry.js';
export * from './vitepressAdapter.js';
export * from './writer.js';
export * from './runner.js';

import { AdapterRegistry } from './registry.js';
import { vitepressAdapter } from './vitepressAdapter.js';

/**
 * Create and initialize the default adapter registry with built-in adapters
 * @returns Initialized AdapterRegistry with vitepress adapter registered
 */
export function createDefaultRegistry(): AdapterRegistry {
    const registry = new AdapterRegistry();
    
    // Register built-in adapters (Requirements 3.7)
    registry.register(vitepressAdapter);
    
    return registry;
}

/**
 * Default global registry instance with built-in adapters
 */
export const defaultRegistry = createDefaultRegistry();
