import {labConfig} from './lab-config.mjs';
import {Repository} from './repository.mjs';
const repo=new Repository(await labConfig());
try{console.log(`Initialized chat_demo on PostgreSQL ${await repo.init()}`);}finally{await repo.close();}
