import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Why must the version check and write be indivisible?",{timeout:15000},async()=>{await run();});
