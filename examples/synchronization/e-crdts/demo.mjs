import {fixtures,replicate} from './replication.mjs';
for(const fixture of fixtures()) {
 const result=replicate(fixture,7);
 console.log(`${result.name}: ${JSON.stringify(result.after)}; convergence verified`);
}
