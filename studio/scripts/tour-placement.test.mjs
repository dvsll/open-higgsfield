import assert from 'node:assert/strict';
import {tourPlacement} from '../src/tour-placement.ts';
const header={left:0,top:0,right:1280,bottom:42},button={left:200,top:8,right:270,bottom:36},menu={left:200,top:42,right:410,bottom:500};
const intersects=(p,w,h,r)=>p.x<r.right&&p.x+w>r.left&&p.y<r.bottom&&p.y+h>r.top;
for(const obstacles of [[],[menu]]){const p=tourPlacement(340,200,1280,720,[button],obstacles,header.bottom+12);assert.ok(p.y>=54);assert.ok(!intersects(p,340,200,header));assert.ok(!intersects(p,340,200,button));if(obstacles.length)assert.ok(!intersects(p,340,200,menu));}
const narrow=tourPlacement(296,180,320,480,[button],[],54);assert.ok(narrow.x>=12&&narrow.x+296<=308);assert.ok(narrow.y>=54&&narrow.y+180<=468);
console.log('PASS: walkthrough avoids toolbar, highlighted targets and open menus, and remains within narrow viewports.');
