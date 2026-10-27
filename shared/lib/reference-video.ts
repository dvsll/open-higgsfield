import type {CreativePlan} from './creative-engine.ts';
import {buildCreativeIntelligence,type CreativeHook,type CreativeIntelligence} from './creative-intelligence.ts';
import {campaignVideoSize} from './campaign-motion.ts';

export type ReferenceRights='inspiration-only'|'user-owned-or-licensed';
export type Confidence='measured'|'observed'|'inferred';

export type ReferenceShot={
 index:number;
 start:number;
 end:number;
 duration:number;
 purpose:'anticipation'|'reveal'|'interaction'|'comparison'|'payoff'|'other';
 composition:string;
 camera:{motion:string;confidence:Confidence};
 interaction:string;
 keyframeUrls:string[];
};

export type ReferenceAnalysis={
 version:1;
 id:string;
 created:number;
 sourceUrl:string;
 originalUrl:string;
 bytes:number;
 duration:number;
 width:number;
 height:number;
 fps:number;
 rights:ReferenceRights;
 creativeMechanism:CreativeHook;
 mechanismConfidence:Confidence;
 shots:ReferenceShot[];
 transitions:{at:number;kind:string;confidence:Confidence}[];
 pacing:{avgShotSec:number;relative:{index:number;share:number}[];note:string};
 visualStyle:{lighting:string;graphics:string;ending:string;confidence:Confidence};
 transferablePrinciples:string[];
 analysisMethod:string;
 warnings:string[];
};

export type CampaignShotBrief={
 index:number;
 purpose:ReferenceShot['purpose'];
 duration:number;
 sceneBrief:string;
 /** Which still seeds LTX for this beat. */
 startKeyframeStrategy:'source-still'|'hero-still'|'generated-open'|'hold';
 endKeyframeStrategy:'hero-still'|'generated-close'|'hold';
 cameraMovement:string;
 motionConstraints:string[];
 textOverlay?:{when:'start'|'mid'|'end';text:string};
 fidelity:string;
};

export type CampaignShotPlan={
 version:1;
 id:string;
 created:number;
 projectId:string;
 brandName:string;
 productSummary:string;
 concept:string;
 intendedOutcome:string;
 creativeHook:CreativeHook;
 sourceAnalysisId?:string;
 rights:ReferenceRights;
 shots:CampaignShotBrief[];
 editing:{transition:'cut'|'dissolve'|'wipe';brandOverlay:boolean;endingCta:boolean};
 fidelityRequirements:string[];
 intelligence:CreativeIntelligence;
 note:string;
};

const clip=(s:string|undefined,n=220)=>(s||'').replace(/\s+/g,' ').trim().slice(0,n);

function purposesFor(hook:CreativeHook,n:number):ReferenceShot['purpose'][]{
 const arc:ReferenceShot['purpose'][]=hook==='dramatic-reveal'?['anticipation','reveal','payoff']
  :hook==='rhythmic-comparison'?['comparison','comparison','payoff']
  :hook==='sensory-reveal'?['anticipation','reveal','payoff']
  :hook==='artistic-metaphor'?['anticipation','interaction','payoff']
  :['interaction','reveal','payoff'];
 return Array.from({length:n},(_,i)=>arc[Math.min(i,arc.length-1)]);
}

function keyStrategy(purpose:ReferenceShot['purpose'],index:number):CampaignShotBrief['startKeyframeStrategy']{
 if(purpose==='anticipation'||(purpose==='interaction'&&index===0))return 'source-still';
 if(purpose==='comparison'&&index===0)return 'source-still';
 return 'hero-still';
}

function briefFor(purpose:ReferenceShot['purpose'],brand:string,product:string,intel:CreativeIntelligence,hook:CreativeHook,principle:string,index:number){
 const feel=intel.intendedFeeling;
 const photo=intel.photographicApproach;
 if(purpose==='anticipation')return `Opening beat for ${brand}: build anticipation. ${photo} Product still present but not the final hero scale. Feeling: ${feel}. ${product}`;
 if(purpose==='reveal')return `Reveal beat for ${brand}: the product becomes unmistakable. ${photo} Hook ${hook}. ${product}`;
 if(purpose==='payoff')return `Payoff beat for ${brand}: settle on a clear branded product hold. ${feel}. ${product}`;
 if(purpose==='comparison')return `Matched comparison beat ${index+1} for ${brand}. Stable framing, intentional variation. ${product}`;
 return `Development beat for ${brand}. ${principle||hook}. ${product}`;
}

function scaleDurations(raw:number[],n:number,totalTarget:number){
 const base=raw.length?raw.slice(0,n):Array.from({length:n},()=>totalTarget/n);
 const sum=base.reduce((a,b)=>a+b,0)||1;
 const scaled=base.map(d=>Math.max(1.5,Math.min(3,+(d/sum*totalTarget).toFixed(2))));
 while(scaled.reduce((a,b)=>a+b,0)>totalTarget+.05&&scaled.length){const i=scaled.indexOf(Math.max(...scaled));scaled[i]=Math.max(1.5,+(scaled[i]-0.15).toFixed(2));}
 return scaled;
}

