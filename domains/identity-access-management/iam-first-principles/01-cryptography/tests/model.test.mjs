import test from 'node:test';
import assert from 'node:assert/strict';

import {demo,secret,digest} from '../src/model.mjs';
test('signature rejects altered authority; AEAD recovers exact plaintext',()=>{const d=demo();assert.equal(d.signatureValid,true);assert.equal(d.tamperValid,false);assert.equal(d.decrypted,'tenant-a:document:read');assert.equal(Buffer.from(secret(),'base64url').length,32);assert.notEqual(digest('a'),digest('b'));});
