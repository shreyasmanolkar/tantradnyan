import test from 'node:test';
import assert from 'node:assert/strict';

import {attributesAllow,related} from '../src/model.mjs';
test('ABAC binds tenant and fresh step-up; ReBAC traversal is bounded',()=>{const f={principal:{active:true,tenant:'a',department:'finance',clearance:2},resource:{tenant:'a',department:'finance',classification:2},context:{mfa:true,now:100,authTime:0}};assert.equal(attributesAllow(f),true);assert.equal(attributesAllow({...f,context:{...f.context,now:301}}),false);assert.equal(attributesAllow({...f,resource:{...f.resource,tenant:'b'}}),false);assert.equal(related('alice','a',[{object:'a',relation:'parent',subject:'b'},{object:'b',relation:'parent',subject:'a'}]),false);});
