import {readdir} from 'node:fs/promises';
for(const stage of (await readdir(new URL('.',import.meta.url))).filter(x=>/^\d\d-/.test(x)).sort()){const {demo}=await import(`./${stage}/src/model.mjs`);console.log(JSON.stringify({stage,result:await demo()}));}
