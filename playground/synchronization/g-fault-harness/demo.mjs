import {runScenario} from './scenario.mjs';import {Journal} from './journal.mjs';
const seed=Number(process.argv[2]??7),a=await runScenario(seed),b=await runScenario(seed);
console.log(JSON.stringify(a.result));console.log(`same-seed replay=${JSON.stringify(a.trace)===JSON.stringify(b.trace)}; anchored trace valid=${Journal.verify(a.trace,a.anchor)}`);
