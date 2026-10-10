import {DOMParser} from '@xmldom/xmldom';
import {SAML,ValidateInResponseTo} from '@node-saml/node-saml';
export function serviceProvider({cert,callbackUrl='http://127.0.0.1:3000/saml/acs',entryPoint='http://127.0.0.1:3002/sso',cacheProvider}){
 return new SAML({callbackUrl,entryPoint,issuer:'urn:iam-lab:sp',idpIssuer:'urn:iam-lab:idp',idpCert:cert,audience:'urn:iam-lab:sp',wantAssertionsSigned:true,wantAuthnResponseSigned:true,validateInResponseTo:ValidateInResponseTo.always,requestIdExpirationPeriodMs:60000,acceptedClockSkewMs:1000,disableRequestedAuthnContext:true,...(cacheProvider?{cacheProvider}:{})});
}
export async function consume(sp,SAMLResponse){if(typeof SAMLResponse!=='string'||SAMLResponse.length>100000)throw new Error('invalid response size');if(/<!DOCTYPE|<!ENTITY/i.test(Buffer.from(SAMLResponse,'base64').toString('utf8')))throw new Error('DTD forbidden');const result=await sp.validatePostResponseAsync({SAMLResponse});if(!result.profile?.nameID)throw new Error('missing NameID');const profile=result.profile;
 if(profile.issuer!=='urn:iam-lab:idp')throw new Error('wrong assertion issuer');
 const assertionXml=profile.getAssertionXml(),responseXml=profile.getSamlResponseXml();
 if(/<!DOCTYPE|<!ENTITY/i.test(assertionXml+responseXml))throw new Error('DTD forbidden');
 const parser=new DOMParser(),assertion=parser.parseFromString(assertionXml,'text/xml'),response=parser.parseFromString(responseXml,'text/xml');
 const destination=sp.options.callbackUrl;
 if(response.documentElement.getAttribute('Destination')!==destination)throw new Error('wrong destination');
 const confirmations=Array.from(assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion','SubjectConfirmation'));
 if(!confirmations.some(c=>c.getAttribute('Method')==='urn:oasis:names:tc:SAML:2.0:cm:bearer'&&Array.from(c.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion','SubjectConfirmationData')).some(n=>n.getAttribute('Recipient')===destination&&n.getAttribute('InResponseTo')===profile.inResponseTo&&Date.parse(n.getAttribute('NotOnOrAfter'))>Date.now())))throw new Error('wrong or expired recipient confirmation');
 return profile;}
export const demo=()=>({validation:'node-saml: signature + conditions + audience + recipient + request correlation',unsignedResponse:'rejected by tests',production:'tenant-specific pinned metadata/certificates'});
