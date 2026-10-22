export function seedOnboarding(id:string):void{
 const shotId=crypto.randomUUID(),spec={mia:false,bolt:false,scene:'',scale:1};
 const prompt='A tiny copper robot carefully waters a single bright yellow flower on a wooden workbench inside a sunlit glass greenhouse. Warm morning light, soft dust floating in the air, cinematic photography, one continuous shot.';
 const shot={id:shotId,n:'A little kindness',d:4,spec,prompt,m:'Slow camera push toward the robot. It tilts a small watering can and a few droplets fall onto the flower.',keys:[],r:false};
 const set=(key:string,value:unknown)=>localStorage.setItem(`osh:${id}:${key}`,JSON.stringify(value));
 set('osh-director',{SH:[shot],cur:0,G:0,STASH:[],TRASH:[],HISTORY:[]});
 set('osh-workspace',{mode:'video',keyframeCount:2,image:{prompt:'A tiny copper robot beside a bright yellow flower on a wooden workbench in a sunlit glass greenhouse, small watering can in its hands, warm morning light, cinematic photography.',url:null}});
 set('osh-onboarding',{step:'prompt',shotId,images:[],firstVideo:null,dismissed:false});
}
