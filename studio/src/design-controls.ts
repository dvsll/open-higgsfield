// Original concept controls, not a claim of exact Higgsfield enum values.
const choices:Record<string,string[]>={
 'Genre':['General','Action','Drama','Comedy','Horror','Epic'],
 'Tempo & montage':['Single shot','Calm','Dynamic','Chaotic'],
 'Camera movement':['Static','Push in','Pan left','Orbit','Handheld'],
 'Camera profile':['Digital cinema','Large format','Film character'],
 'Lens character':['Neutral','Warm portrait','Anamorphic character'],
 'Image variations':['2 × 2','3 × 3','4 × 4'],
 'Auto multi-shot':['Auto scene assembly','Review shot plan first'],
 'Manual multi-shot':['Shot 1 · wide','Shot 2 · close','Shot 3 · insert'],
 'Speed ramps':['Linear','Slow motion','Ramp up','Impact'],
 'AI cast':['Create actor','Use saved actor'],
 'Wardrobe':['Work clothes','Formal','Custom reference'],
 'Emotions & dialogue':['Calm','Curious','Tense','Joyful'],
 'Character motions':['Reach','Walk','Turn','Custom action'],
 'Per-shot model choice':['LTX · local video','Z-Image · still image','Other compatible model'],
 'Version selection':['Current concept','Historical image-first flow','Video-first flow'],
 'Saved setups':['Morning greenhouse','Neutral studio','Save current setup'],
 'Generation states':['Draft','Queued','Creating','Sound pending','Ready','Failed'],
 'Connection recovery':['Connected','Interrupted','Rechecking status','Restored'],
 'Capability limits':['Supported','Prompt guidance only','Needs another model'],
 'Output limits':['Use backend limits','Review unsupported size'],
 'Audio linking':['Linked to video','Unlinked audio'],
};
const numeric:Record<string,[string,number,number,number][]>= {
 'Focal length':[['Focal length · mm',35,8,100]],'Aperture':[['Aperture · f/',4,1,22]],
 'Era':[['Year',1990,1960,2026]],'Trim & transport':[['In · s',0,0,30],['Out · s',4,0,30]],
 'Resize & export':[['Width · px',768,256,4096],['Height · px',448,256,2160]],
 'Docked sequence':[['Dock height · px',240,150,500]],
 '3D scene exploration':[['Pan X',0,-100,100],['Pan Y',0,-100,100],['Perspective',35,8,100]],
 'Color grade':[['Temperature',0,-100,100],['Contrast',0,-100,100],['Saturation',0,-100,100],['Film grain',0,0,100]],
};
const assets=new Set(['Start & end guides','Reference picker','Reusable Elements','Mention completion','Locations & props','Shared Elements','Hero frame']);
export function conceptControls(title:string,screen:string,onChange:(value:string)=>void):HTMLElement{
 const root=document.createElement('fieldset');root.className='concept-controls';const legend=document.createElement('legend');legend.textContent='Concept controls';root.append(legend);
 if(choices[title]){const label=document.createElement('label');label.textContent=title;const select=document.createElement('select');for(const value of choices[title])select.add(new Option(value,value));select.onchange=()=>onChange(select.value);label.append(select);root.append(label)}
 else if(numeric[title])for(const [name,value,min,max]of numeric[title]){const label=document.createElement('label');label.textContent=name;const input=document.createElement('input');input.type='number';input.value=String(value);input.min=String(min);input.max=String(max);input.step=title==='Aperture'?'.1':'1';input.oninput=()=>onChange(name+': '+input.value);label.append(input);root.append(label)}
 else if(assets.has(title)){const grid=document.createElement('div');grid.className='asset-picker';for(const name of ['Robot','Greenhouse','Watering can']){const button=document.createElement('button');button.type='button';button.textContent=name;button.setAttribute('aria-pressed','false');button.onclick=()=>{const selected=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(selected));onChange((selected?'Attached ':'Removed ')+name)};grid.append(button)}root.append(grid)}
 else{const label=document.createElement('label');label.textContent=screen==='assistant'?'Story / request':screen==='project'?'Project direction':title;const input=document.createElement('textarea');input.rows=3;input.placeholder=screen==='assistant'?'Break a greenhouse story into three editable shots…':screen==='project'?'Warm morning, gentle pacing, keep the robot consistent…':title==='Scene sound'||title==='Audio replacement'?'Soft water droplets and greenhouse ambience…':'Describe your creative direction…';input.oninput=()=>onChange(input.value);label.append(input);root.append(label)}
 const help=document.createElement('small');help.textContent='Mock draft only · choices are illustrative.';root.append(help);return root;
}
