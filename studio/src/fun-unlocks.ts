const key='osh-fun-empty-prompts';
export function emptyPromptsUnlocked(){try{return localStorage.getItem(key)==='true'}catch{return false}}
export function setEmptyPromptsUnlocked(enabled:boolean){localStorage.setItem(key,String(enabled))}
export function requireGenerationPrompt(prompt:string|undefined){if(!prompt?.trim()&&!emptyPromptsUnlocked())throw new Error('Write a prompt first. Empty prompts can be enabled in Admin > Advanced > Fun unlocks.')}
