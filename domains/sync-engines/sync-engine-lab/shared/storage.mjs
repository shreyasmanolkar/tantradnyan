import {mkdirSync,readFileSync,writeFileSync,renameSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
// Atomic replacement for the modeled ordinary process restart. No fsync:
// this does not promise survival of power loss or storage-controller failure.
export class Store {
  constructor(path) { this.path = path; this.memory = null; }
  load(fallback) {
    if (!this.path) return structuredClone(this.memory ?? fallback);
    return existsSync(this.path) ? JSON.parse(readFileSync(this.path,'utf8')) : structuredClone(fallback);
  }
  save(value) {
    if (!this.path) { this.memory = structuredClone(value); return; }
    mkdirSync(dirname(this.path),{recursive:true});
    writeFileSync(this.path+'.tmp',JSON.stringify(value)); renameSync(this.path+'.tmp',this.path);
  }
}
