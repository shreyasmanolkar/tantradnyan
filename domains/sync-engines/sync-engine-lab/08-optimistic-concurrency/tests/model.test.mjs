import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Why does avoiding write/write conflicts still permit write skew?",{timeout:15000},async()=>{await run();});
