import {NumberInput} from './number-input';
import type {ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {AdvancedPrompt,PromptPolishButton} from './prompt-advanced';
function GenerationPortal({children}:{children:ReactNode}){return typeof document==='undefined'?children:createPortal(children,document.body)}
export function DirectorSurface() {
  return (
    <>
      <header className="studio-header">
        <span className="sp"></span>
        <span
          id="rt"
          className="rt"
          title="Generation: Vite /api (shared/runtime/api.ts) → @comfyorg/sdk → ComfyUI"
        >
          {'○ placeholders'}
        </span>
        <button className="pill" id="genAll">
          {'Generate all shots'}
        </button>
      </header>
      <div className="app">
        <aside className="l" id="shared"></aside>
        <main>
          <div className="workflow-switch">
            <button data-workflow="video">Video</button>
            <button data-workflow="image">Image</button>
            <button id="showVideoAttributes">Video attributes ↗</button>
          </div>
          <div className="title">
            <h2 id="sTitle">
              <span id="sNum"></span>
              <span
                id="sName"
                contentEditable="plaintext-only"
                spellCheck={false}
                title="Click to rename (F2)"
              ></span>
              <span className="pen">{'✎'}</span>
            </h2>
            <span id="sMeta"></span>
            <span className="sp"></span>
          </div>
          <section className="image-stage">
            <div id="imageWelcome">
              <h2>Find the image you have in mind</h2>
              <p>Describe it, generate it, make it yours.</p>
            </div>
            <img id="imageHero" alt="Your generated image" hidden />
            <div id="nextImage" className="next-step" hidden>
              <div>
                <strong>Picture this in motion.</strong>
                <p>Use this image as the first frame of a video.</p>
              </div>
              <button id="animateImage">Turn into a video →</button>
              <button id="editWorkshopImage">Download image</button>
            </div>
          </section>
          <section className="viewer" aria-label="Video viewer">
            <div className="view">
              <canvas id="cv"></canvas><div className="viewer-unbound">No sequence linked</div>
              <video id="vid" muted playsInline preload="auto"></video><div id="overlayPreview" aria-label="Sequence overlays"/>
              <div className="empty" id="empty">
                <div className="msg">
                  <h3 id="emT">{'Bring your scene to life'}</h3>
                  <p id="emP">{'Press Generate to get started.'}</p>
                </div>
              </div>
              <span className="tag" id="tag"></span>
              <span className="tc" id="tc"></span>
              <GenerationPortal><div className="ov" id="ov" role="status" aria-live="polite">
                <div id="ovt"></div>
                <div className="prog">
                  <i id="pb"></i>
                </div>
                <div id="ovDiagnostics" />
              </div></GenerationPortal>
            </div>
            <div className="viewer-tools">
              <button className="play" id="play" title="Play / pause (space)" />
              <button id="previousFrame" title="Previous frame">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 5v14M18 5l-9 7 9 7z" />
                </svg>
                Frame
              </button>
              <button id="nextFrame" title="Next frame">
                Frame
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 5v14M6 5l9 7-9 7z" />
                </svg>
              </button>
              <label>
                Time
                <NumberInput
                  id="viewerTime"
                  aria-label="Viewer time in seconds"
                  type="number"
                  min="0"
                  step="0.001"
                />
              </label>
              <button id="editViewer" className="edit-video">
                Edit video ↗
              </button>
              <button id="captureKeyframe" title="Save the displayed video frame as a keyframe" disabled>
                Make keyframe
              </button>
            </div>
          </section>
          <section className="composer" aria-label="Generation prompts">
            <div className="prompt-scroll">
              <div className="modelbar compact-modelbar">
                <label htmlFor="videoModel">Model</label>
                <select id="videoModel" disabled><option>Connecting…</option></select>
                <span className="model-output-tag">Video</span>
                <div id="videoModelDetails" className="model-card" />
              </div>
              <div className="row primary-prompt-row">
                <div className="prompt-field" data-model-kind="video" data-model-control="shotPromptInput">
                  <label htmlFor="shotPromptInput">Prompt</label>
                  <textarea id="shotPromptInput" rows={2} placeholder="Describe your video, including any movement and sound…" />
                </div>
              </div>
              <AdvancedPrompt>
              <div className="row">
                <div className="prompt-field"><label htmlFor="visualPrompt">Video prompt</label><textarea id="visualPrompt" rows={2} placeholder="Scene details from your prompt…" /></div>
                <div className="prompt-field" data-model-kind="video" data-model-control="motion">
                  <label htmlFor="motion">{'Motion prompt'}</label>
                  <textarea
                    id="motion"
                    rows={2}
                    placeholder="Describe subject and camera movement…"
                  ></textarea>
                </div>
                <div className="audio-prompt-row prompt-field">
                  <label htmlFor="audioPrompt">Audio prompt</label>
                  <textarea id="audioPrompt" rows={2} placeholder="Describe sounds, ambience or music…" />
                </div>
              </div>
              <div className="audio-actions">
                <button id="generateAudio" hidden>
                  Generate audio
                </button>
                <button id="editAudio" hidden>
                  Edit audio ↗
                </button>
                <span id="audioEditHint" />
                <span id="audioStatus" role="status">
                  Powered by Stability AI · local audio
                </span>
              </div>
              <div className="audio-actions" id="audioSelectionControls" hidden>
                <button id="audioLink" disabled>
                  Unlink audio
                </button>
                <label className="audio-position">
                  Start (s)
                  <NumberInput id="audioStart" type="number" min="0" max="600" step="0.01" disabled />
                </label>
                <label>
                  <input type="checkbox" id="audioMute" /> Mute audio
                </label>
              </div>
              <div id="advancedVideoSettings" />
              </AdvancedPrompt>
            </div>
            <div className="generate-action">
              <div className="prompt-footer-buttons">
              <PromptPolishButton />
              <button className="pill solid" id="gen">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"></path>
                  <path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6Z"></path>
                </svg>
                <span>{'Generate video'}</span>
              </button>
              </div>
              <div id="videoGenerationEstimate" aria-live="polite" />
            </div>
          </section>
          <div id="nextVideo" className="next-step" hidden>
            <div>
              <strong>There’s a story here.</strong>
              <p>Add another scene and start building your film.</p>
            </div>
            <button id="growFilm">Create the next scene →</button>
          </div>
          <div className="tlw">
            <div className="tlh">
              <span className="crumb" id="crumb"></span>
              <span id="tot"></span>
              <span className="sp"></span>
              <span
                className="hint"
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: '0' }}
              >
                <span id="hintT"></span>
              </span>
              <button id="trashBtn" className="trashb" title="Deleted shots (restorable)"></button>
              <button id="addKeyBtn" title="Add a keyframe at the playhead (copies the nearest one)">
                {'＋ Keyframe'}
              </button>
              <button id="editKey" title="Open the selected keyframe in Edit Anything">
                {'✎ Edit keyframe'}
              </button>
              <button id="delKey">{'Remove key'}</button>
            </div>
            <div className="tl" id="tl">
              <div className="ruler" id="ruler"></div><button className="track-toggle overlay-toggle" id="overlayTrackToggle" aria-expanded="false" aria-controls="overlayTrack"/><div id="overlayTrack"/>
              <button
                className="track-toggle"
                id="videoTrackToggle"
                aria-expanded="false"
                aria-controls="trk videoTrackAttributes"
                title="Expand video properties"
              />
              <div className="trk" id="trk"></div>
              <div className="track-attributes" id="videoTrackAttributes" hidden></div>
              <button
                className="track-toggle audio-toggle"
                id="audioTrackToggle"
                aria-expanded="false"
                aria-controls="audioTrack"
                title="Expand audio properties"
              />
              <div id="audioTrack" className="audio-track"></div>

              <div className="gph" id="gph" role="img" aria-label="Playhead"></div>
            </div>
            <div className="stash" id="stash"></div>
            <div className="trashpop" id="trashpop"></div>
          </div>
          <div className="hist" id="hist"></div>
        </main>
        <aside className="r">
          <div className="sec">{'Image workshop'}</div>
            <div className="modelbar image-modelbar compact-modelbar">
              <label htmlFor="keyframeModel">Model</label>
            <select id="keyframeModel" disabled>
              <option>{'Connecting…'}</option>
            </select>
              <span className="model-output-tag">Image</span>
            <div id="keyframeModelDetails" className="model-card" aria-live="polite"></div>
          </div>
          <details className="local-models">
            <summary>
              {'Local models · '}
              <span id="modelCount">{'connecting'}</span>
            </summary>
            <button id="refreshModels" type="button">
              {'Refresh models'}
            </button>
            <p id="modelStatus" role="status"></p>
            <div id="modelInventory"></div>
          </details>
          <div className="prompt-field" data-model-kind="keyframe" data-model-control="kp">
            <label htmlFor="kp">{'Image prompt'}</label>
            <textarea
              id="kp"
              rows={3}
              defaultValue="Mia holds Bolt up to the window, first light on his face"
            />
          </div>
          <div className="sec">{'Framing'}</div>
          <div className="chips" id="frm"></div>
          <div hidden style={{ color: 'var(--faint)', fontSize: '12px' }}>
            {'Look: '}
            <span id="lookUse"></span>
            {', from Stylization'}
          </div>
          <div className="keyframe-batch">
            <label htmlFor="keyframeBatch">
              {'Keyframes '}
              <output id="keyframeBatchValue">{'4'}</output>
            </label>
            <input
              id="keyframeBatch"
              type="range"
              min="0"
              max="2"
              step="1"
              defaultValue="2"
              aria-label="Number of keyframes"
              aria-valuetext="4 keyframes"
            />
            <div className="batch-stops" aria-hidden="true">
              <span>{'1'}</span>
              <span>{'2'}</span>
              <span>{'4'}</span>
            </div>
          </div>
          <button className="pill solid" id="kgo" style={{ width: '100%' }}>
            {'Generate 4 keyframes'}
          </button>
          <div id="keyframeGenerationEstimate" className="keyframe-generation-estimate" />
          <div className="sec">
            {'Results '}
            <span>
              {'Select an image to preview it'}
            </span>
          </div>
          <div id="res">
            <div className="empty">{'Generated images show up here.'}</div>
          </div>
        </aside>
      </div>
      <svg id="generateArrow" aria-hidden="true">
        <defs>
          <marker
            id="generateArrowTip"
            viewBox="0 0 20 20"
            refX="16"
            refY="10"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M3 3 L17 10 L3 17"></path>
          </marker>
        </defs>
        <path id="generateArrowCurve" markerEnd="url(#generateArrowTip)"></path>
      </svg>
    </>
  );
}
