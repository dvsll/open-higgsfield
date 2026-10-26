export type Capability = { name: string; status: 'ready' | 'prompt' | 'unavailable'; detail: string; control?: 'motion' | 'shotPromptInput' | 'kp' | 'els' | 'timeline' };
export type ModelChoice = {
  id: string; parentId?:string;loraFile?:string;label: string; family: string; description: string;
  capabilities: Capability[];
  generation?:{preferredFps?:number;fpsNote?:string;steps:number;stepNote:string};
  timing: { low: number; high: number; width: number; height: number; duration?: number; basis: string };
};
const common: Capability[] = [
  { name: 'JSON posing', status: 'unavailable', detail: 'No structured pose parser or pose-control workflow connected.' },
  { name: 'Elements', status: 'prompt', control: 'els', detail: 'Names/descriptions enter the prompt; reference identity conditioning is not connected.' },
  { name: 'LoRA stylization', status: 'unavailable', detail: 'Adapter loading is not connected to this app workflow yet. Compatibility requires the correct base model.' },
];
export const imageModel: ModelChoice = {
  id: 'z_image_turbo_bf16.safetensors', label: 'Z-Image Turbo', family: 'Z-Image',
  description: 'Fast local text-to-image keyframes · 8 steps',
  generation:{steps:8,stepNote:'Z-Image Turbo is distilled for few-step sampling. This connected workflow uses an 8-step preset; more steps are not automatically better.'},
  capabilities: [{ name: 'Text to image', status: 'ready', control: 'kp', detail: 'Generate a keyframe from a text prompt.' }, ...common,
    { name: 'Reference image editing', status: 'unavailable', detail: 'Current workflow starts from noise; it does not edit the selected image.' }],
  timing: { low: 7, high: 20, width: 768, height: 448, basis: 'Prior local RTX 4070 Super runs, including cold-load variation. Approximate; excludes queue time.' },
};
export const videoModel: ModelChoice = {
  id: 'ltxv-2b-0.9.8-distilled.safetensors', label: 'LTX-Video 2B · distilled', family: 'LTX-Video 0.9.8',
  description: 'Local development video model · 8 steps · 24 fps',
  generation:{preferredFps:30,fpsNote:'30 FPS is the published LTX-Video default; 24 FPS is our tested local preset. Other FPS values remain editable.',steps:8,stepNote:'This distilled LTX workflow uses an 8-step sampling preset. Step count and scheduler must suit the checkpoint; more steps are not automatically better.'},
  capabilities: [{ name: 'Shot prompt', status: 'ready', control: 'shotPromptInput', detail: 'Describe the scene and visual details. The workflow combines this with your motion instructions in its text conditioning.' },
    { name: 'Keyframe-guided video', status: 'ready', control: 'timeline', detail: 'Up to eight timed image guides; guidance does not guarantee exact reproduction.' },
    { name: 'Motion prompt', status: 'ready', control: 'motion', detail: 'Text describes desired motion; no exact camera trajectory control.' }, ...common],
  timing: { low: 15, high: 35, width: 768, height: 448, duration: 4, basis: 'Prior local RTX 4070 Super runs. Scaled approximately by generated frame count; excludes queue time.' },
};
