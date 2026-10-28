/** One contrast range for the whole clip, so depth never pumps between frames. */
export function normalizeDepthFrames(frames:{data:Uint8ClampedArray}[]){
 let min=255,max=0;for(const frame of frames)for(let i=0;i<frame.data.length;i+=4){const value=frame.data[i];if(value){min=Math.min(min,value);max=Math.max(max,value)}}
 if(max<=min)return;
 for(const frame of frames)for(let i=0;i<frame.data.length;i+=4){const value=frame.data[i],depth=value?Math.round(1+254*(value-min)/(max-min)):0;frame.data[i]=frame.data[i+1]=frame.data[i+2]=depth}
}
