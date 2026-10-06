import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Why can delivery order differ from send order?",{timeout:15000},async()=>{await run();});
