import test from 'node:test';
import assert from 'node:assert/strict';

import {challengeOf,demo} from '../src/model.mjs';
test('RFC 7636 vector and intercepted-code rejection',()=>{assert.equal(challengeOf('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');assert.deepEqual(demo(),{interceptedDenied:true,legitimate:'alice'});});
