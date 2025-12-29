#!/usr/bin/env node 告诉系统node执行这个文件
import process from 'node:process';
import { parseCliArgs } from '../orderParse.js';
import { runCli } from '../runner.js';


const options = parseCliArgs(process.cwd(), process.argv.slice(2));
await runCli(options);

