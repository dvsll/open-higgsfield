import type { Experience, Workflow } from '../onboarding-progress';
export const workflowNames: Record<Workflow, string> = {
  video: 'Video',
  image: 'Image',
  director: 'Director',
  rendering: 'Rendering',
  edit: 'Edit',
  '3d': '3D',
};
export type TourTip = { title: string; text: string; next?: string; diagram?: 'add' | 'position' };
const descriptions: Record<Workflow, string> = {
  image: 'Workshop one image.',
  video: 'Bring a scene into motion.',
  director: 'Direct with movable keyframes.',
  rendering: 'Inspect size, timing and takes.',
  edit: 'Trim, retime and resize a take.',
  '3d': 'Preview · generation not connected.',
};
export function TourChoice({
  experience,
  onChoose,
  onBack,
  onSkip,
}: {
  experience?: Experience;
  onChoose: (key: string) => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const entries = experience
    ? [
        ['image', 'Image', 'Workshop one image, then bring it into motion.'],
        ['video', 'Video', 'Prompt a video, then direct it with keyframes.'],
        ['3d', '3D', 'Explore the preview; generation is not connected yet.'],
        ['audio', 'Audio · planned', 'A dedicated sound workspace is planned.'],
      ]
    : [
        ['beginner', 'ComfyUI beginner', 'Explain the tools and guide me step by step.'],
        ['seasoned', 'Seasoned', 'Show the Studio workflow with a little guidance.'],
        ['professional', 'Professional', 'Keep it brief. Show the essential controls.'],
      ];
  return (
    <>
      <h2>{experience ? 'What would you like to create?' : 'How familiar are you with ComfyUI?'}</h2>
      <p>
        {experience
          ? 'Choose a starting workspace. Other workflows have their own walkthroughs.'
          : 'Choose once. We’ll use this level across your workflow walkthroughs.'}
      </p>
      {experience && (
        <button className="tour-back" onClick={onBack}>
          ← Experience level
        </button>
      )}
      <div className="tour-choice-grid" data-kind={experience ? 'workflow' : 'experience'}>
        {entries.map(([key, label, description], index) => (
          <button key={key} type="button" disabled={key === 'audio'} onClick={() => onChoose(key)}>
            {!experience && (
              <span className="tour-level-icons" aria-hidden="true">
                {Array.from({ length: index + 1 }, (_, n) => (
                  <svg key={n} viewBox="0 0 16 16">
                    <path d="M4 2 13 8 4 14Z" />
                  </svg>
                ))}
              </span>
            )}
            <strong>{label}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>
      <button className="tour-skip" onClick={onSkip}>
        Skip walkthrough
      </button>
    </>
  );
}
function DragDiagram({ kind }: { kind: 'add' | 'position' }) {
  return (
    <figure
      className="tour-drag-demo"
      data-kind={kind}
      role="img"
      aria-label={
        kind === 'add'
          ? 'Drag an image result onto the timeline'
          : 'Drag keyframes to the start and end of the clip'
      }
    >
      <span className="demo-source">{kind === 'add' ? 'IMAGE' : '◆'}</span>
      <div className="demo-track">
        <span>START</span>
        <span>END</span>
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
}: {
  experience: Experience;
  entry: Workflow;
  done: boolean;
  tip?: TourTip;
  onSkip: () => void;
  onNext: () => void;
  onWorkflow: (workflow: Workflow) => void;
  onFinish: () => void;
}) {
  return (
    <>
      <div className="tour-popover-top">
        <span>
          {experience} · {workflowNames[entry]} walkthrough
        </span>
        <button onClick={onSkip}>{done ? 'Close' : 'Skip'}</button>
      </div>
      {done ? (
        <>
          <h2>More ways to create</h2>
          <p>
            Your {workflowNames[entry]} walkthrough is complete. Explore another workflow with the same{' '}
            {experience} guidance.
          </p>
          <div className="tour-workflow-teasers">
            {(['image', 'video', 'director', 'edit', 'rendering', '3d'] as Workflow[])
              .filter((next) => next !== entry)
              .map((next) => (
                <button key={next} className="tour-workflow-card" onClick={() => onWorkflow(next)}>
                  <strong>{workflowNames[next]}</strong>
                  <span>{descriptions[next]}</span>
                </button>
              ))}
          </div>
          <p className="tour-planned">Coming later: a dedicated Audio workflow.</p>
          <button className="tour-secondary" onClick={onFinish}>
            Keep creating
          </button>
        </>
      ) : (
        tip && (
          <>
            <h2>{tip.title}</h2>
            <p>{tip.text}</p>
            {tip.diagram && <DragDiagram kind={tip.diagram} />}{' '}
            {tip.next ? (
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
