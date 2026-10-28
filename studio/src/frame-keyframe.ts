/** Match actual video frame slots, rather than rounding guide times to tenths. */
export function keyframeAtFrame<T extends {t:number}>(keys:T[],time:number,fps:number):T|undefined{
 const rate=Number.isFinite(fps)&&fps>0?fps:24;
 const frame=Math.round(time*rate);
 return keys.find(key=>Math.round(key.t*rate)===frame);
}

/** Capture the decoded viewer frame, preserving aspect ratio within the upload limit. */
export function captureViewerFrame(video:HTMLVideoElement):string{
 if(video.seeking||video.readyState<2||!video.videoWidth||!video.videoHeight)throw new Error('Wait for the video frame to finish loading.');
 const scale=Math.min(1,2048/video.videoWidth,2048/video.videoHeight);
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
 const context=canvas.getContext('2d');if(!context)throw new Error('This frame could not be captured.');
 context.drawImage(video,0,0,canvas.width,canvas.height);
 return canvas.toDataURL('image/png');
}

/** Decode the final visible frame without moving the user's viewer/playhead. */
export async function captureVideoEnd(url:string):Promise<{image:string;duration:number}>{
 if(!/^\/outputs\/[a-f0-9]{16}\.(webm|mp4)$/.test(url))throw Error('Choose a project video.');
 const video=document.createElement('video');video.muted=true;video.preload='auto';video.playsInline=true;
 const wait=(name:string,run:()=>void)=>new Promise<void>((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);video.removeEventListener(name,done);video.removeEventListener('error',fail)},done=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(Error('Could not decode the video end frame.'))},timer=setTimeout(fail,15000);video.addEventListener(name,done,{once:true});video.addEventListener('error',fail,{once:true});run()});
 try{await wait('loadeddata',()=>{video.src=url;video.load()});const duration=video.duration;if(!Number.isFinite(duration)||duration<=0)throw Error('Video duration is unavailable.');const time=Math.max(0,duration-.001);if(Math.abs(video.currentTime-time)>.0001)await wait('seeked',()=>{video.currentTime=time});return {image:captureViewerFrame(video),duration}}finally{video.removeAttribute('src');video.load()}
}
