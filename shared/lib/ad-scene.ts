import type {CreativePlan} from './creative-engine.ts';
import type {AdBackground} from './ad-background.ts';
import type {StaticDesign} from './static-ad.ts';

export type CampaignArchetype='food-editorial'|'beauty-sensory'|'graphic-energy'|'material-study';
export type AdScene=Omit<AdBackground,'model'> & {model:'klein-scene'|'klein-integrated'|'klein-harmonized';background?:AdBackground;cutout?:{url:string;sha256:string;jobId:string;method:string;box:{x:number;y:number;width:number;height:number};width:number;height:number;assetId?:string};placement?:{x:number;y:number;width:number;height:number};sourceSha256:string;archetype:CampaignArchetype;warning:string;preHarmonize?:{url:string;sha256:string};fidelityMode?:'product-fidelity'|'creative-restage'|'hybrid-harmonize'};
const bounded=(s:string|undefined,n=550)=>(s||'').replace(/\s+/g,' ').trim().slice(0,n);
/** Decisions are derived from the reviewed plan, not a hidden per-brand prompt. */
export function sceneDirection(plan:CreativePlan){
 const c=plan.concepts.find(c=>c.id===plan.selectedId);if(!c)throw Error('Choose a reviewed creative direction.');
 const i=plan.input,context=[i.productType,i.request,c.idea,c.environment,i.brand.dna.visualStyle].join(' ');
 const archetype:CampaignArchetype=['cookies','cinnamon-rolls','bakery'].includes(i.productType)?'food-editorial':/skin|beauty|perfume|serum|cosmetic|fragrance/i.test(context)?'beauty-sensory':/athlet|sport|bold|energy/i.test(context)?'graphic-energy':'material-study';
 const treatment=archetype==='food-editorial'?'Premium food campaign still: appetizing close presence, warm directional window light, tactile baked surfaces, layered materials and a believable breakfast/editorial atmosphere. Storytelling props may appear at the edges only when they do not compete with or impersonate the product.':archetype==='beauty-sensory'?'Luxury beauty campaign still: sculptural product hero, deliberate speculars, mineral or fabric staging, atmospheric depth and refined physical contact with the set. The mood follows brand tone; never invent ingredient or efficacy claims.':archetype==='graphic-energy'?'Bold campaign still life: graphic directional light, strong silhouette, deliberate diagonals and a striking material backdrop with physical depth.':'A considered material study: distinctive product silhouette, directional light, tactile surroundings and purposeful negative space.';
 return {archetype,treatment,concept:c};
}
export function adScenePrompt(plan:CreativePlan){
 const {treatment,archetype,concept:c}=sceneDirection(plan),i=plan.input,f=i.facts,locks=plan.context.controls;
 const coastal=/coast|beach|sea|summer|breeze|mineral|turquoise/i.test([i.request,c.idea,c.environment,i.brand.dna.visualStyle].join(' '));
 const foil=/foil|aluminum|aluminium|disposable|loaf tin|loaf pan|bakeware tray/i.test([f.container,f.description,i.request].join(' '));
 const foodArt=foil
  ?'Creative food campaign (AI interpretation): re-photograph the baked goods as an appetizing editorial hero. Prefer removing disposable foil/aluminum trays from the frame when they read as grocery packaging — stage the exact product count directly on walnut or stone with cream linen and warm window side-light raking crumb texture. Keep baked color, chip character and count recognizable. Do not invent competing plated food. This packaging change is Creative Restage, not product-safe.'
  :'Creative food campaign (AI interpretation): re-photograph the reference product as an appetizing editorial hero. Warm side light should rake across crumb and surface. Prefer walnut or stone, cream linen, and quiet breakfast atmosphere. Keep product count and baked character recognizable. Do not invent competing plated food.';
 const beautyArt=coastal
  ?'Creative coastal beauty campaign (AI interpretation): the bottle must physically belong in wet mineral stone beside turquoise water with soft caustics and glass reflections that match the set. Hero scale, deliberate lean or upright pose, refined depth. Keep blank-label packaging blank — never invent logos or claims.'
  :'Creative beauty campaign (AI interpretation): sculptural staging, soft speculars on glass, intentional fabric or mineral contact, shallow depth. Keep blank labels blank; never invent ingredient claims.';
 return [
  'Create ONE finished luxury commercial product photograph from image 1 as identity reference. Continuous physical scene only — never paste, collage, frame, inset, or poster-panel the source. No typography.',
  `Reference product: ${bounded(f.description)} Visible texture: ${bounded(f.texture,300)} Packaging cue: ${bounded(f.container,300)}. ${f.count?`Keep exactly ${f.count} products.`:'Keep the observed product count.'} ${bounded(f.arrangement,280)}. No duplicate products or redesigned branded artwork.`,
  `Fidelity: this is Creative Restage, not product-safe compositing. Requested fidelity ${locks.fidelity}; angle ${locks.angle}; crop ${locks.crop}. Labels, packaging and exact geometry may change — compare with the original before publishing.`,
  archetype==='food-editorial'?foodArt:archetype==='beauty-sensory'?beautyArt:treatment,
  `Approved concept: ${bounded(c.idea)}. Owner direction: ${bounded(i.request)}. Setting: ${locks.background==='keep'?'Keep the source setting.':`Rich brand-aligned environment — ${bounded(c.environment)}`}. Light: ${bounded(c.lighting)}. Tone: ${bounded(i.brand.dna.tone,180)}. Visual character: ${bounded(i.brand.dna.visualStyle,220)}. Palette: ${plan.context.grounding?.palette.slice(0,3).join(', ')||'source-compatible neutrals'}.`,
  'Hero product fills the lower two thirds with true surface contact, coherent shadows and reflected light. Calm upper quarter for separately rendered lettering. Photographic realism over stock-empty backgrounds.'
 ].join('\n\n');
}
export function campaignDesign(base:StaticDesign,archetype:CampaignArchetype,photoId:string):StaticDesign{
 return {...base,photoId,photoConfirmed:true,supportId:undefined,supportGeneration:undefined,campaign:{version:1,archetype},textColor:'#fffaf0'};
}

