import test from 'node:test';
import assert from 'node:assert/strict';

import {OpaqueTokens} from '../src/model.mjs';
test('introspection returns inactive for revoked, expired, unknown and wrong-resource tokens',()=>{const s=new OpaqueTokens(),t=s.issue({sub:'alice',aud:'docs',scope:'read',expires:10});assert.equal(s.introspect(t,'docs',0).active,true);for(const args of [[t,'billing',0],[t,'docs',10],['missing','docs',0]])assert.deepEqual(s.introspect(...args),{active:false});s.revoke(t);assert.deepEqual(s.introspect(t,'docs',1),{active:false});});
