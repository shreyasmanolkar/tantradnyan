import test from 'node:test';
import assert from 'node:assert/strict';

import {expanded,mayAssign} from '../src/model.mjs';
test('inheritance and cycle detection, assignment is its own privileged action',()=>{assert.deepEqual([...expanded('editor',{viewer:{permissions:['read']},editor:{permissions:['write'],parents:['viewer']}})],['write','read']);assert.throws(()=>expanded('a',{a:{parents:['b']},b:{parents:['a']}}));assert.equal(mayAssign('admin','owner'),false);assert.equal(mayAssign('owner','admin'),true);});
