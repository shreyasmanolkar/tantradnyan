import test from 'node:test';
import assert from 'node:assert/strict';

import {Sessions} from '../src/model.mjs';
test('rotation invalidates pre-login ID, logout and absolute timeout win over activity',()=>{const s=new Sessions({idle:10,absolute:20}),a=s.issue('guest',0),b=s.issue('alice',1,a);assert.equal(s.resolve(a,2),null);assert.equal(s.resolve(b,2).userId,'alice');s.revoke(b);assert.equal(s.resolve(b,3),null);const c=s.issue('alice',0);assert.ok(s.resolve(c,9));assert.ok(s.resolve(c,18));assert.equal(s.resolve(c,20),null);const idle=s.issue('alice',0);assert.equal(s.resolve(idle,10),null);});
