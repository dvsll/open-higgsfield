import {CloseButton} from './close-button';
import type { Experience, Workflow } from '../onboarding-progress';
export const workflowNames: Record<Workflow, string> = {
  audio:'Audio',
  video: 'Video',
  image: 'Image',
  director: 'Director',
  rendering: 'Rendering',
  edit: 'Edit',
  '3d': '3D',
};
export type TourTip = { title: string; text: string; next?: string; diagram?: 'add' | 'position' | 'audio' | 'audio-position' };
const descriptions: Record<Workflow, string> = {
  audio:'Create sound, speech and an audio sequence.',
  image: 'Workshop one image.',
  video: 'Bring a scene into motion.',
  director: 'Direct with movable keyframes.',
  rendering: 'Inspect size, timing and takes.',
  edit: 'Trim, retime and resize a take.',
  '3d': 'Generate mesh geometry from an image.',
};
function WorkflowIcon({kind}:{kind:'image'|'video'|'3d'|'audio'}) {
 const paths={image:<><rect x="3" y="3" width="18" height="18"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/></>,video:<><rect x="3" y="5" width="13" height="14"/><path d="m16 10 5-3v10l-5-3"/></>,'3d':<><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5"/></>,audio:<><path d="M4 10v4m4-8v12m4-15v18m4-15v12m4-8v4"/></>};
 return <svg className="tour-workflow-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>;
}
export function TourChoice({onChoose,onSkip}:{onChoose:(key:Workflow)=>void;onSkip:()=>void}) {
 const entries:[Workflow|'audio',string,string][]=[
  ['image','Image','Workshop one image, then bring it into motion.'],
  ['video','Video','Prompt a video, then direct it with keyframes.'],
  ['3d','3D','Generate and inspect a 3D mesh.'],
  ['audio','Audio','Create sound, add speech and arrange a mix.'],
 ];
 return <><CloseButton className="tour-close tour-choice-close" label="Skip walkthrough" onClick={onSkip}/><h2>What would you like to create?</h2><p>Choose a starting workspace. Other workflows have their own walkthroughs.</p><div className="tour-choice-grid" data-kind="workflow">{entries.map(([key,label,description])=><button key={key} type="button" onClick={()=>onChoose(key)}><strong className="tour-workflow-heading"><WorkflowIcon kind={key as "image"|"video"|"3d"|"audio"}/>{label}</strong><span>{description}</span></button>)}</div><button className="tour-skip" onClick={onSkip}>Skip walkthrough</button></>;
}
function DragDiagram({ kind }: { kind: 'add' | 'position' | 'audio' | 'audio-position' }) {
  if(kind==='audio-position')return <figure className="tour-audio-order" role="img" aria-label="Place the voice clip after the sound clip"><div className="tour-audio-order-clips"><span>SOUND</span><i aria-hidden="true">→</i><span>VOICE</span></div><figcaption>Sound ends · voice begins</figcaption></figure>;
  return (
    <figure
      className="tour-drag-demo"
      data-kind={kind==='audio'?'add':kind}
      role="img"
      aria-label={
        kind==='audio'?'Drag the audio file from Project files onto the audio timeline':kind === 'add'
          ? 'Drag an image result onto the timeline'
          : 'Drag keyframes to the start and end of the clip'
      }
    >
      <span className="demo-source">{kind==='audio'?'AUDIO':kind === 'add' ? 'IMAGE' : '◆'}</span>
      <div className="demo-track">
        <span>{kind.startsWith('audio')?'0s':'START'}</span>
        <span>{kind==='audio'?'TIMELINE':'END'}</span>
      </div>
      <span className="demo-cursor">◆</span>
    </figure>
  );
}
export function TourPopover({
  experience,
  entry,
  done,
  tip,
  onSkip,
  onNext,
  onWorkflow,
  onFinish,
  onLater,
  onTimelineChoice,
  onBlockoutChoice,
  onAudioChoice,
}: {
  experience: Experience;
  entry: Workflow;
  done: boolean;
  tip?: TourTip;
  onSkip: () => void;
  onNext: () => void;
  onWorkflow: (workflow: Workflow) => void;
  onFinish: () => void;
  onLater?: () => void;
  onAudioChoice?: (choice:"speech"|"stay")=>void;
  onBlockoutChoice?: (choice:"video"|"stay")=>void;
  onTimelineChoice?: (choice: "image" | "scene" | "ignore") => void;
}) {
  return (
    <>
      <div className="tour-popover-top">
        <span>
          {workflowNames[entry]} walkthrough
        </span>
        <CloseButton className="tour-close" label={done?'Close walkthrough':'Skip walkthrough'} onClick={onSkip}/>
      </div>
      {done ? (
        <>
          <h2>Try another workflow</h2>
          <p>
            Your {workflowNames[entry]} walkthrough is complete. Explore another workflow. Choose one below and we’ll guide you to it in the workspace selector.
          </p>
          <div className="tour-workflow-teasers">
            {(['image', 'video', '3d', 'audio'] as Workflow[])
              .filter((next) => next !== entry)
              .map((next) => (
                <button key={next} className="tour-workflow-card" onClick={() => onWorkflow(next)}>
                  <strong>{workflowNames[next]}</strong>
                  <span>{descriptions[next]}</span>
                </button>
              ))}
          </div>

          <button className="tour-secondary" onClick={onFinish}>
            Keep creating
          </button>
        </>
      ) : (
        tip && (
          <>
            <h2>{tip.title}</h2>
            <p>{tip.text}</p>
            {onLater&&<button className="tour-secondary" onClick={onLater}>I’ll try it later</button>}
            {tip.diagram && <DragDiagram kind={tip.diagram} />}{' '}
            {onAudioChoice ? <div className="tour-next-choices"><button onClick={()=>onAudioChoice("speech")}>Add a voice</button><button className="tour-secondary" onClick={()=>onAudioChoice("stay")}>Keep creating audio</button></div> : onBlockoutChoice ? <div className="tour-next-choices"><button onClick={()=>onBlockoutChoice("video")}>Use for video generation</button><button className="tour-secondary" onClick={()=>onBlockoutChoice("stay")}>Ignore · keep working in 3D</button></div> : onTimelineChoice ? <div className="tour-next-choices"><button onClick={()=>onTimelineChoice("image")}>Create start and end images</button><button onClick={()=>onTimelineChoice("scene")}>Learn to join videos</button><button className="tour-secondary" onClick={()=>onTimelineChoice("ignore")}>Keep creating</button></div> : tip.next ? (
              <button className="tour-primary" onClick={onNext}>
                {tip.next}
              </button>
            ) : (
              <p className="tour-wait-hint">
                {tip.diagram
                  ? 'Continue by dragging in the highlighted workspace.'
                  : 'Use the highlighted control to continue.'}
              </p>
            )}
          </>
        )
      )}
    </>
  );
}
