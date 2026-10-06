import test from 'node:test';
import {run} from '../src/demo.mjs';
test("What survives a client process restart before delivery?",{timeout:15000},async()=>{await run();});
