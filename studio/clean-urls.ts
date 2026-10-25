import type {Connect,Plugin} from 'vite';

const pages:Record<string,string>={
 '/studio/admin':'/studio/admin.html',
 '/studio/director':'/studio/director.html',
 '/studio/edit':'/studio/edit.html',
 '/studio/design-lab':'/studio/design-lab.html',
};
export function studioRoute(raw:string):{redirect?:string;rewrite?:string}{
 const query=raw.indexOf('?'),path=query<0?raw:raw.slice(0,query),search=query<0?'':raw.slice(query);
 if(path==='/index.html')return {redirect:'/'+search};
 if(['/studio','/studio/','/studio/index.html'].includes(path))return {redirect:'/studio/director'+search};
 for(const [clean,html]of Object.entries(pages)){
  if(path===html||path===clean+'/')return {redirect:clean+search};
  if(path===clean)return {rewrite:html+search};
 }
 return {};
}
export function cleanStudioUrls():Plugin{
 const route:Connect.NextHandleFunction=(request,response,next)=>{
  if(!['GET','HEAD'].includes(request.method||''))return next();
  const result=studioRoute(request.url||'/');
  if(result.redirect){response.statusCode=308;response.setHeader('Location',result.redirect);response.end();return;}
  if(result.rewrite)request.url=result.rewrite;
  next();
 };
 return {name:'studio-clean-urls',configureServer(server){server.middlewares.use(route)},configurePreviewServer(server){server.middlewares.use(route)}};
}
