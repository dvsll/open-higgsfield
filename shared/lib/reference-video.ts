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
 startKeyframeStrategy:'hero-still'|'generated-open'|'hold';
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
 editing:{transition:'cut'|'dissolve';brandOverlay:boolean;endingCta:boolean};
 fidelityRequirements:string[];
 intelligence:CreativeIntelligence;
 note:string;
};

const clip=(s:string|undefined,n=220)=>(s||'').replace(/\s+/g,' ').trim().slice(0,n);

/** Map measured pacing + inferred mechanism into an original brand shot plan (not a frame copy). */
export function planFromReference(plan:CreativePlan,analysis:ReferenceAnalysis,intel?:CreativeIntelligence):CampaignShotPlan{
 const intelligence=intel||buildCreativeIntelligence(plan,analysis.creativeMechanism);
 const product=clip(plan.input.facts.description,180)||clip(plan.input.productType,80);
 const brand=plan.input.brand.dna.name||'Brand';
 const hook=intelligence.creativeHook;
 const principles=analysis.transferablePrinciples;
 const n=Math.min(3,Math.max(1,analysis.shots.length||1));
 const total=Math.min(9,Math.max(campaignVideoSize.duration,n*2.5));
 const durations=analysis.shots.slice(0,n).map(s=>s.duration);
 const sum=durations.reduce((a,b)=>a+b,0)||1;
 const scaled=durations.map(d=>Math.max(1.2,Math.min(4,+(d/sum*total).toFixed(2))));
 while(scaled.reduce((a,b)=>a+b,0)>total+.05&&scaled.length){const i=scaled.indexOf(Math.max(...scaled));scaled[i]=Math.max(1.2,+(scaled[i]-0.2).toFixed(2));}
 const purposes:ReferenceShot['purpose'][]=hook==='dramatic-reveal'?['anticipation','reveal','payoff']
  :hook==='rhythmic-comparison'?['comparison','comparison','payoff']
  :hook==='sensory-reveal'?['anticipation','reveal','payoff']
  :['interaction','payoff'];
 const shots:CampaignShotBrief[]=[];
 for(let i=0;i<n;i++){
  const purpose=purposes[Math.min(i,purposes.length-1)];
  const ref=analysis.shots[i];
  shots.push({
   index:i,
   purpose,
   duration:scaled[i]??campaignVideoSize.duration,
   sceneBrief:purpose==='anticipation'
    ?`Original ${brand} setup that builds anticipation without copying reference frames. Product: ${product}. Feeling: ${intelligence.intendedFeeling}.`
    :purpose==='reveal'||purpose==='payoff'
    ?`Original ${brand} product reveal/payoff. Keep product recognizable. ${product}. Hook: ${hook}.`
    :purpose==='comparison'
    ?`Matched composition for ${brand} variant/interaction beat ${i+1}. ${product}.`
    :`Original ${brand} interaction/lifestyle beat. ${product}. Principle: ${principles[i%principles.length]||hook}.`,
   startKeyframeStrategy:i===0?'hero-still':'generated-open',
   endKeyframeStrategy:i===n-1?'hero-still':'hold',
   cameraMovement:ref?.camera.motion==='static'?'Gentle push or hold with intentional stillness.':`Adapt reference motion character (${ref?.camera.motion||'subtle move'}) without copying framing.`,
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
  shots,editing:{transition:n>1?'dissolve':'cut',brandOverlay:true,endingCta:true},
  fidelityRequirements:intelligence.factualConstraints,
  intelligence,
  note:'Shot plan adapts transferable creative structure only. Inspiration-only references must never be exported as source footage.'
 };
}

/** Original plan when no reference is provided. */
export function planOriginalCampaign(plan:CreativePlan,hook?:CreativeHook):CampaignShotPlan{
 const intelligence=buildCreativeIntelligence(plan,hook);
 const fake:ReferenceAnalysis={
  version:1,id:'original',created:Date.now(),sourceUrl:'',originalUrl:'',bytes:0,duration:0,width:0,height:0,fps:24,
  rights:'inspiration-only',creativeMechanism:intelligence.creativeHook,mechanismConfidence:'inferred',
  shots:[{index:0,start:0,end:3,duration:3,purpose:'payoff',composition:'hero',camera:{motion:'push-in',confidence:'inferred'},interaction:'none',keyframeUrls:[]}],
  transitions:[],pacing:{avgShotSec:3,relative:[{index:0,share:1}],note:'Single hero beat'},
  visualStyle:{lighting:'brand-led',graphics:'end-card',ending:'brand payoff',confidence:'inferred'},
  transferablePrinciples:[intelligence.videoConcept],analysisMethod:'creative-intelligence-only',warnings:[]
 };
 return planFromReference(plan,fake,intelligence);
}

export function motionPromptForShot(brief:CampaignShotBrief,product:string){
 return `Short original product commercial shot. ${brief.sceneBrief} Camera: ${brief.cameraMovement} Keep product recognizable and stable. No new logos/text/hands morphing. Constraints: ${brief.motionConstraints.join(' ')} Product: ${clip(product,160)}`;
}
