import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Session, waitForLock, serializable } from './psql-session.mjs';
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
test('PostgreSQL 18 transaction histories on an isolated lab database', { timeout: 90000 }, async t => {
  const schema = 'lab_' + randomUUID().replaceAll('-', '');
  const control = new Session(), a = new Session(), b = new Session();
  const nameA = schema + '_a', nameB = schema + '_b';
  try {
    await control.query('\\set VERBOSITY verbose');
    assert.equal(await control.query("SELECT current_database() || ':' || current_user;"), 'sync_lab:sync_lab');
    const version = await control.query("SELECT current_setting('server_version');");
    assert.ok(version.startsWith('18.'), `Require PostgreSQL 18, received ${version}`);
    console.log(`validated server: PostgreSQL ${version}`);
    await control.query(`CREATE SCHEMA ${schema};`);
    await control.configure(schema, schema + '_control');
    await control.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    await Promise.all([a.configure(schema, nameA), b.configure(schema, nameB)]);
    const reset = () => control.query("TRUNCATE changes, operation_results; UPDATE records SET value=0,version=0; UPDATE doctors SET on_call=true;");
    await t.test('rollback hides a provisional mutation and restores old state', async () => {
      await reset(); await a.query("BEGIN; UPDATE records SET value=9 WHERE id='counter';");
      assert.equal(await b.query("SELECT value FROM records WHERE id='counter';"), '0');
      await a.query('ROLLBACK;'); assert.equal(await control.query("SELECT value FROM records;"), '0');
    });
    await t.test('two stale client assignments reproduce a lost update', async () => {
      await reset(); await Promise.all([a.query('BEGIN;'), b.query('BEGIN;')]);
      const reads = await Promise.all([a.query('SELECT value FROM records;'), b.query('SELECT value FROM records;')]);
      assert.deepEqual(reads, ['0', '0']);
      await a.query("UPDATE records SET value=1,version=version+1 WHERE id='counter'; COMMIT;");
      await b.query("UPDATE records SET value=1,version=version+1 WHERE id='counter'; COMMIT;");
      assert.equal(await control.query('SELECT value FROM records;'), '1');
    });
    await t.test('atomic increments wait on the row and both effects survive', async () => {
      await reset(); await a.query("BEGIN; UPDATE records SET value=value+1,version=version+1 WHERE id='counter';");
      const waiting = b.query("UPDATE records SET value=value+1,version=version+1 WHERE id='counter' RETURNING value;");
      await waitForLock(control, nameB); await a.query('COMMIT;');
      assert.equal(await waiting, '2'); assert.equal(await control.query('SELECT value FROM records;'), '2');
    });
    await t.test('version CAS rejects the obsolete base and supports an intentional retry', async () => {
      await reset();
      const statement = "UPDATE records SET value=value+1,version=version+1 WHERE id='counter' AND version=0 RETURNING value;";
      assert.equal(await a.query(statement), '1'); assert.equal(await b.query(statement), '');
      assert.equal(await b.query("UPDATE records SET value=value+1,version=version+1 WHERE id='counter' AND version=1 RETURNING value;"), '2');
    });
    await t.test('a waiting conditional decrement reevaluates the final-unit predicate', async () => {
      await reset(); await control.query('UPDATE records SET value=1;');
      const statement = "UPDATE records SET value=value-1 WHERE id='counter' AND value>=1 RETURNING value;";
      await a.query('BEGIN;'); assert.equal(await a.query(statement), '0');
      const waiting = b.query(statement); await waitForLock(control, nameB); await a.query('COMMIT;');
      assert.equal(await waiting, ''); assert.equal(await control.query('SELECT value FROM records;'), '0');
    });
    await t.test('Read Committed refreshes while Repeatable Read retains its snapshot', async () => {
      await reset(); await a.query('BEGIN ISOLATION LEVEL READ COMMITTED;');
      assert.equal(await a.query('SELECT value FROM records;'), '0');
      await b.query('UPDATE records SET value=1;'); assert.equal(await a.query('SELECT value FROM records;'), '1');
      await a.query('COMMIT; BEGIN ISOLATION LEVEL REPEATABLE READ;');
      assert.equal(await a.query('SELECT value FROM records;'), '1');
      await b.query('UPDATE records SET value=2;'); assert.equal(await a.query('SELECT value FROM records;'), '1');
      await a.query('ROLLBACK;');
    });
    await t.test('snapshot isolation admits write skew on different doctor rows', async () => {
      await reset(); await Promise.all([a.query('BEGIN ISOLATION LEVEL REPEATABLE READ;'), b.query('BEGIN ISOLATION LEVEL REPEATABLE READ;')]);
      assert.deepEqual(await Promise.all([a.query('SELECT count(*) FROM doctors WHERE on_call;'), b.query('SELECT count(*) FROM doctors WHERE on_call;')]), ['2', '2']);
      await a.query('UPDATE doctors SET on_call=false WHERE id=1; COMMIT;');
      await b.query('UPDATE doctors SET on_call=false WHERE id=2; COMMIT;');
      assert.equal(await control.query('SELECT count(*) FROM doctors WHERE on_call;'), '0');
    });
    await t.test('serializable retry rereads the whole decision and preserves one doctor', async () => {
      await reset(); const readyA=deferred(),readyB=deferred(),releaseA=deferred(),releaseB=deferred();
      const observedB=[];
      const work=(id,ready,release,observations)=>async(session,attempt)=>{
        const count=Number(await session.query('SELECT count(*) FROM doctors WHERE on_call;'));
        if(observations)observations.push(count);
        if(attempt===1){ready.resolve();await release.promise;}
        if(count>1)await session.query(`UPDATE doctors SET on_call=false WHERE id=${id};`);
        return count;
      };
      const resultA=serializable(a,work(1,readyA,releaseA));
      const resultB=serializable(b,work(2,readyB,releaseB,observedB));
      await Promise.all([readyA.promise,readyB.promise]);releaseA.resolve();await resultA;releaseB.resolve();
      assert.equal(await resultB,1);assert.deepEqual(observedB,[2,1]);
      assert.equal(await control.query('SELECT count(*) FROM doctors WHERE on_call;'),'1');
    });
    await t.test('record, replay result and change log commit together; lost-ACK replay is stable', async () => {
      await reset();
      // Discard the first returned result to model a missing application ACK.
      await a.query("SELECT submit_increment('M:1',0,1);");
      const second=JSON.parse(await b.query("SELECT submit_increment('D:1',1,1);"));
      assert.equal(second.value,'2');
      const replay=JSON.parse(await b.query("SELECT submit_increment('M:1',0,1);"));
      assert.deepEqual(replay,{accepted:true,value:'1',version:'1'});
      assert.equal(await control.query('SELECT value FROM records;'),'2');
      assert.equal(await control.query('SELECT count(*) FROM changes;'),'2');
      await assert.rejects(a.query("SELECT submit_increment('M:1',0,7);"),e=>e.code==='23514');
      assert.equal(await control.query('SELECT value FROM records;'),'2');
    });
    await t.test('concurrent duplicate submission waits then returns the original outcome once', async () => {
      await reset(); await a.query("BEGIN; SELECT submit_increment('M:1',0,1);");
      const waiting=b.query("SELECT submit_increment('M:1',0,1);");
      await waitForLock(control,nameB);await a.query('COMMIT;');
      assert.deepEqual(JSON.parse(await waiting),{accepted:true,value:'1',version:'1'});
      assert.equal(await control.query('SELECT count(*) FROM changes;'),'1');
    });
    await t.test('aborted acceptance rolls back all three sides of the commit boundary', async () => {
      await reset();await a.query("BEGIN; SELECT submit_increment('M:1',0,1); ROLLBACK;");
      assert.equal(await control.query('SELECT value FROM records;'),'0');
      assert.equal(await control.query('SELECT count(*) FROM operation_results;'),'0');
      assert.equal(await control.query('SELECT count(*) FROM changes;'),'0');
    });
    await t.test('storage constraints reject invalid values and keys without changing committed state', async () => {
      await reset();
      await assert.rejects(a.query("UPDATE records SET value=-1 WHERE id='counter';"),e=>e.code==='23514');
      await assert.rejects(a.query("UPDATE records SET value=NULL WHERE id='counter';"),e=>e.code==='23502');
      await assert.rejects(a.query('INSERT INTO doctors VALUES(1,true);'),e=>e.code==='23505');
      await assert.rejects(a.query("INSERT INTO changes VALUES('missing',1,0,'missing-op');"),e=>e.code==='23503');
      assert.equal(await control.query('SELECT value FROM records;'),'0');
    });
    await t.test('opposite lock acquisition causes one real deadlock victim and clean rollback', async () => {
      await reset();
      await a.query('BEGIN; UPDATE doctors SET on_call=false WHERE id=1;');
      await b.query('BEGIN; UPDATE doctors SET on_call=false WHERE id=2;');
      const waitingA=a.query('UPDATE doctors SET on_call=false WHERE id=2;');
      await waitForLock(control,nameA);
      const waitingB=b.query('UPDATE doctors SET on_call=false WHERE id=1;');
      const outcomes=await Promise.allSettled([waitingA,waitingB]);
      const victims=outcomes.filter(x=>x.status==='rejected');
      assert.equal(victims.length,1);assert.equal(victims[0].reason.code,'40P01');
      await Promise.all([a.query('ROLLBACK;'),b.query('ROLLBACK;')]);
      assert.equal(await control.query('SELECT count(*) FROM doctors WHERE on_call;'),'2');
    });
    await t.test('rejected operations replay the rejection rather than reinterpreting a changed base', async () => {
      await reset();
      const rejected=JSON.parse(await a.query("SELECT submit_increment('M:bad',99,1);"));
      assert.equal(rejected.accepted,false);
      await b.query("SELECT submit_increment('D:1',0,1);");
      assert.deepEqual(JSON.parse(await a.query("SELECT submit_increment('M:bad',99,1);")),rejected);
      assert.equal(await control.query('SELECT count(*) FROM changes;'),'1');
    });
  } finally {
    await Promise.allSettled([a.close(),b.close()]);
    try { await control.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE;`); } finally { await control.close(); }
  }
});