/** Rich environment for product-fidelity compositing. Props allowed at edges; center stays landable. */
export function adCampaignPrompt(plan:CreativePlan){
 const {concept:c,archetype}=sceneDirection(plan),i=plan.input,visual=[i.request,c.idea,c.environment,i.brand.dna.visualStyle].join(' '),coastal=/coast|beach|sea|summer|breeze/i.test(visual);
 const atmosphere=(i.brand.dna.tone+' '+i.brand.dna.visualStyle).split(/[.!?]+/).filter(s=>!(/\b(cookie|roll|bottle|bakery|food|packaging|product|ingredient|bread)\b/i).test(s)).join('. ').slice(0,400);
 const setting=archetype==='food-editorial'
  ?'Overhead luxury food-editorial TABLETOP ONLY on deep walnut. Warm afternoon window light from upper left with soft falloff. Edge atmosphere only: cream linen folds along one side, a soft flour dusting catching light, optional empty ceramic cup or spoon far at a corner in soft focus. The entire center and lower-center must stay EMPTY bare wood — a clear landing pad. Appetizing warmth and material depth. Absolutely no plated food, no bowls of food, no salad, no bread, no cookies, no cinnamon rolls, no competing dishes.'
  :archetype==='beauty-sensory'&&coastal
  ?'Luxury coastal beauty SET SURFACE only, photographed from above. Pale wet limestone slabs beside shallow turquoise water with delicate caustics. Soft specular daylight from upper left, refined atmospheric depth, a few sparse mineral pebbles at the far edge. The lower-center stone plateau must stay EMPTY and clear for later bottle placement. Premium and intentional. No bottles, jars, pumps, cosmetics or people.'
  :archetype==='beauty-sensory'
  ?'Quiet luxury beauty SURFACE only from above. Sculptural ivory mineral or plaster slabs, soft architectural window light, optional silk or dried botanical at the distant edge. Lower-center plateau EMPTY and clear. No bottles, jars, cosmetics or clutter. No ingredient claims.'
  :archetype==='graphic-energy'
  ?'Bold graphic EMPTY stage from above on a tactile dark architectural surface. Strong diagonal sunlight, dramatic contrast, controlled reflections. Clear empty lower-center stage. No products.'
  :'Considered EMPTY mineral work surface from above with sculptural light and restrained tonal depth. Clear empty lower-center landing zone. No products.';
 return [setting,`Visual atmosphere: ${atmosphere||'Deliberate editorial light and tactile material detail'}. Palette cues: ${plan.context.grounding?.palette.slice(0,3).join(', ')||'restrained source-compatible neutrals'}. Approved mood: ${bounded(c.idea,220)}.`,
 'Single continuous photographic environment with depth, coherent light and believable materials. Upper-left key light. Calm upper quarter for later typography. CRITICAL: do not depict the advertised product, any food that could be sold, packaging, logos, lettering, frames, borders, inset panels, or a filled plate/bowl in the center. Edge props only if empty or non-food.'].join('\n\n');
}

/** Second-pass reference edit: harmonize a fidelity composite without claiming perfect product preservation. */
export function adHarmonizePrompt(plan:CreativePlan){
 const {treatment,concept:c}=sceneDirection(plan),f=plan.input.facts;
 return [
  'Image 1 is a nearly finished advertising composite: an original product cutout placed into a generated set. Harmonize contact lighting, soft edge blending and contact shadows so the product belongs physically in the scene.',
  `Keep the product identity: ${bounded(f.description)}. ${f.count?`Keep exactly ${f.count} products.`:'Keep the observed product count.'} Do not redesign packaging, labels, shapes or materials. Do not invent extra products or food props that could be mistaken for the product.`,
  `Art direction: ${treatment} Concept: ${bounded(c.idea)}. Improve only integration quality: edge light wrap, ambient occlusion at contact, subtle reflected light on packaging, natural shadow softness.`,
  'No typography, logos, frames, collage panels or poster borders. Output one continuous photograph. This is an AI harmonization pass; product fidelity is requested but not guaranteed.'
 ].join('\n\n');
}
