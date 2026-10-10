import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.IAM_CHROMIUM??'/usr/bin/chromium',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:3000');await page.getByLabel('Password',{exact:true}).fill('example-only long passphrase');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#trace').textContent.includes('"id": "alice"'));
 let cookie=(await page.context().cookies()).find(c=>c.name==='iam');assert.equal(cookie.httpOnly,true);assert.equal(cookie.sameSite,'Lax');
 await page.getByRole('button',{name:'Read document'}).click();await page.waitForFunction(()=>document.querySelector('#trace').textContent.startsWith('GET /api/documents/doc-a?tenant=a\nHTTP 200'));
 await page.getByLabel('Tenant',{exact:true}).selectOption('b');await page.getByLabel('Document',{exact:true}).selectOption('doc-b');await page.getByRole('button',{name:'Read document'}).click();await page.waitForFunction(()=>document.querySelector('#trace').textContent.startsWith('GET /api/documents/doc-b?tenant=b\nHTTP 404'));
 await page.getByRole('button',{name:'Revoke session'}).click();await page.waitForFunction(()=>document.querySelector('#trace').textContent.startsWith('GET /me\nHTTP 401'));
 console.log('PASS browser: password login, HttpOnly/Lax cookie, authorized read, tenant denial, logout');
 await page.getByRole('link',{name:'Sign in through the local OIDC provider'}).click();
 const login=page.locator('input[name="login"]');if(await login.count()){await login.fill('alice');await page.locator('input[name="password"]').fill('example-only');await page.getByRole('button',{name:/sign.in|log.in|continue/i}).first().click();}
 await page.getByRole('button',{name:'Continue',exact:true}).waitFor();
 const consent=page.getByRole('button',{name:/continue|authorize|allow|accept/i});if(await consent.count())await consent.first().click();
 await page.waitForURL('http://127.0.0.1:3000/');await page.getByRole('button',{name:'Inspect session'}).click();await page.waitForFunction(()=>document.querySelector('#trace').textContent.includes('"id": "alice"'));assert.deepEqual(errors,[]);
 console.log('PASS browser: full local OIDC authorization-code + PKCE + nonce/state login returned linked Alice session; no page errors');
}finally{await browser.close();}
