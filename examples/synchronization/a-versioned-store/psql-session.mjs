import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
export class SqlError extends Error {
  constructor(output) { super(output); this.code = output.match(/^ERROR:\s+([A-Z0-9]{5}):/m)?.[1]; }
}
// A lab adapter, not an SQL parameterization API. All SQL is authored fixtures;
// identifiers are generated from a restricted alphabet, never user input.
export class Session {
  constructor() {
    this.output = ''; this.pending = null;
    this.child = spawn('docker', ['exec', '-i', 'sync-masterclass-pg18', 'sh', '-c',
      'exec psql -X -qAt -U sync_lab -d sync_lab -v ON_ERROR_STOP=0 2>&1'],
      { stdio: ['pipe', 'pipe', 'pipe'] });
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', chunk => {
      this.output += chunk;
      const p = this.pending;
      if (!p) return;
      const boundary = this.output.indexOf(p.marker + '\n');
      if (boundary < 0) return;
      const result = this.output.slice(0, boundary).trim();
      this.output = this.output.slice(boundary + p.marker.length + 1);
      this.pending = null; clearTimeout(p.timer); p.resolve(result);
    });
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', x => { this.output += x; });
    this.child.on('error', e => this.fail(e));
    this.child.on('close', code => this.fail(new Error(`psql session exited ${code}: ${this.output}`)));
  }
  fail(error) {
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(error); this.pending = null; }
  }
  async query(sql) {
    if (this.pending) throw new Error('One active query per session required');
    if (this.child.exitCode !== null) throw new Error('Session closed');
    const marker = '__END_' + randomUUID().replaceAll('-', '');
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.fail(new Error('Query timeout')); this.child.kill(); }, 15000);
      this.pending = { marker, resolve, reject, timer };
      this.child.stdin.write(sql + '\n\\echo ' + marker + '\n');
    });
    if (/^ERROR:/m.test(result)) throw new SqlError(result);
    return result;
  }
  async configure(schema, applicationName) {
    if (!/^[a-z0-9_]+$/.test(schema) || !/^[a-z0-9_]+$/.test(applicationName)) throw new Error('Unsafe lab identifier');
    await this.query(`\\set VERBOSITY verbose\nSET search_path TO ${schema}; SET application_name='${applicationName}'; SET statement_timeout='8s';`);
  }
  async close() {
    if (this.child.exitCode !== null || this.child.signalCode !== null) return;
    await new Promise(resolve => {
      const timer = setTimeout(() => { this.child.kill(); resolve(); }, 2000);
      this.child.once('close', () => { clearTimeout(timer); resolve(); });
      this.child.stdin.end('\\q\n');
    });
  }
}
export function rows(output) { return output ? output.split('\n').filter(x => !x.startsWith('NOTICE:') && !x.startsWith('WARNING:')) : []; }
export async function waitForLock(control, applicationName) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const r = await control.query(`SELECT wait_event_type FROM pg_stat_activity WHERE application_name='${applicationName}';`);
    if (r === 'Lock') return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('Expected database lock wait did not occur');
}
export async function serializable(session, work, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await session.query('BEGIN ISOLATION LEVEL SERIALIZABLE;');
      const result = await work(session, attempt);
      await session.query('COMMIT;'); return result;
    } catch (error) {
      await session.query('ROLLBACK;');
      if (!['40001', '40P01'].includes(error.code) || attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 * 2 ** (attempt - 1)));
    }
  }
  throw new Error('Invalid retry budget');
}
