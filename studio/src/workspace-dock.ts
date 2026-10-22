import './workspace-dock.css';

export function mountWorkspaceDock(resize:()=>void):void{
 const app=document.querySelector<HTMLElement>('.app')!,timeline=document.querySelector<HTMLElement>('.tlw')!,history=document.querySelector<HTMLElement>('.hist')!;
 const settings=document.getElementById('videoAttributes') as HTMLDetailsElement|null;if(settings)settings.open=false;
 const dock=document.createElement('section');dock.className='timeline-dock';dock.setAttribute('aria-label','Sequence workspace');
 const divider=document.createElement('div');divider.className='dock-divider';divider.tabIndex=0;divider.setAttribute('role','separator');divider.setAttribute('aria-label','Resize timeline');divider.setAttribute('aria-orientation','horizontal');
 const tabs=document.createElement('div');tabs.className='dock-tabs';tabs.innerHTML='<button type="button" aria-pressed="true" data-pane="sequence">Sequence</button><button type="button" aria-pressed="false" data-pane="takes">Takes</button><span>Drag the divider to resize · ↑ ↓ when focused</span>';
 const content=document.createElement('div');content.className='dock-content';content.append(timeline,history);history.hidden=true;dock.append(divider,tabs,content);app.append(dock);
 let height=240;try{height=+(localStorage.getItem('osh-timeline-height')||240)}catch{}
 const apply=(value:number)=>{height=Math.max(Math.min(150,innerHeight*.4),Math.min(innerHeight*.6,Number.isFinite(value)?value:240));app.style.setProperty('--dock-height',height+'px');divider.setAttribute('aria-valuenow',String(Math.round(height)));divider.setAttribute('aria-valuemin','150');divider.setAttribute('aria-valuemax',String(Math.floor(innerHeight*.6)));resize()};
 apply(height);addEventListener('resize',()=>apply(height));
 tabs.onclick=e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-pane]');if(!button)return;const sequence=button.dataset.pane==='sequence';timeline.hidden=!sequence;history.hidden=sequence;tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));resize()};
 const persist=()=>{try{localStorage.setItem('osh-timeline-height',String(height))}catch{}};
 divider.onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();apply(height+(e.key==='ArrowUp'?20:-20));persist()}};
 divider.onpointerdown=e=>{e.preventDefault();const y=e.clientY,initial=height;divider.setPointerCapture(e.pointerId);divider.onpointermove=move=>apply(initial+y-move.clientY);divider.onpointerup=()=>{divider.onpointermove=null;persist()};divider.onpointercancel=()=>{divider.onpointermove=null;apply(initial)}};
}
