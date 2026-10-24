import {createElement} from 'react';
import {renderView} from './react/render';
import {ElementLibrary} from './react/elements';
import type {Element,PoolItem} from './shell';
import './elements.css';
export function elementLibrary(root:HTMLElement,elements:Element[],select:(element:Element)=>void,pool:()=>PoolItem[]):void{
 renderView(root,createElement(ElementLibrary,{elements,onSelect:select,pool}));
}
