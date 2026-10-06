import test from 'node:test';
import {run} from '../src/demo.mjs';
test("What does WebSocket framing add to TCP?",{timeout:15000},async()=>{await run();});
