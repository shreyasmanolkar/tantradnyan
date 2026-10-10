import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {readFile} from 'node:fs/promises';import {readDocument,assignRole} from '../src/postgres.mjs';
test('real PostgreSQL constraints and live tenant authorization',async()=>{
 if(!process.env.IAM_DATABASE_URL)throw new Error('set IAM_DATABASE_URL to dedicated local scratch database');
 const url=new URL(process.env.IAM_DATABASE_URL);if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('local database required');
 const db=new pg.Client({connectionString:url.href});await db.connect();const schema='iam_test_'+crypto.randomUUID().replaceAll('-','');
 const alice='00000000-0000-4000-8000-000000000001',bob='00000000-0000-4000-8000-000000000002',a='00000000-0000-4000-8000-00000000000a',b='00000000-0000-4000-8000-00000000000b',doc='00000000-0000-4000-8000-00000000000d';
 try{await db.query(`CREATE SCHEMA ${schema}`);await db.query(`SET search_path TO ${schema}`);await db.query(await readFile(new URL('../src/schema.sql',import.meta.url),'utf8'));
 await db.query('INSERT INTO users(id,email) VALUES ($1,$2),($3,$4)',[alice,'alice@example.invalid',bob,'bob@example.invalid']);await db.query('INSERT INTO organizations VALUES ($1,$2,false),($3,$4,false)',[a,'A',b,'B']);await db.query('INSERT INTO workspaces VALUES ($1,$1,$2),($3,$3,$4)',[a,'A',b,'B']);await db.query("INSERT INTO memberships(organization_id,user_id,role) VALUES ($1,$2,'owner'),($1,$3,'viewer'),($4,$3,'viewer')",[a,alice,bob,b]);
 await db.query('INSERT INTO documents VALUES ($1,$2,$1,$3,$4)',[a,doc,alice,'private A']);assert.ok(await readDocument(db,bob,a,doc));assert.equal(await readDocument(db,bob,b,doc),null);
 await assert.rejects(db.query('INSERT INTO documents VALUES ($1,$2,$3,$4,$5)',[b,doc,a,bob,'invalid foreign tenant']));await assert.rejects(assignRole(db,bob,alice,a,'admin'));await assignRole(db,alice,bob,a,'editor');
 await db.query('UPDATE memberships SET active=false WHERE organization_id=$1 AND user_id=$2',[a,bob]);assert.equal(await readDocument(db,bob,a,doc),null);await db.query('UPDATE users SET active=false WHERE id=$1',[alice]);assert.equal(await readDocument(db,alice,a,doc),null);await assert.rejects(assignRole(db,alice,bob,a,'admin'));
 }finally{await db.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await db.end();}
});
