import { OSH } from '../../shared/runtime/client';
import './connection.css';

let mounted=false;
export function mountConnection():void {
  if(mounted)return;mounted=true;
  const notice=document.createElement('section');notice.className='connection-notice';notice.hidden=true;notice.setAttribute('role','alert');
  const title=document.createElement('strong'),message=document.createElement('p'),actions=document.createElement('div');
  const retry=document.createElement('button'),dismiss=document.createElement('button');retry.textContent='Retry connection';dismiss.textContent='Keep editing';actions.append(retry,dismiss);notice.append(title,message,actions);document.body.append(notice);
  let checking=false,disconnected=false,dismissed=false,recovery:ReturnType<typeof setTimeout>|undefined;
  const lost=(reason:string)=>{if(recovery)clearTimeout(recovery);disconnected=true;notice.classList.remove('recovered');title.textContent='Connection interrupted';message.textContent=reason+' Your project stays here. You can keep editing while we reconnect.';actions.hidden=false;notice.hidden=dismissed;const badge=document.getElementById('rt');if(badge){badge.textContent='○ disconnected';badge.classList.remove('on')}};
  const check=async()=>{if(checking)return;checking=true;retry.disabled=true;retry.textContent='Reconnecting…';try{const state=await OSH.health();if(!state.online){lost(!state.info?'Can’t reach the local server.':!state.info.comfyui?'ComfyUI is unavailable.':'The generation connection is unavailable.');return}const badge=document.getElementById('rt');if(badge){badge.textContent='● local ComfyUI';badge.classList.add('on')}if(disconnected){disconnected=false;dismissed=false;title.textContent='Connection restored';message.textContent='You’re ready to generate again. Any interrupted render needs checking before you try again.';actions.hidden=true;notice.classList.add('recovered');notice.hidden=false;recovery=setTimeout(()=>notice.hidden=true,5000);dispatchEvent(new Event('osh-reconnected'))}}finally{checking=false;retry.disabled=false;retry.textContent='Retry connection'}};
  retry.onclick=()=>{dismissed=false;void check()};dismiss.onclick=()=>{dismissed=true;notice.hidden=true};
  addEventListener('offline',()=>lost('The browser lost its connection.'));addEventListener('online',()=>{void check()});addEventListener('focus',()=>{void check()});
  setInterval(()=>{if(!document.hidden)void check()},8000);void check();
}
