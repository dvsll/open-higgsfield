import {createElement} from 'react';
import {renderView} from './react/render';
import {VideoEditor,type VideoHandoff} from './react/video-editor';
import {SHELL} from './shell';
import './video-editor.css';
export function mountVideoEditor(hand:VideoHandoff):void{
 const main=document.querySelector<HTMLElement>('main')!,right=document.querySelector<HTMLElement>('aside.r')!,actions=document.getElementById('acts')!;
 document.getElementById('src')!.textContent='/ '+hand.label;right.replaceChildren();actions.replaceChildren();
 renderView(main,createElement(VideoEditor,{hand,right,actions}));
 SHELL.mount({app:'edit',onElement:element=>{const status=document.querySelector<HTMLElement>('[data-status]');if(status)status.textContent=`@${element.n} is available for generation prompts in Director.`}});
}
