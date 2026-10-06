import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Which algebra makes replay and reordering harmless?",{timeout:15000},async()=>{await run();});
