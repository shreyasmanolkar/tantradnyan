import test from 'node:test';
import assert from 'node:assert/strict';

import {Clients} from '../src/model.mjs';
test('client principal is not a human; secret grants only registered scope/audience',()=>{const c=new Clients(),s=c.register('worker','urn:docs',['read']);assert.equal(c.authenticate('worker',s,'urn:docs',['read']).kind,'service');assert.throws(()=>c.authenticate('worker','wrong','urn:docs',['read']));assert.throws(()=>c.authenticate('worker',s,'urn:docs',['admin']));assert.throws(()=>c.authenticate('worker',s,'billing',['read']));});
