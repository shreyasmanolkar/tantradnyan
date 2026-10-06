import test from 'node:test';
import {run} from '../src/demo.mjs';
test("Which invariants survive loss, offline edits, replay and restart?",{timeout:15000},async()=>{await run();});
