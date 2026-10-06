import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import * as c from '../../shared/crdt.mjs';
export async function run() {
 const results={};const pair=(name,a,b,merge,value)=>{const ab=merge(a,b),ba=merge(b,a);assert.deepEqual(value(ab),value(ba));assert.deepEqual(merge(ab,ab),ab);results[name]=value(ab);};
 pair('GCounter',{A:2},{B:3},c.gMerge,c.gValue);
 pair('PNCounter',c.pnAdd(c.pnEmpty(),'A',-2),c.pnAdd(c.pnEmpty(),'B',5),c.pnMerge,c.pnValue);
 pair('GSet',['a'],['b'],c.setMerge,x=>x);
 pair('TwoPSet',c.twoAdd(c.twoEmpty(),'x'),c.twoRemove(c.twoEmpty(),'x'),c.twoMerge,c.twoValue);
 const base=c.orAdd(c.orEmpty(),'x','A:1'),removed=c.orRemove(base,'x'),concurrent=c.orAdd(base,'x','B:1');
 pair('ORSet',removed,concurrent,c.orMerge,c.orValue);assert.deepEqual(results.ORSet,['x']);
 pair('LWW',{tag:[1,'A'],value:'red'},{tag:[1,'B'],value:'blue'},c.lwwMerge,x=>x.value);
 pair('Map',c.mapWrite({},'x',1,[1,'A']),c.mapWrite({},'y',2,[1,'B']),c.mapMerge,c.mapValue);
 pair('Text',c.textInsert(c.textEmpty(),[1,'A'],null,'X'),c.textInsert(c.textEmpty(),[1,'B'],null,'Y'),c.textMerge,c.textValue);
 return results;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
