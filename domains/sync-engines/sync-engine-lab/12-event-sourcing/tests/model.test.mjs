import test from 'node:test';
import {run} from '../src/demo.mjs';
test("What must replay know besides event bytes?",{timeout:15000},async()=>{await run();});
