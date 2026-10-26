// Portable Ad Studio planning/compilation. No inference, UI or storage side effects.
import {validateBrand,brandFieldStatus,brandContext,type BrandProfile} from './brand.ts';
import {briefDefaults,effectiveControls,newGenerationDraft,recompileDraft,prepareConciseDraft,signalsFromBrand,validateBriefInput,type BriefControls,type BriefInput,type SourceFacts,type GenerationDraft,type Intent} from './product-brief.ts';
import {heroDefaults,type HeroSettings} from './hero-ad.ts';
import {newStaticDesign,staticSizes,staticSVG,type StaticDesign,type StaticConcept} from './static-ad.ts';
import {creativeGrounding,conceptQuality,conceptConstraintIssues,conceptRecommendation,type CreativeGrounding} from './creative-direction.ts';
export type CreativeInput={version:1;projectId:string;brand:BrandProfile;productId?:string;source:BriefInput['source'];facts:SourceFacts;productType:BriefInput['productType'];request?:string;notes?:string;intent?:Intent;format?:keyof typeof staticSizes;seed?:number;constraints?:Partial<BriefControls>};
export type CreativeFact={id:string;text:string;kind:'source'|'owner'|'inferred'|'unconfirmed';sourceIds:string[]};
export type CreativeConcept={id:string;title:string;idea:string;composition:string;camera:string;environment:string;lighting:string;hierarchy:string;layout:StaticConcept;copyId:string;evidenceIds:string[];scores:{impact:number;relevance:number;accuracy:number;feasibility:number};rationale:string};
export type CreativeContext={facts:CreativeFact[];missing:string[];copyOptions:{id:string;headline:string;body:string;kind:'identity'|'creative-proposal'|'source'}[];controls:BriefControls;productName:string;grounding?:CreativeGrounding;observedCount?:number};
export type CreativePlan={version:1;id:string;parentId?:string;projectId:string;created:number;input:CreativeInput;provider:{mode:'local-ai'|'deterministic';model?:string;reason:string;contribution?:{format:string;modelFields:string[];appFields:string[]}};context:CreativeContext;concepts:(CreativeConcept&{evaluation:{score:number;method:string}})[];selectedId:string;selectionReason:string;draft:GenerationDraft;composition:StaticDesign;layout:{width:number;height:number;photoBox:{x:number;y:number;width:number;height:number};textBounds:{text:string;x:number;y:number;width:number;height:number;fontSize:number}[];fit:'contain';exportIntent:'png'};warnings:string[];reviewRequired:true;generationRun:false};
export type CreativePrepared={version:1;planId:string;preparedId:string;projectId:string;draft:GenerationDraft;composition:StaticDesign;payload:{image:string;original:string;settings:HeroSettings;projectId:string};status:'REVIEWED_REQUEST_NOT_A_RUN';generationRun:false;paidApproved:false;privateUploadApproved:false};
const identity=(s:unknown,max=160)=>typeof s==='string'&&/^[A-Za-z0-9_-]+$/.test(s)&&s.length<=max;
const str=(s:unknown,max:number)=>typeof s==='string'&&s.length<=max;
export function campaignControls(input:CreativeInput):BriefControls{
 const intent=input.intent||'campaign',base=briefDefaults(intent);
 if(intent==='campaign')Object.assign(base,{fidelity:'high',exactCount:input.facts.count!==undefined,arrangement:'roughly',angle:'slight',crop:'moderate',background:'replace',creativity:'high'});
 if(intent==='closeup')Object.assign(base,{exactCount:false,angle:'slight',crop:'moderate',background:'replace',creativity:'medium'});
 return effectiveControls({...base,...input.constraints,intent});
}
export function validateCreativeInput(input:CreativeInput){
 if(!input||input.version!==1||!identity(input.projectId)||!input.brand)throw Error('Select a saved project and brand.');
 validateBrand(input.brand);if(!identity(input.brand.id,120)||!Number.isFinite(input.brand.updated))throw Error('Invalid brand identity/revision.');
 if(input.source?.kind!=='original')throw Error('Choose the genuine saved original for Qwen planning.');
 if(!['campaign','closeup','enhancement'].includes(input.intent||'campaign')||!Object.hasOwn(staticSizes,input.format||'feed')||!str(input.request||'',2000)||!str(input.notes||'',3000))throw Error('Invalid creative request or format.');
 if(input.productId){const p=input.brand.products.find(p=>p.id===input.productId);if(!p)throw Error('Product does not belong to this brand.');if(!input.brand.assets.some(a=>a.assetId===input.source.id&&p.imageIds.includes(a.id)))throw Error('Associate this original with the product in Brand DNA, or choose no named product.');}
 validateBriefInput(creativeBriefInput(input));return input;
}
export function creativeBriefInput(input:CreativeInput):BriefInput{
 const product=input.brand.products.find(p=>p.id===input.productId);
 return {version:1,source:structuredClone(input.source),facts:structuredClone(input.facts),productType:input.productType,productName:product?.name.slice(0,80)||'',...(input.productId?{productId:input.productId}:{}),notes:input.notes||'',brand:signalsFromBrand(input.brand,input.productId),execution:{adapter:'qwen-fp8',seed:input.seed??42},controls:campaignControls(input)};
}
// Stable identity includes brand evidence, request, constraints, source and seed.
// The explicit confirmation checkbox alone is allowed to change during review.
export function creativeSnapshot(input:CreativeInput){const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,canonical(v[k])])):v;return JSON.stringify(canonical({...input,facts:{...input.facts,confirmed:false}}));}
export function creativeContext(input:CreativeInput):CreativeContext{
 validateCreativeInput(input);const b=input.brand,context=brandContext(b,input.productId?[input.productId]:['__unmapped__']);
 const facts:CreativeFact[]=[{id:'photo',text:[input.facts.description,input.facts.texture,input.facts.container,`Count: ${input.facts.count??'unknown'}. ${input.facts.arrangement}`].join('\n'),kind:input.facts.confirmed?'owner':'unconfirmed',sourceIds:[]}];
 for(const field of ['name','description','story','tone','visualStyle','positioning','audience','differentiators','guidelines'] as const){const value=b.dna[field];if(!value.trim())continue;const status=brandFieldStatus(b,field),o=b.research?.observations.find(o=>o.field===field);facts.push({id:'brand-'+field,text:value.slice(0,1000),kind:status==='inferred'?'inferred':status==='source'?'source':'owner',sourceIds:o?.sourceIds||[]});}
 if(context.products[0])facts.push({id:'product',text:context.products[0].name+': '+context.products[0].description,kind:'owner',sourceIds:[]});
 const missing=['name','description','tone','visualStyle'].filter(k=>!b.dna[k as keyof typeof b.dna].trim());if(!input.facts.confirmed)missing.push('photo observations need owner confirmation');
 // Copy is constrained to grounded identity/excerpts and clearly non-factual
 // creative language. The model cannot invent printed offers/ingredients/claims.
 const copyOptions:CreativeContext['copyOptions']=[{id:'identity',headline:(context.products[0]?.name||b.dna.name||'A closer look').slice(0,80),body:'',kind:'identity'},{id:'moment',headline:'Make room for a moment.',body:'',kind:'creative-proposal'},{id:'details',headline:'A closer look.',body:'',kind:'creative-proposal'},{id:'discover',headline:'Something worth discovering.',body:'',kind:'creative-proposal'}];
 for(const [i,o]of (b.research?.observations||[]).entries())if(o.kind==='source'&&o.value===o.quote&&o.value.length<=70&&!/\d|[$€£%]|\b(price|sale|offer|free|off|certified|organic|vegan)\b/i.test(o.value)&&o.sourceIds.some(id=>b.research!.sources.some(s=>s.id===id&&s.text.includes(o.value))))copyOptions.push({id:'source-'+i,headline:o.value,body:'',kind:'source'});
 return {facts,missing,copyOptions,controls:campaignControls(input),productName:context.products[0]?.name||'',grounding:creativeGrounding(input),observedCount:input.facts.count};
}
const visualKeys=['title','idea','composition','camera','environment','lighting','hierarchy','rationale'] as const;
// Text proposals are not business facts. Refuse common unsupported physical /
// commercial assertions; copy itself uses only the closed grounded catalog.
const unsafe=/[$€£%]|\b(organic|vegan|gluten.free|sugar.free|certified|award.winning|guaranteed|sale|discount|free shipping|daily fresh|fresh daily|add ingredients|extra products|duplicate products|new logo|redesign the product|change the label|garnish|sprinkle|topped with|add steam|steaming hot)\b/i;
export function validateCreativeConcepts(raw:unknown,context:CreativeContext):CreativeConcept[]{
 const issues=creativeConceptIssues(raw,context);if(issues.length)throw Error(issues.join(' '));return structuredClone((raw as {concepts:CreativeConcept[]}).concepts);
}
// Report every blocking issue from a completed response. Nothing is repaired or
// promoted by this audit; schema normalization lives solely in the strict reader.
export function creativeConceptIssues(raw:unknown,context:CreativeContext):string[]{
 const value=raw as {concepts:CreativeConcept[]};if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>k!=='concepts')||!Array.isArray(value.concepts)||value.concepts.length!==3)return ['Expected three distinct creative concepts.'];
 const ids=new Set<string>(),directions=new Set<string>(),issues:string[]=[],visual:CreativeConcept[]=[];
 for(const [index,c]of value.concepts.entries()){
  const prefix=`Concept ${index+1}: `;if(!c||typeof c!=='object'||Array.isArray(c)){issues.push(prefix+'Invalid concept identity.');continue;}
  if(Object.keys(c).some(k=>!['id',...visualKeys,'layout','copyId','evidenceIds','scores'].includes(k))||!identity(c.id,60)||ids.has(c.id))issues.push(prefix+'Invalid concept identity/fields.');ids.add(c.id);
  let validVisual=true;for(const key of visualKeys){if(!str(c[key],key==='title'?100:700)||!c[key].trim()){issues.push(prefix+'Invalid creative direction: '+key);validVisual=false;}else if(unsafe.test(c[key]))issues.push(prefix+'Unsupported assertion: '+key);else if(/<[^>]+>/.test(c[key]))issues.push(prefix+'Unfilled schema example: '+key);}
  if(!['spotlight','editorial','poster'].includes(c.layout)||!context.copyOptions.some(o=>o.id===c.copyId)||!Array.isArray(c.evidenceIds)||!c.evidenceIds.length||c.evidenceIds.some(id=>!context.facts.some(f=>f.id===id&&f.kind!=='inferred'&&f.kind!=='unconfirmed')))issues.push(prefix+'Ungrounded concept/copy reference.');
  if(!c.scores||Array.isArray(c.scores)||Object.keys(c.scores).length!==4||(['impact','relevance','accuracy','feasibility'] as const).some(k=>!Number.isInteger(c.scores[k])||c.scores[k]<1||c.scores[k]>5))issues.push(prefix+'Invalid concept evaluation.');
  if(validVisual){
   const signature=(c.environment+'|'+c.composition+'|'+c.lighting).toLowerCase().replace(/\W/g,'');if(directions.has(signature))issues.push(prefix+'Concepts differ only in labels/copy.');directions.add(signature);
   issues.push(...conceptConstraintIssues(c,context).map(s=>prefix+s));visual.push(c);
  }
 }
 if(visual.length===3)issues.push(...conceptQuality(visual,context).issues);return issues;
}
export function fallbackConcepts(input:CreativeInput,context:CreativeContext):CreativeConcept[]{
 const bakery=['cinnamon-rolls','cookies'].includes(input.productType),g=context.grounding||creativeGrounding(input),c=context.controls;
 const palette=g.palette.length?`Surroundings may echo ${g.palette.join(', ')}; keep the product's real colours.`:'Use neutral surroundings; no brand palette has been confirmed.';
 const environments=bakery?['A quiet bakery counter beside a broad window; the original container rests against a softly receding plain wall.','A matte paper sweep beneath the intact batch, with a close material-led horizon and no surrounding food.','An uncluttered tonal tabletop and a two-tone background plane; no added props.']:['A quiet functional counter beside architectural window light, with the reference product as the only object.','A matte mineral sweep and a low horizon emphasizing surface construction and material transitions.','A plain geometric colour field and a flat supporting surface; the original package stays the only object.'];
 const enhancement=c.intent==='enhancement';
 const compositions=['An environmental editorial: place the intact grouping in the lower-left with a generous upper-right copy area and visible contact shadow.','A material study: use a centered, frame-filling grouping on a diagonal visual path; reserve a narrow quiet strip above for separate copy.','A graphic campaign: frame the complete silhouette right of centre against broad horizontal colour planes; reserve the left third for separate brand artwork.'];
 return environments.map((environment,i)=>({id:'fallback-'+i,title:enhancement?['Balanced exposure','Tactile detail','Quiet cleanup'][i]:[bakery?'The shared table':'The everyday ritual','Material in focus','The brand statement'][i],idea:enhancement?`Improve ${['light balance while retaining natural shadows','surface readability without smoothing texture','background clarity without replacing the scene'][i]}; retain the original grouping and viewpoint.`:`${['Make the product feel present in a believable everyday setting','Let observed texture and construction carry the visual hook','Make a memorable product silhouette through graphic contrast'][i]}. Proposed treatment: ${g.direction}.`,composition:enhancement?'Retain the original grouping, field of view and position.':c.crop==='none'?'Retain the complete source framing and grouping; use light and background separation within the existing boundaries.':compositions[i],camera:c.angle==='none'?'Keep the source viewpoint.':i===1?'A slightly closer view that keeps every locked unit and the container inside frame.':'A small perspective adjustment only where permitted; retain recognizable geometry.',environment:c.background==='keep'?'Retain the original surroundings.':c.background==='clean'?'Clean incidental distractions in the original background; retain the setting and materials.':environment+' '+palette,lighting:['Broad window side-light with gradual falloff, soft reflected fill and a legible natural contact shadow.','Low grazing soft light across observed relief, with gentle opposing fill to separate texture from shine.','A broad frontal key and subtle edge separation create a crisp silhouette and an even, quiet background.'][i],hierarchy:'Product first; leave the stated quiet area empty for later headline and original brand artwork. No model-generated typography.',layout:(['editorial','spotlight','poster'] as const)[i],copyId:i===0?'moment':i===1?'details':'identity',evidenceIds:context.facts.filter(f=>['brand-name','brand-tone','brand-visualStyle','photo','product'].includes(f.id)&&['owner','source'].includes(f.kind)).map(f=>f.id).slice(0,4),scores:{impact:3,relevance:3,accuracy:3,feasibility:3},rationale:'Rule-based proposal using declared preferences, physical constraints and distinct visual decisions; no AI evaluation or proven image quality.'}));
}
// Keep original evidence verbatim in the draft; do not turn legacy imperative
// clauses inside a photo observation into hidden campaign-preservation locks.
const observation=(s:string)=>s.split(/[;\n]/).filter(v=>!/^\s*(preserve|keep|do not|never)\b/i.test(v)).join('; ').slice(0,900);
export function compileCreativeDraft(input:CreativeInput,concept:CreativeConcept):GenerationDraft{
 const i=creativeBriefInput(input),c=i.controls,d=newGenerationDraft(i),enhancement=c.intent==='enhancement';
 const camera=c.angle==='none'?'Keep the source viewpoint.':c.angle==='slight'?'At most a slight perspective change from the source viewpoint. '+concept.camera:concept.camera;
 const composition=c.crop==='none'?'Retain the original field of view, product boundaries and grouping; create separation through light and permitted surroundings.':concept.composition;
 const background=c.background==='keep'?'Retain the original surroundings.':c.background==='clean'?'Clean incidental distractions in the original surroundings without replacing the setting or materials.':concept.environment;
 d.sections.transformation=`${concept.idea}\nCamera proposal: ${camera}\nPermissions: angle ${c.angle}, crop ${c.crop}, creativity ${c.creativity}; explicit product locks win.`;
 d.sections.composition=composition+' '+concept.hierarchy;d.sections.background=background;
 d.decisions={direction:concept.idea,lighting:concept.lighting,background};recompileDraft(d);prepareConciseDraft(d);
 const texture=i.productType==='cinnamon-rolls'?'Where visible, retain pillowy baked folds, individual spiral seams, uneven icing thickness and brown filling traces; do not invent unseen ingredients.':i.productType==='cookies'?'Retain the observed spread, baked edges, crumb and existing inclusions; never add chips.':i.productType==='packaged-goods'?'Keep the exact package silhouette, seams, cap and printed label geometry; do not redraw branding.':'Keep distinguishing source material and surface landmarks.';
 d.modelPrompt=[`Reference-conditioned product photograph. Image 1 supplies product identity. ${enhancement?(c.background==='replace'?'Authentic enhancement: retain product and viewpoint; replace only the explicitly permitted surroundings.':'Authentic enhancement: improve the existing photograph without reimagining the scene.'):'Create a new advertising photograph, not a copy of the source snapshot.'}`,
 `Visible reference: ${observation(i.facts.description)}. Texture: ${observation(i.facts.texture)}. ${texture} Container: ${observation(i.facts.container)}.`,
 `Preserve recognizable shape, material, real surface irregularity and printed artwork. ${c.exactCount?`Keep exactly ${i.facts.count??'the owner-confirmed count of'} visible products; no additions/removals/merging, all units inside frame.`:'Only the permitted close crop may hide existing units; invent no extra products.'} ${c.arrangement==='exactly'?'Keep individual positions and spacing exactly within the source grouping/container; frame the intact assembly as a unit rather than re-staging its products.':'Retain the source grouping and relative scale; modest staging changes are allowed.'} Observed arrangement: ${observation(i.facts.arrangement)}.`,
 enhancement?`Authentic improvement: ${concept.idea}\nUse the existing camera perspective. Composition: ${composition}\nSetting: ${background}`:`Creative idea: ${concept.idea}\nComposition: ${composition}\nCamera: ${camera}\nSetting: ${background}`,
 `Light: ${concept.lighting} Angle permission: ${c.angle}; crop permission: ${c.crop}. ${c.crop==='none'?'Retain the original field of view.':'Reframe deliberately within the count/arrangement locks.'} ${concept.hierarchy}`,
 `No added food/ingredients, invented products, false labels, extra garnish or product redesign. Keep true texture and plausible contact shadows. No new text, logos, prices or offers: those are composed separately. All unseen geometry is inferred and needs owner inspection.`].join('\n\n');
 if(d.modelPrompt.length>6000)throw Error('Creative prompt exceeds Qwen limit.');return d;
}
export function creativeComposition(input:CreativeInput,concept:CreativeConcept,context:CreativeContext):StaticDesign{
 const d=newStaticDesign(input.brand,input.productId,concept.layout).design,copy=context.copyOptions.find(c=>c.id===concept.copyId)!;
 return {...d,photoId:input.source.id,photoConfirmed:false,size:input.format||'feed',headline:copy.headline,body:copy.body,cta:'',brandName:input.brand.dna.name.slice(0,60)};
}
export function creativeHeroSettings(input:CreativeInput,draft:GenerationDraft):HeroSettings{return {...heroDefaults().settings,sourceId:input.source.id,brandId:input.brand.id,productId:input.productId,sourceKind:'original',imageModel:'qwen-fp8',method:'reimagine',seed:input.seed??42,productName:draft.input.productName,prompt:draft.modelPrompt!,briefDraft:structuredClone(draft),headline:'',website:''};}
export function assembleCreativePlan(input:CreativeInput,concepts:CreativeConcept[],provider:CreativePlan['provider'],id:string):CreativePlan{
 const context=creativeContext(input);const evaluated=concepts.map(c=>({...c,evaluation:conceptRecommendation(c,context)})).sort((a,b)=>b.evaluation.score-a.evaluation.score);
 const selected=evaluated[0],draft=compileCreativeDraft(input,selected);
 const composition=creativeComposition(input,selected,context),layout=staticSVG(composition,{photo:''});
 return {version:1,id,projectId:input.projectId,created:Date.now(),input:structuredClone(input),provider,context,concepts:evaluated,selectedId:selected.id,selectionReason:selected.evaluation.method+' '+selected.rationale,draft,composition,layout:{width:layout.width,height:layout.height,photoBox:layout.photoBox,textBounds:layout.textBounds,fit:'contain',exportIntent:'png'},warnings:[...context.missing.map(k=>'Missing: '+k),...context.grounding!.warnings,...layout.warnings,...(input.constraints?.fidelity==='strict'&&input.intent!=='enhancement'?['Strict owner constraints limit campaign reframing; choose a less restrictive intent to explore.']:[]),'Text planning has no vision model: source observations require owner confirmation.','Camera/background proposals and model scores are not verified facts or fidelity guarantees.','Copy is selected from grounded identity/source excerpts or non-factual proposals; no invented offers or product claims.'],reviewRequired:true,generationRun:false};
}
export function selectCreativePlan(previous:CreativePlan,conceptId:string,id:string):CreativePlan {
 const concept=previous.concepts.find(c=>c.id===conceptId);if(!concept)throw Error('Choose an existing concept.');
 const p=structuredClone(previous),composition=creativeComposition(p.input,concept,p.context),layout=staticSVG(composition,{photo:''});
 return {...p,id,parentId:previous.id,created:Date.now(),selectedId:conceptId,selectionReason:'User selected this alternative; direction and source review are still required.',draft:compileCreativeDraft(p.input,concept),composition,layout:{width:layout.width,height:layout.height,photoBox:layout.photoBox,textBounds:layout.textBounds,fit:'contain',exportIntent:'png'}};
}
