import test from 'node:test';
import {run} from '../src/demo.mjs';
test("When is a delta independently mergeable?",{timeout:15000},async()=>{await run();});
