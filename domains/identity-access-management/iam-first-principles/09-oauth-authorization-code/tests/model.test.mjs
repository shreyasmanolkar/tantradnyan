import test from 'node:test';
import assert from 'node:assert/strict';

import {Codes,clients} from '../src/model.mjs';
import {scenario,challengeOf} from '../../10-pkce/src/model.mjs';
test('exact redirect, approved scope, expiry, client binding and one-time consumption',()=>{const s=scenario();assert.throws(()=>s.codes.authorize({...s.request,redirectUri:s.request.redirectUri+'.evil'}));assert.throws(()=>s.codes.authorize({...s.request,scopes:['admin']}));for(const change of [{clientId:'other'},{redirectUri:'http://evil.invalid'},{now:60}])assert.throws(()=>s.codes.redeem({...s.request,code:s.code,verifier:s.v,challengeOf,...change}));assert.equal(s.codes.redeem({...s.request,code:s.code,verifier:s.v,challengeOf}).subject,'alice');assert.throws(()=>s.codes.redeem({...s.request,code:s.code,verifier:s.v,challengeOf}));});
