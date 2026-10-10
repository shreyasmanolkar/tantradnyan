import {equal} from '../../01-cryptography/src/model.mjs';
export function cookie(token,{secure=true}={}){return `${secure?'__Host-':''}iam=${token}; Path=/; HttpOnly; SameSite=Lax${secure?'; Secure':''}; Max-Age=3600`;}
export function csrfAllowed({origin,expectedOrigin,provided,session}){return origin===expectedOrigin&&typeof provided==='string'&&equal(provided,session.csrf);}
export const demo=()=>({cookieAttributes:cookie('[redacted]'),foreignOriginAllowed:csrfAllowed({origin:'https://evil.invalid',expectedOrigin:'https://app.example',provided:'x',session:{csrf:'x'}})});
