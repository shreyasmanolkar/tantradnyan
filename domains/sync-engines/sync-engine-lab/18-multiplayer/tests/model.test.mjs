import test from 'node:test';
import {run} from '../src/demo.mjs';
test("What does a late input change in a deterministic simulation?",{timeout:15000},async()=>{await run();});
