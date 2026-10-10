import test from 'node:test';
import assert from 'node:assert/strict';

import {cookie,csrfAllowed} from '../src/model.mjs';
test('cookie host boundary and CSRF require both origin and session-bound proof',()=>{assert.match(cookie('x'),/__Host-iam=.*Secure/);assert.equal(csrfAllowed({origin:'https://app.example',expectedOrigin:'https://app.example',provided:'x',session:{csrf:'x'}}),true);assert.equal(csrfAllowed({origin:'https://evil.invalid',expectedOrigin:'https://app.example',provided:'x',session:{csrf:'x'}}),false);assert.equal(csrfAllowed({origin:'https://app.example',expectedOrigin:'https://app.example',provided:'wrong',session:{csrf:'x'}}),false);});
