import type { Adapter } from './types.js';

/**
 * Error thrown by AdapterRegistry operations
 */
export class AdapterRegistryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AdapterRegistryError';
    }
}

/**
 * Required properties for a valid adapter
 */
const REQUIRED_ADAPTER_PROPERTIES = ['name', 'outputFormat', 'defaultOutputPath'] as const;
const REQUIRED_ADAPTER_METHODS = ['detect', 'generate'] as const;

/**
 * AdapterRegistry - Central registry for managing document framework adapters
 * 
 * Provides registration, retrieval, listing, and detection capabilities
 * for adapters that transform DocNode trees into framework-specific formats.
 */
export class AdapterRegistry {
    private adapters: Map<string, Adapter> = new Map();

    /**
     * Register a new adapter
     * @param adapter - The adapter to register
     * @throws AdapterRegistryError if adapter is invalid or name is already registered
     */
    register(adapter: Adapter): void {
        this.validateAdapter(adapter);

        if (this.adapters.has(adapter.name)) {
            throw new AdapterRegistryError(`Adapter "${adapter.name}" is already registered`);
        }

        this.adapters.set(adapter.name, adapter);
    }

    /**
     * Get an adapter by name
     * @param name - The adapter name
     * @returns The adapter instance
     * @throws AdapterRegistryError if adapter is not registered
     */
    get(name: string): Adapter {
        const adapter = this.adapters.get(name);
        if (!adapter) {
            throw new AdapterRegistryError(`Adapter "${name}" is not registered`);
        }
        return adapter;
    }

    /**
     * List all registered adapter names
     * @returns Array of adapter names
     */
    list(): string[] {
        return Array.from(this.adapters.keys());
    }

    /**
     * Execute detection for all registered adapters
     * @param rootPath - Project root directory path
     * @returns Array of adapter names that detected their framework
     */
    async detectAll(rootPath: string): Promise<string[]> {
        const detectedAdapters: string[] = [];

        for (const [name, adapter] of this.adapters) {
            try {
                const detected = await adapter.detect(rootPath);
                if (detected) {
                    detectedAdapters.push(name);
                }
            } catch (error) {
                // Log warning but treat as not detected
                console.warn(`Adapter "${name}" detection failed:`, error);
            }
        }

        return detectedAdapters;
    }

    /**
     * Validate that an adapter implements all required interface members
     * @param adapter - The adapter to validate
     * @throws AdapterRegistryError if adapter is invalid
     */
    private validateAdapter(adapter: unknown): asserts adapter is Adapter {
        if (!adapter || typeof adapter !== 'object') {
            throw new AdapterRegistryError('Invalid adapter: adapter must be an object');
        }

        const adapterObj = adapter as Record<string, unknown>;

        // Check required properties
        for (const prop of REQUIRED_ADAPTER_PROPERTIES) {
            if (!(prop in adapterObj) || adapterObj[prop] === undefined) {
                throw new AdapterRegistryError(`Invalid adapter: missing required property "${prop}"`);
            }
        }

        // Check required methods
        for (const method of REQUIRED_ADAPTER_METHODS) {
            if (!(method in adapterObj) || typeof adapterObj[method] !== 'function') {
                throw new AdapterRegistryError(`Invalid adapter: missing required property "${method}"`);
            }
        }
    }
}
