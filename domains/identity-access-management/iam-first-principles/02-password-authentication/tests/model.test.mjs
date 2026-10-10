import test from 'node:test';
import assert from 'node:assert/strict';

import {hashPassword,verifyPassword} from '../src/model.mjs';
test('independent salts, correct credential, wrong credential and bounded input',async()=>{const a=await hashPassword('example-only long passphrase'),b=await hashPassword('example-only long passphrase');assert.notEqual(a.hash,b.hash);assert.equal(await verifyPassword('example-only long passphrase',a),true);assert.equal(await verifyPassword('wrong',a),false);await assert.rejects(hashPassword('short'));assert.equal(await verifyPassword('x'.repeat(1025),a),false);});
