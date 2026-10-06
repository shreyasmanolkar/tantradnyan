import test from 'node:test';
import {run} from '../src/demo.mjs';
test("How do stable IDs make retries safe?",{timeout:15000},async()=>{await run();});
