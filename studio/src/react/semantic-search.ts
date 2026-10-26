import {useEffect,useState} from 'react';
export type SearchItem={id:string;text:string};
export function useSemanticSearch(query:string,documents:SearchItem[]){
 const [state,setState]=useState<{key:string;results:{id:string;score:number}[];status:string}>({key:'',results:[],status:''});
 const key=JSON.stringify([query.trim(),documents]);
 useEffect(()=>{
  if(query.trim().length<2||!documents.length)return;
  const controller=new AbortController();let active=true;
  setState({key,results:[],status:'Searching locally…'});
  const timer=setTimeout(()=>void(async()=>{
   try{const results:{id:string;score:number}[]=[];for(let i=0;i<documents.length;i+=128){
    let response:Response;for(let attempt=0;;attempt++){response=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:query.trim().slice(0,256),documents:documents.slice(i,i+128)}),signal:controller.signal});if(response.status!==409||attempt>=3)break;await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,500*(attempt+1));controller.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))},{once:true})})}
    const data=await response.json();if(!response.ok)throw Error(data.error||'Local semantic search unavailable. Showing text matches.');
    if(!Array.isArray(data.results))throw Error('Local semantic search unavailable. Showing text matches.');results.push(...data.results);
   }if(active)setState({key,results,status:'Local AI · meaning + text'});
   }catch(error){if(active)setState({key,results:[],status:(error as Error).message})}
  })(),500);
  return()=>{active=false;clearTimeout(timer);controller.abort()};
 },[key]);
 return state.key===key&&query.trim().length>=2?state:{results:[],status:''};
}
