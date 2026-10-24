import {createElement} from 'react';
import {renderView} from './react/render';
import {ConnectionNotice} from './react/connection';
import './connection.css';
let mounted=false;
export function mountConnection():void{if(mounted)return;mounted=true;const host=document.createElement('div');document.body.append(host);renderView(host,createElement(ConnectionNotice))}
