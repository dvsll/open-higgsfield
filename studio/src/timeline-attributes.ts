import {createElement} from 'react';
import {renderView} from './react/render';
import {TrackAttributes} from './react/track-attributes';
import './timeline-attributes.css';
export type Shot={n:string;d:number;fps?:number;renderFrames?:number;renderWidth?:number;renderHeight?:number;seed?:number;video?:string;audio?:string;audioPrompt?:string;audioStart?:number;audioLinked?:boolean;audioDuration?:number};
export type AttributeOptions={selected:number;shots:Shot[];pixels:number;offset:number;start:number;size:{width:number;height:number};select:(index:number,audio:boolean)=>void;change:()=>void;generate:()=>void;settings:()=>void;audio:()=>void;unlink?:()=>void};
export function drawTimelineAttributes(options:AttributeOptions):void{
 for(const kind of ['video'] as const)renderView(document.getElementById(kind+'TrackAttributes')!,createElement(TrackAttributes,{options,kind}));
}
