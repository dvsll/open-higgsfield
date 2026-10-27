import type {CreativePlan} from './creative-engine.ts';
import {sceneDirection,type CampaignArchetype} from './ad-scene.ts';

/** Abstract creative mechanisms — not scene templates. */
export const creativeHooks=[
 'sensory-reveal','product-transformation','dramatic-reveal','human-interaction',
 'lifestyle-moment','artistic-metaphor','unexpected-perspective','craftsmanship-detail',
 'emotional-story','graphic-juxtaposition','rhythmic-comparison','variety-showcase'
] as const;
export type CreativeHook=typeof creativeHooks[number];

export type MarketingGoal='awareness'|'desire'|'consideration'|'launch'|'retention'|'catalog';
export type FidelityNeed='exact-packaging'|'recognizable-product'|'creative-interpretation';

export type CreativeIntelligence={
 version:1;
 brandDistinctiveness:string;
 category:string;
 marketingGoal:MarketingGoal;
 occasion?:string;
 productAttributes:string[];
 intendedFeeling:string;
 consumerMotivation:string;
 creativeHook:CreativeHook;
 visualReaction:string;
 photographicApproach:string;
 videoConcept:string;
 copyDirection:string;
 factualConstraints:string[];
 fidelity:FidelityNeed;
 archetype:CampaignArchetype;
 rationale:string;
};

const clip=(s:string|undefined,n=240)=>(s||'').replace(/\s+/g,' ').trim().slice(0,n);
const lower=(...parts:(string|undefined)[])=>parts.map(p=>p||'').join(' ').toLowerCase();

/** Propose 2–3 meaningfully different hooks for this plan (deterministic, extensible). */
export function proposeCreativeHooks(plan:CreativePlan):{hook:CreativeHook;why:string}[]{
 const {archetype}=sceneDirection(plan);
 const text=lower(plan.input.productType,plan.input.request,plan.input.facts.description,plan.input.brand.dna.tone,plan.input.brand.dna.visualStyle,plan.concepts.find(c=>c.id===plan.selectedId)?.idea);
 const out:{hook:CreativeHook;why:string}[]=[];
 const add=(hook:CreativeHook,why:string)=>{if(!out.some(o=>o.hook===hook))out.push({hook,why});};
 if(archetype==='food-editorial'){
  add('sensory-reveal','Appetizing texture and freshness are the persuasion.');
  add('lifestyle-moment','Place the food in a believable sharing or ritual moment.');
  add('unexpected-perspective','A closer or overhead vantage that makes the product the hero.');
 }else if(archetype==='beauty-sensory'){
  add('artistic-metaphor','Atmosphere and materials communicate sensory identity without invented claims.');
  add('craftsmanship-detail','Quiet close attention to form, glass, fabric or finish.');
  add('dramatic-reveal','Build toward the product as the calm payoff.');
 }else if(archetype==='graphic-energy'){
  add('graphic-juxtaposition','Bold shape and contrast carry the brand energy.');
  add('product-transformation','Motion or staging that shows capability without false claims.');
 }else{
  add('lifestyle-moment','Show the product in a credible use or desire context.');
  add('craftsmanship-detail','Make material quality and design the hook.');
 }
 if(/variant|flavor|shade|color|collection|lineup|set of/i.test(text))add('rhythmic-comparison','Repeated framing across variants builds catalog clarity.');
 if(/reveal|launch|new|unbox|open/i.test(text))add('dramatic-reveal','Anticipation then payoff fits a launch story.');
 return out.slice(0,3);
}

export function buildCreativeIntelligence(plan:CreativePlan,hook?:CreativeHook):CreativeIntelligence{
 const {archetype,concept:c}=sceneDirection(plan);
 const proposals=proposeCreativeHooks(plan);
 // Honor an explicit hook from reference analysis even when it is not the category default.
 const chosen=hook||proposals[0].hook;
 if(hook&&!proposals.some(p=>p.hook===hook))proposals.unshift({hook,why:'Adapted from reference pacing/structure for this brand.'});
 const f=plan.input.facts;
 const attrs=[f.texture,f.container,f.arrangement,f.description].map(s=>clip(s,120)).filter(Boolean);
 const feeling=clip(plan.input.brand.dna.tone||c.idea,160)||'Clear, distinctive, brand-true.';
 const fidelity:FidelityNeed=/exact|label|logo|ingredient|packaging must/i.test((plan.input.request||'')+f.description)?'exact-packaging'
  :chosen==='artistic-metaphor'||chosen==='dramatic-reveal'?'creative-interpretation':'recognizable-product';
 const photo=chosen==='sensory-reveal'?'Close, tactile lighting that makes material quality undeniable.'
  :chosen==='dramatic-reveal'?'Composed negative space that stages a reveal payoff.'
  :chosen==='rhythmic-comparison'?'Matched framing so variants read as a set.'
  :chosen==='artistic-metaphor'?'Metaphorical materials and light that echo brand feeling.'
  :'Intentional hero composition with coherent light and contact.';
 const video=chosen==='dramatic-reveal'?'Anticipation beat → brief obscuring or move → product payoff → brand end.'
  :chosen==='rhythmic-comparison'?'Repeated interaction or angle across variants with timed brand payoff.'
  :chosen==='sensory-reveal'?'Slow approach or light shift that heightens texture and appetite/tactility.'
  :'One strong hero shot with genuine environmental or camera motion supporting the concept.';
 return {
  version:1,
  brandDistinctiveness:clip(plan.input.brand.dna.visualStyle||plan.input.brand.dna.positioning||plan.input.brand.dna.name,200),
  category:plan.input.productType,
  marketingGoal:/launch|new|introduc/i.test(plan.input.request||'')?'launch':/catalog|collection|variant/i.test(plan.input.request||'')?'catalog':'desire',
  productAttributes:attrs.slice(0,6),
  intendedFeeling:feeling,
  consumerMotivation:clip(c.idea,180),
  creativeHook:chosen,
  visualReaction:proposals.find(p=>p.hook===chosen)?.why||'Make the product feel desirable and specific.',
  photographicApproach:photo,
  videoConcept:video,
  copyDirection:clip(plan.composition.headline+' — '+c.title,180),
  factualConstraints:[
   f.count?`Keep exactly ${f.count} product(s) when fidelity requires it.`:'Do not invent product count.',
   'Do not invent ingredients, clinical claims, scent notes or unstated benefits.',
   clip(f.description,200)
  ].filter(Boolean),
  fidelity,
  archetype,
  rationale:`Hook ${chosen} for ${archetype}: ${proposals.find(p=>p.hook===chosen)?.why||''}`
 };
}
