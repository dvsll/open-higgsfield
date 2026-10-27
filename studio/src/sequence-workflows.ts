export function openSequenceWorkflow(kind:'video'|'audio'|'overlays'){
 const name={video:'Video',audio:'Audio',overlays:'Overlays'}[kind];
 document.dispatchEvent(new CustomEvent('osh-workspace-select',{detail:name}));
 dispatchEvent(new CustomEvent('osh-reveal-window',{detail:kind==='video'?'prompts':kind==='audio'?'audio-create':'captions'}));
 requestAnimationFrame(()=>document.querySelector<HTMLElement>(kind==='video'?'#shotPromptInput':kind==='audio'?'#studioAudioCreator textarea':'#studioCaptions button')?.focus({preventScroll:true}));
}
