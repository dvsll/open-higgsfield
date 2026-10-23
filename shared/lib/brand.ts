// Brand Intelligence V1: portable data only; no UI, inference or storage side effects.
export const dnaFields=['name','description','story','positioning','tone','visualStyle','audience','differentiators','guidelines'] as const;
export type DNAField=typeof dnaFields[number];
export type BrandDNA=Record<DNAField,string>;
export type BrandProduct={id:string;name:string;description:string;sellingPoints:string;sourceUrl?:string;imageIds:string[]};
export type BrandAsset={id:string;name:string;role:'logo'|'product'|'reference';productId?:string;assetId:string;sourceUrl?:string};
export type BrandSource={id:string;url:string;title:string;text:string;sha256:string;fetchedAt:number};
export type BrandObservation={field:string;value:string;kind:'source'|'inference';sourceIds:string[];quote?:string};
export type BrandImage={url:string;alt:string;role:'logo'|'product'|'reference';sourceId:string};
export type AnalysisProvider={provider:'ollama'|'none';available:boolean;model?:string;digest?:string;reason:string};
export type BrandResearch={version:1;website:string;created:number;sources:BrandSource[];observations:BrandObservation[];images:BrandImage[];colors:string[];products:Omit<BrandProduct,'id'|'imageIds'>[];provider:AnalysisProvider;warnings:string[];aiCompleted:boolean};
export type BrandProfile={version:1;id:string;created:number;updated:number;website:string;dna:BrandDNA;colors:string[];products:BrandProduct[];assets:BrandAsset[];overrides:string[];research?:BrandResearch;reviewedAt?:number};
export const emptyDNA=():BrandDNA=>Object.fromEntries(dnaFields.map(k=>[k,''])) as BrandDNA;
export function newBrand(name=''):BrandProfile{const now=Date.now();return {version:1,id:crypto.randomUUID(),created:now,updated:now,website:'',dna:{...emptyDNA(),name},colors:[],products:[],assets:[],overrides:[]};}
export function publicLink(value:unknown){if(typeof value!=='string'||value.length>2048)return false;try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function validateResearch(value:unknown):BrandResearch{
 const r=value as BrandResearch,fail=()=>{throw Error('Invalid brand research. Previous evidence was kept.');};
 if(!r||r.version!==1||!publicLink(r.website)||!Array.isArray(r.sources)||!r.sources.length||r.sources.length>4||!Array.isArray(r.observations)||r.observations.length>30||!Array.isArray(r.images)||r.images.length>40||!Array.isArray(r.products)||r.products.length>40||!Array.isArray(r.colors)||r.colors.some(c=>!/^#[a-f0-9]{6}$/i.test(c))||typeof r.aiCompleted!=='boolean'||!r.provider||!['none','ollama'].includes(r.provider.provider)||typeof r.provider.reason!=='string'||!Array.isArray(r.warnings)||r.warnings.some(w=>typeof w!=='string'))return fail();
 const ids=new Set<string>();for(const s of r.sources){if(!s||typeof s.id!=='string'||ids.has(s.id)||!publicLink(s.url)||typeof s.title!=='string'||typeof s.text!=='string'||s.text.length>20000||! /^[a-f0-9]{64}$/i.test(s.sha256))return fail();ids.add(s.id);}
 if(r.observations.some(o=>!o||typeof o.field!=='string'||typeof o.value!=='string'||o.value.length>5000||!['source','inference'].includes(o.kind)||!Array.isArray(o.sourceIds)||!o.sourceIds.length||o.sourceIds.some(id=>!ids.has(id))))return fail();
 if(r.images.some(i=>!i||!publicLink(i.url)||typeof i.alt!=='string'||!['logo','product','reference'].includes(i.role)||!ids.has(i.sourceId)))return fail();
 if(r.products.some(p=>!p||typeof p.name!=='string'||p.name.length>200||typeof p.description!=='string'||p.description.length>5000||typeof p.sellingPoints!=='string'||p.sellingPoints.length>5000||(p.sourceUrl&&!publicLink(p.sourceUrl))))return fail();
 return r;
}
export function validateBrand(value:unknown):BrandProfile{
 const b=value as BrandProfile,fail=()=>{throw Error('Invalid brand profile. Existing data was not overwritten.');};
 if(!b||b.version!==1||typeof b.id!=='string'||!b.id||!b.dna||typeof b.website!=='string'||(b.website&&!publicLink(b.website)))return fail();
 for(const field of dnaFields)if(typeof b.dna[field]!=='string'||b.dna[field].length>(field==='name'?120:5000))return fail();
 if(!Array.isArray(b.colors)||b.colors.length>12||b.colors.some(c=>!/^#[a-f0-9]{6}$/i.test(c))||!Array.isArray(b.products)||b.products.length>100||!Array.isArray(b.assets)||b.assets.length>150||!Array.isArray(b.overrides)||b.overrides.some(s=>typeof s!=='string'))return fail();
 const ids=new Set<string>();for(const p of b.products){if(!p||typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||p.name.length>200||typeof p.description!=='string'||p.description.length>5000||typeof p.sellingPoints!=='string'||p.sellingPoints.length>5000||!Array.isArray(p.imageIds)||p.imageIds.some(id=>typeof id!=='string')||(p.sourceUrl&&!publicLink(p.sourceUrl)))return fail();ids.add(p.id);}
 const assets=new Set<string>();for(const a of b.assets){if(!a||typeof a.id!=='string'||assets.has(a.id)||typeof a.assetId!=='string'||!a.assetId||typeof a.name!=='string'||!['logo','product','reference'].includes(a.role)||(a.productId&&!ids.has(a.productId))||(a.sourceUrl&&!publicLink(a.sourceUrl)))return fail();assets.add(a.id);}
 if(b.products.some(p=>p.imageIds.some(id=>!assets.has(id))))return fail();
 if(b.research)validateResearch(b.research);
 return b;
}
// Re-research never silently erases customer corrections or their product/photo records.
export function applyResearch(brand:BrandProfile,research:BrandResearch){
 validateResearch(research);
 brand.website=research.website;brand.research=research;delete brand.reviewedAt;
 for(const field of dnaFields){if(brand.overrides.includes(field))continue;const found=research.observations.find(o=>o.field===field);brand.dna[field]=found?.value||'';}
 if(!brand.overrides.includes('colors'))brand.colors=[...research.colors];
 for(const p of research.products)if(brand.products.length<100&&!brand.products.some(x=>x.name.toLowerCase()===p.name.toLowerCase()))brand.products.push({...p,id:crypto.randomUUID(),imageIds:[]});
 return validateBrand(brand);
}
// Explicit reviewed snapshot for Composer/future generation. Hypotheses stay labeled.
export function brandContext(brand:BrandProfile,productIds:string[]=[]){validateBrand(brand);return {version:1 as const,brandId:brand.id,revision:brand.updated,reviewed:Boolean(brand.reviewedAt),identity:{...brand.dna},colors:[...brand.colors],products:brand.products.filter(p=>!productIds.length||productIds.includes(p.id)).map(p=>({...p,images:brand.assets.filter(a=>p.imageIds.includes(a.id)).map(a=>({assetId:a.assetId,sourceUrl:a.sourceUrl}))})),logoAssetIds:brand.assets.filter(a=>a.role==='logo').map(a=>a.assetId),inferredFields:brand.research?.observations.filter(o=>o.kind==='inference'&&!brand.overrides.includes(o.field)).map(o=>o.field)||[]};}
