import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Why should typing expire while message history persists?",{timeout:15000},async()=>{await run();});
