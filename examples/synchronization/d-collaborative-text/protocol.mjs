import {createHash} from 'node:crypto';
export const LOCAL=Symbol('local-edit'),REMOTE=Symbol('remote-provider');
export function binary(value,max=262144){
 if(typeof value!=='string'||value.length%4||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new Error('BAD_BINARY');
 const data=Buffer.from(value,'base64');if(data.length>max||data.toString('base64')!==value)throw new Error('BAD_BINARY');return data;
}
export const b64=data=>Buffer.from(data).toString('base64');
export const updateId=data=>createHash('sha256').update(data).digest('hex');
export function shape(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==keys.slice().sort().join(','))throw new Error('BAD_SHAPE');}
export function boundary(text,index){if(!Number.isInteger(index)||index<0||index>text.length)throw new Error('BAD_INDEX');if(index>0&&index<text.length&&/[\uD800-\uDBFF]/.test(text[index-1])&&/[\uDC00-\uDFFF]/.test(text[index]))throw new Error('SPLIT_SURROGATE');}
