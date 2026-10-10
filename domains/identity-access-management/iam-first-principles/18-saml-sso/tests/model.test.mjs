import test from 'node:test';
import assert from 'node:assert/strict';

import {serviceProvider,consume} from '../src/model.mjs';
test('unsigned and malformed assertions fail closed under signed/correlated SP configuration',async()=>{const sp=serviceProvider({cert:'not-a-real-certificate'});await assert.rejects(consume(sp,Buffer.from('<Response><Assertion><Subject>admin</Subject></Assertion></Response>').toString('base64')));await assert.rejects(consume(sp,'not XML'));await assert.rejects(consume(sp,'x'.repeat(100001)));const url=new URL(await sp.getAuthorizeUrlAsync('opaque-relay-state',undefined,{}));assert.ok(url.searchParams.get('SAMLRequest'));});
