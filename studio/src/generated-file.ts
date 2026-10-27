/** Reveal a finished asset without changing the user's current media selection. */
export function revealGeneratedFile(url:string){
 dispatchEvent(new Event('osh-project-media'));
 dispatchEvent(new CustomEvent('osh-reveal-window',{detail:'files'}));
 dispatchEvent(new CustomEvent('osh-generated-file',{detail:url}));
}
