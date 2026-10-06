import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Which timestamps detect concurrency?",{timeout:15000},async()=>{await run();});
