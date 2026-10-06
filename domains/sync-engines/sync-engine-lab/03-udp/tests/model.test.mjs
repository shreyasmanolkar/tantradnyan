import test from 'node:test';
import {run} from '../src/demo.mjs';
test("How does fresh state survive old or missing datagrams?",{timeout:15000},async()=>{await run();});
