import {API_URL} from './api';
import {getToken} from '../lib/token';
/** Sensitive operations are online-only and never enter the offline outbox. */
export async function secureRequest(path:string, method='GET', body?:unknown, signal?:AbortSignal) {
  const multipart=body instanceof FormData;
  const response=await fetch(`${API_URL}${path}`,{method,signal,headers:{Accept:'application/json',...(!multipart?{'Content-Type':'application/json'}:{}),Authorization:`Bearer ${getToken()}`},body:body===undefined?undefined:multipart?body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) {
    if(data.code==='PASSWORD_CHANGE_REQUIRED') window.location.assign('/change-temporary-password');
    throw new Error(Object.values(data.errors??{}).flat().join(' ')||data.message||`Request failed (${response.status})`);
  }
  return data;
}
