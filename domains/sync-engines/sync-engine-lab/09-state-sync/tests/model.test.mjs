import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Why does copying the entire object lose unrelated edits?",{timeout:15000},async()=>{await run();});
