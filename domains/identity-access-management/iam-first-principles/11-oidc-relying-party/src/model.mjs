import * as client from 'openid-client';
export async function connect(issuer,clientId='iam-rp',secret='example-only confidential client secret'){
 const url=new URL(issuer);const local=url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname);
 if(url.protocol!=='https:'&&!local)throw new Error('untrusted insecure issuer');
 const config=await client.discovery(url,clientId,secret,client.ClientSecretPost(secret),{execute:[client.enableNonRepudiationChecks,...(local?[client.allowInsecureRequests]:[])]});
 return config;
}
export async function begin(config,redirectUri){
 const verifier=client.randomPKCECodeVerifier(),state=client.randomState(),nonce=client.randomNonce();
 const url=client.buildAuthorizationUrl(config,{redirect_uri:redirectUri,scope:'openid profile email',code_challenge:await client.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256',state,nonce});
 return {url,transaction:{verifier,state,nonce,created:Date.now()}};
}
export async function finish(config,currentUrl,transaction){
 if(!transaction||Date.now()-transaction.created>300000)throw new Error('expired login transaction');
 const tokens=await client.authorizationCodeGrant(config,new URL(currentUrl),{pkceCodeVerifier:transaction.verifier,expectedState:transaction.state,expectedNonce:transaction.nonce,idTokenExpected:true});
 const claims=tokens.claims();if(!claims?.sub)throw new Error('missing subject');
 return {issuer:config.serverMetadata().issuer,subject:claims.sub,claims,tokens};
}
export const demo=()=>({implementation:'openid-client + local oidc-provider',identityKey:['issuer','subject'],validation:['signature','issuer','audience','expiry','state','nonce','PKCE']});
