import {gAdd,union,empty2P,twoPAdd,twoPRemove,twoPValues,emptyG,gInc,mergeG,gValue,
  emptyPN,pnInc,pnDec,mergePN,pnValue,emptyMV,mvAssign,mergeMV,mvValues,
  mapWrite,mergeMap,mapValues,seedText,seqInsert,seqDelete,mergeSeq,seqView,
  emptyRich,markIds,mergeRich,richView,emptyOR,addTag,removeObserved,mergeOR,tags} from './model.mjs';
console.log(`G-set: ${[...union(gAdd(new Set(),'M'),gAdd(new Set(),'D'))].sort().join(',')}`);
const removed=twoPRemove(twoPAdd(empty2P(),'urgent'),'urgent');
console.log(`2P-set after removal: ${twoPValues(removed).length} members; re-add forbidden`);
console.log(`G-counter: ${gValue(mergeG(gInc(emptyG(),'M',2n),gInc(emptyG(),'D',3n)))}`);
const stock=pnInc(emptyPN(),'S');
console.log(`PN-counter independent stock decrements: ${pnValue(mergePN(pnDec(stock,'M'),pnDec(stock,'D')))}`);
const titles=mergeMV(mvAssign(emptyMV(),'M','Plan'),mvAssign(emptyMV(),'D','Proposal'));
console.log(`MV title alternatives: ${mvValues(titles).sort().join(',')}`);
const chosen=mvAssign(titles,'M','Project plan');
console.log(`MV after resolution and stale replay: ${mvValues(mergeMV(chosen,titles)).join(',')}`);
const original=mapWrite(new Map(),'title',{stamp:1,actor:'S',id:'S:1',value:'Draft'});
const erased=mapWrite(original,'title',{stamp:2,actor:'M',id:'M:1',value:null},true);
console.log(`map after deletion and stale replay: ${Object.keys(mapValues(mergeMap(erased,original))).length} keys`);
const base=seedText('cat');
const m=seqInsert(base,'M','S:1','X').state,d=seqInsert(base,'D','S:2','Y').state;
console.log(`sequence merged: ${seqView(mergeSeq(m,d)).text}`);
const deleted=seqDelete(m,['S:1']);
console.log(`sequence after deleting anchor c: ${seqView(deleted).text}`);
const rich=emptyRich(base);
const bold=markIds(rich,['S:2'],'bold',true,{stamp:1,actor:'M',id:'M:1'});
const inserted={...rich,sequence:seqInsert(base,'D','S:2','Y').state};
console.log(`rich text explicit marks: ${richView(mergeRich(bold,inserted)).map(x=>`${x.text}${x.marks.bold?'*':''}`).join('')}`);
const tagged=addTag(emptyOR(),'S:1','urgent');
console.log(`OR-set remove/unseen-add: ${tags(mergeOR(removeObserved(tagged,'urgent'),addTag(tagged,'D:1','urgent'))).join(',')}`);
