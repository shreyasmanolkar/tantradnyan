import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Can a single event loop lose a write?",{timeout:15000},async()=>{await run();});
