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
