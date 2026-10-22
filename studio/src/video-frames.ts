type Filmstrip={frames:HTMLCanvasElement[];width:number;height:number;duration:number};
const cache=new Map<string,Promise<Filmstrip>>();
export function videoFrames(url:string):Promise<Filmstrip>{
 const found=cache.get(url);if(found)return found;
 const task=async()=>{
  const video=document.createElement('video');video.muted=true;video.preload='auto';video.playsInline=true;
  const wait=(event:string,run:()=>void)=>new Promise<void>((resolve,reject)=>{const clear=()=>{clearTimeout(timer);video.removeEventListener(event,done);video.removeEventListener('error',fail)};const done=()=>{clear();resolve()};const fail=()=>{clear();reject(new Error('Video preview unavailable'))};const timer=setTimeout(fail,15000);video.addEventListener(event,done,{once:true});video.addEventListener('error',fail,{once:true});run()});
  try{
   await wait('loadeddata',()=>{video.src=url;video.load()});
   const width=video.videoWidth,height=video.videoHeight,duration=video.duration,frames:HTMLCanvasElement[]=[];
   for(let i=0;i<8;i++){
    const time=Math.min(Math.max(0,duration-.05),duration*(i+.5)/8);
    if(Math.abs(video.currentTime-time)>.001)await wait('seeked',()=>{video.currentTime=time});
    const frame=document.createElement('canvas'),scale=Math.min(240/width,160/height);frame.width=Math.max(1,Math.round(width*scale));frame.height=Math.max(1,Math.round(height*scale));frame.getContext('2d')!.drawImage(video,0,0,frame.width,frame.height);frames.push(frame);
   }
   return{frames,width,height,duration};
  }finally{video.removeAttribute('src');video.load()}
 };
 const promise=task();cache.set(url,promise);if(cache.size>32)cache.delete(cache.keys().next().value!);return promise;
}
export function paintFilmstrip(canvas:HTMLCanvasElement,strip:Filmstrip):void{
 const g=canvas.getContext('2d')!,h=canvas.height,tile=h*strip.width/strip.height,count=Math.ceil(canvas.width/tile);
 g.clearRect(0,0,canvas.width,h);
 for(let i=0;i<count;i++){const frame=strip.frames[Math.min(strip.frames.length-1,Math.floor((i+.5)/count*strip.frames.length))];g.drawImage(frame,i*tile,0,tile,h)}
}
