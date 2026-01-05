#!/usr/bin/env node
import readline from 'readline';
import { runCli } from '../runner.js';
import { resolveConfig } from '../option.js';
import type { CleanupInfo } from '../injector/types.js';

async function onCleanupConfirm(info: CleanupInfo): Promise<boolean> {
    console.log(info.description);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Proceed with cleanup? (y/N): ', (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

const config = await resolveConfig();
const result = await runCli(config, { onCleanupConfirm });

if (!result.success) {
    console.error(result.injectionResult.message);
    process.exit(1);
}
