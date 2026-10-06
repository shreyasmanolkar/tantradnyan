import assert from 'node:assert/strict';
// A fixed primary with durable per-replica fencing epochs. Demonstrates ACK
// threshold and stale-owner rejection, NOT election or consensus safety.
export function run() {
  const replicas=Array.from({length:3},()=>({epoch:1,log:[]}));
  const write=(epoch,id,online)=>{
    let acks=0;
    for(const i of online){const r=replicas[i];if(r.epoch!==epoch)continue;if(!r.log.includes(id))r.log.push(id);acks++;}
    return {committed:acks>=2,acks};
  };
  const first=write(1,'U',[0,1]);assert.equal(first.committed,true);
  replicas[0].epoch=2;replicas[1].epoch=2;
  const stale=write(1,'V',[0,1,2]);assert.equal(stale.committed,false);
  const one=write(2,'W',[0]);assert.equal(one.committed,false);
  return {first,stale,one,replicas,limitation:'No leader election, log matching or safe promotion; minority writes need recovery rules.'};
}
if(process.argv[1]?.endsWith('/quorum-model.mjs'))console.log(run());
