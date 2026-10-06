import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Why is a TCP data callback not a message?",{timeout:15000},async()=>{await run();});
