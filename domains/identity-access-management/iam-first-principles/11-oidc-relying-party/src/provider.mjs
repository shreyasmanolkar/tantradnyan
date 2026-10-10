import {Provider} from 'oidc-provider';
export function makeProvider(issuer='http://127.0.0.1:3001',redirect='http://127.0.0.1:3000/oidc/callback'){
 return new Provider(issuer,{
 clients:[{client_id:'iam-rp',client_secret:'example-only confidential client secret',redirect_uris:[redirect],response_types:['code'],grant_types:['authorization_code','refresh_token'],token_endpoint_auth_method:'client_secret_post'}],
 cookies:{keys:['example-only development cookie key one','example-only development cookie key two']},
 claims:{openid:['sub'],email:['email','email_verified'],profile:['name']},
 pkce:{required:()=>true},
 findAccount:async(ctx,id)=>({accountId:id,async claims(){return {sub:id,name:'Local learner',email:`${id}@example.invalid`,email_verified:false};}}),
 features:{devInteractions:{enabled:true},revocation:{enabled:true},introspection:{enabled:true}},
 ttl:{AccessToken:300,AuthorizationCode:60,IdToken:300,RefreshToken:3600,Session:3600}
 });
}
if(import.meta.url===`file://${process.argv[1]}`){makeProvider().listen(3001,'127.0.0.1',()=>console.log('Local development IdP on http://127.0.0.1:3001; development login accepts arbitrary account names.'));}
