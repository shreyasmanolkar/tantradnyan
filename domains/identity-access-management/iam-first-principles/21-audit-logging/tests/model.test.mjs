import test from 'node:test';
import assert from 'node:assert/strict';

import {Audit} from '../src/model.mjs';
test('allowlisted fields omit secrets, CRLF cannot inject lines, edit detected',()=>{const a=new Audit('ephemeral-test-key');a.append({event:'login\nfake',password:'secret',refresh_token:'secret'});assert.equal(a.rows[0].password,undefined);assert.equal(a.rows[0].refresh_token,undefined);assert.equal(a.rows[0].event,'login fake');assert.equal(a.verify(),true);a.rows[0].event='changed';assert.equal(a.verify(),false);});
