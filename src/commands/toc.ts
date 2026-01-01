#!/usr/bin/env node 告诉系统node执行这个文件
import { runCli } from '../runner.js';
import { resolveConfig } from 'src/option.js';

const config = await resolveConfig();
await runCli(config);

