import test from 'node:test';
import {run} from '../src/demo.mjs';
test("How can both clients delete the original B while preserving X?",{timeout:15000},async()=>{await run();});
