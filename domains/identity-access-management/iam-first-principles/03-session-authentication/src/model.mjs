import {secret,digest} from '../../01-cryptography/src/model.mjs';
export class Sessions {
 constructor({idle=300,absolute=3600}={}){this.rows=new Map();this.idle=idle;this.absolute=absolute;}
 issue(userId,now,old){if(old)this.revoke(old);const token=secret();this.rows.set(digest(token),{userId,created:now,last:now,csrf:secret(),authTime:now});return token;}
 resolve(token,now){const row=this.rows.get(digest(token??''));if(!row)return null;
 if(now-row.last>=this.idle||now-row.created>=this.absolute){this.revoke(token);return null;}row.last=now;return {...row};}
 revoke(token){this.rows.delete(digest(token??''));}
 revokeUser(userId){for(const [key,row] of this.rows)if(row.userId===userId)this.rows.delete(key);}
}
export function demo(){const s=new Sessions();const old=s.issue('guest',0),fresh=s.issue('alice',1,old);const before=!!s.resolve(fresh,2);s.revoke(fresh);return {oldValid:!!s.resolve(old,2),before,after:!!s.resolve(fresh,3)};}
