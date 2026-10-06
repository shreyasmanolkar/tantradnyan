import test from 'node:test';
import {run} from '../src/demo.mjs';
test("How do retries avoid applying the same input twice?",{timeout:15000},async()=>{await run();});
