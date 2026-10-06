import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {scenario} from './scenario.mjs';
export async function run(options={}) {const {trace,...result}=scenario(options);return result;}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
