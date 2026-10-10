let csrf;
const trace=document.querySelector('#trace'),status=document.querySelector('#status');
async function request(path,options={}){const response=await fetch(path,{...options,headers:{'content-type':'application/json',...(csrf?{'x-csrf-token':csrf}:{}),...options.headers}});const data=await response.json();if(data.csrf)csrf=data.csrf;const visible={...data};if(visible.csrf)visible.csrf='[redacted CSRF proof]';trace.textContent=`${options.method??'GET'} ${path}\nHTTP ${response.status}\n${JSON.stringify(visible,null,2)}\n\n`+trace.textContent.slice(0,6000);status.textContent=`Last response: HTTP ${response.status}`;return data;}
document.querySelector('#login').addEventListener('submit',async e=>{e.preventDefault();await request('/login',{method:'POST',body:JSON.stringify({email:document.querySelector('#email').value,password:document.querySelector('#password').value})});await request('/me');});
document.querySelector('#me').onclick=()=>request('/me');
document.querySelector('#read').onclick=()=>request(`/api/documents/${document.querySelector('#document').value}?tenant=${document.querySelector('#tenant').value}`);
document.querySelector('#logout').onclick=async()=>{await request('/logout',{method:'POST',body:'{}'});csrf=undefined;await request('/me');};
