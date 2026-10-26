export function scrubbedNumber(initial:number,dx:number,dy:number,step:number,min:number,max:number,large=false){
 return +Math.max(min,Math.min(max,initial+Math.round((dx-dy)/4)*(large?10:1)*step)).toFixed(4);
}
