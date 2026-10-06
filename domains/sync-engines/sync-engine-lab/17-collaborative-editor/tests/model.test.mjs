import test from 'node:test';
import {run} from '../src/demo.mjs';
test("How do stable anchors avoid shifting text offsets?",{timeout:15000},async()=>{await run();});