/** Map measured pacing + inferred mechanism into an original brand shot plan (not a frame copy). */
export function planFromReference(plan:CreativePlan,analysis:ReferenceAnalysis,intel?:CreativeIntelligence):CampaignShotPlan{
 const intelligence=intel||buildCreativeIntelligence(plan,analysis.creativeMechanism);
 const product=clip(plan.input.facts.description,180)||clip(plan.input.productType,80);
 const brand=plan.input.brand.dna.name||'Brand';
 const hook=intelligence.creativeHook;
 const principles=analysis.transferablePrinciples;
 // Two beats on 10GB keeps sequential LTX+assemble reliable while still producing beginning→payoff.
 const n=2;
 const total=Math.min(6,Math.max(3.6,n*2));
 const scaled=scaleDurations(analysis.shots.map(s=>s.duration),n,total);
 const purposes=purposesFor(hook,n);
 const transition=hook==='dramatic-reveal'?'wipe':n>1?'dissolve':'cut';
 const shots:CampaignShotBrief[]=[];
 for(let i=0;i<n;i++){
  const purpose=purposes[i];
  const ref=analysis.shots[i];
  shots.push({
   index:i,
   purpose,
   duration:scaled[i]??2,
   sceneBrief:briefFor(purpose,brand,product,intelligence,hook,principles[i%principles.length]||'',i),
   startKeyframeStrategy:keyStrategy(purpose,i),
   endKeyframeStrategy:i===n-1?'hero-still':'hold',
   cameraMovement:ref?.camera.motion==='mostly-static'||ref?.camera.motion==='static'
    ?'Intentional hold or very gentle push — stillness is a creative choice.'
    :`Adapt motion character (${ref?.camera.motion||'subtle move'}) without copying framing.`,
   motionConstraints:[
    'Do not recreate reference frames, logos, packaging or distinctive footage.',
    'Preserve disclosed product facts only.',
    ...intelligence.factualConstraints.slice(0,2)
   ],
   textOverlay:i===n-1?{when:'end',text:clip(plan.composition.headline,48)}:undefined,
   fidelity:intelligence.fidelity
  });
 }
 return {
  version:1,id:crypto.randomUUID().replace(/-/g,'').slice(0,16),created:Date.now(),
  projectId:plan.projectId,brandName:brand,productSummary:product,
  concept:clip(intelligence.videoConcept,280),
  intendedOutcome:clip(intelligence.visualReaction+' '+intelligence.intendedFeeling,220),
  creativeHook:hook,sourceAnalysisId:analysis.id,rights:analysis.rights,
  shots,editing:{transition,brandOverlay:true,endingCta:true},
  fidelityRequirements:intelligence.factualConstraints,
  intelligence,
  note:'Shot plan adapts transferable creative structure only. Inspiration-only references must never be exported as source footage.'
 };
}

/** Original multi-beat plan when no reference is provided. */
export function planOriginalCampaign(plan:CreativePlan,hook?:CreativeHook):CampaignShotPlan{
 const intelligence=buildCreativeIntelligence(plan,hook);
 const n=intelligence.creativeHook==='lifestyle-moment'?2:3;
 const fake:ReferenceAnalysis={
  version:1,id:'original',created:Date.now(),sourceUrl:'',originalUrl:'',bytes:0,duration:n*2.4,width:0,height:0,fps:24,
  rights:'inspiration-only',creativeMechanism:intelligence.creativeHook,mechanismConfidence:'inferred',
  shots:Array.from({length:n},(_,i)=>({index:i,start:i*2.4,end:(i+1)*2.4,duration:2.4,purpose:'other' as const,composition:'planned',camera:{motion:'push-in',confidence:'inferred' as const},interaction:'none',keyframeUrls:[]})),
  transitions:[],pacing:{avgShotSec:2.4,relative:Array.from({length:n},(_,i)=>({index:i,share:1/n})),note:'Original multi-beat plan'},
  visualStyle:{lighting:'brand-led',graphics:'end-card',ending:'brand payoff',confidence:'inferred'},
  transferablePrinciples:[intelligence.videoConcept,intelligence.photographicApproach],
  analysisMethod:'creative-intelligence-only',warnings:[]
 };
 return planFromReference(plan,fake,intelligence);
}

export function motionPromptForShot(brief:CampaignShotBrief,product:string,intel?:CreativeIntelligence){
 const lane=intel?` Sensory lane: ${intel.sensoryLane}. Feeling: ${intel.intendedFeeling}.`:'';
 return `Short original product commercial shot (${brief.purpose}). ${brief.sceneBrief}${lane} Camera: ${brief.cameraMovement} Keep product recognizable and stable. No new logos/text/hands morphing. Constraints: ${brief.motionConstraints.join(' ')} Product: ${clip(product,160)}`;
}

/** Per-shot LTX duration clamp for 10GB sequential jobs (short beats keep multi-shot reliable). */
export function shotRenderDuration(brief:CampaignShotBrief){
 return Math.max(1.5,Math.min(2,Number(brief.duration)||1.8));
}
