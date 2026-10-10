import test from 'node:test';
import assert from 'node:assert/strict';

import {ApiKeys} from '../src/model.mjs';
test('key identifies integration, audience and revocation are separate checks',()=>{const k=new ApiKeys(),t=k.issue({principal:'svc',audience:'docs',scopes:['read'],expires:10});assert.ok(k.validate(t,'docs',0));assert.equal(k.validate(t,'billing',0),null);assert.equal(k.validate(t+'x','docs',0),null);assert.equal(k.validate(t,'docs',10),null);k.revoke(t);assert.equal(k.validate(t,'docs',0),null);});
