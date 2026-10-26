// An owner-opened link can retrieve a local proposal, never approve or generate.
// The service validates saved project/brand/original hashes before any write.
export async function openCampaignReview(address:string,app:{store:{active:()=>{id:string};switchProject:(id:string)=>Promise<unknown>};openPreparedCampaign:(id:string)=>Promise<unknown>}){
 const url=new URL(address),planId=url.searchParams.get('campaign'),projectId=url.searchParams.get('project');
 if(!planId)return;
 if(url.origin!=='http://127.0.0.1:8301'||url.pathname!=='/adstudio/'||url.searchParams.getAll('campaign').length!==1||url.searchParams.getAll('project').length!==1||!/^[a-f0-9]{16}$/.test(planId)||!projectId||!/^[A-Za-z0-9_-]{1,160}$/.test(projectId))throw Error('Invalid local campaign review link. Existing work was kept.');
 const previous=app.store.active().id;
 try{if(previous!==projectId)await app.store.switchProject(projectId);await app.openPreparedCampaign(planId);}
 catch(error){if(app.store.active().id!==previous)await app.store.switchProject(previous);throw error;}
 url.searchParams.delete('campaign');url.searchParams.delete('project');return url;
}
