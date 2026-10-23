export const screens=[['create','Direct a scene'],['image','Image & camera'],['timeline','Sequence & takes'],['elements','Cast & Elements'],['project','Projects & team'],['edit','Edit & sound'],['assistant','AI directing'],['models','Models & setups'],['states','Jobs & recovery']];
export const sources:Record<string,string>={H1:'https://higgsfield.ai/blog/how-we-built-cinema-studio',H2:'https://higgsfield.ai/blog/cinema-studio-guide',H3:'https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio',H4:'https://higgsfield.ai/cinematic-video-generator',H5:'https://open.higgsfield.ai/models/higgsfield/cinema-studio/4.0/playground',H6:'https://higgsfield.ai/generate',APP:'director.html'};
const rows=`create|Direct video|Begin with a scene prompt; visual references stay optional.|P0|H1
create|Start & end guides|Choose explicit opening and closing frames in compatible modes.|P0|H2
create|Genre|Curated creative direction, not an unsupported deterministic promise.|P2|H4
create|Tempo & montage|Explore calm, dynamic, chaotic and continuous-shot direction.|P2|H4
create|Camera movement|Visual motion choices and ordered motion tags, with examples.|P2|H4
create|Reference picker|Attach uploads, Elements, past takes or favorites from one surface.|P1|H4
create|Scene sound|Describe sound alongside the visual prompt. Local audio is a separate render.|P0|H3
image|Hero frame|Workshop a still, choose a keeper, then deliberately turn it into video.|P0|H2
image|Image variations|Compare 2×2, 3×3 or 4×4 exploration grids.|P1|H2
image|Camera profile|Curated equipment character with a clear selection and examples.|P2|H1
image|Lens character|Explain the visual effect before offering a large catalog.|P2|H1
image|Focal length|Explore composition and perspective, with visible units.|P2|H2
image|Aperture|Depth-of-field direction; our model does not simulate physical optics.|P2|H2
image|3D scene exploration|Spatial composition concept requiring scene reconstruction.|P2|H2
image|Look & color|Separate reusable visual direction from color processing.|P1|H4
timeline|Docked sequence|Shared ruler and adjacent video/audio remain below the viewer.|P0|APP
timeline|Shot selection|Click selects; empty space seeks; explicit open reveals keyframes.|P0|APP
timeline|Auto multi-shot|Explore model-assisted scene assembly as a separate mode.|P2|H2
timeline|Manual multi-shot|Direct individual shot timing and movement, preserving prior takes.|P2|H2
timeline|Speed ramps|Changing speed over time requires actual connected processing.|P2|H2
timeline|Takes & provenance|Group results by scene with prompt, model, references and settings.|P1|APP
elements|Reusable Elements|Save cast, places and props; distinguish text from conditioning.|P1|H3
elements|Mention completion|Search assets with @ and recognize valid resolved mentions.|P1|H3
elements|AI cast|Actor creation: archetype, era, appearance and identifying details.|P2|H4
elements|Wardrobe|Keep outfit references with the selected cast identity.|P2|H4
elements|Emotions & dialogue|Character emotion and explicit spoken lines.|P2|H2
elements|Locations & props|Build scenes from reusable place and object references.|P1|H4
elements|Character motions|Reusable character actions; not connected locally.|P2|H1
project|Projects|Return to independent productions without losing the draft.|P0|H6
project|Search & favorites|Find projects and assets through named navigation.|P2|H6
project|Production brief|Store tone, references and constraints with a project.|P2|H4
project|Folders|Organize scenes, versions and deliverables when needed.|P2|H4
project|Shared Elements|Team reuse of cast, locations and props.|P2|H4
project|Co-directing & comments|Explicit participants, activity and shared context.|P2|H4
project|Canvas boards|A planning surface for references and rough story structure.|P2|H4
edit|Trim & transport|Frame stepping, In/Out and deliberate trim in the viewer.|P0|APP
edit|Color grade|Temperature, contrast, saturation, sharpness, grain, highlights, exposure.|P2|H3
edit|Audio replacement|Explicit soundtrack replacement with prior version and Apply.|P0|APP
edit|Audio linking|Sound follows video unless deliberately unlinked.|P0|APP
edit|Resize & export|Current dimensions, next-render settings and resizing are distinct.|P0|APP
assistant|AI director|Prompt and scene assistance; generation remains explicit.|P2|H3
assistant|Prompt enhancement|Review suggested changes before replacing creative intent.|P2|H1
assistant|Script to shots|Turn a brief into editable scene drafts.|P2|H4
models|Per-shot model choice|Show local readiness, supported inputs and representative estimates.|P1|H4
models|Saved setups|Save creative settings independently of a generated result.|P1|H2
models|Version selection|Historical versions have different controls and limits.|P2|H3
models|Era|Decade-based visual direction, labeled as a preset concept.|P2|H4
states|Generation states|Draft, queued, working, video-ready/audio-pending, ready, failed.|P0|APP
states|Connection recovery|Retain the draft; reconcile status before retrying jobs.|P0|APP
states|Capability limits|Explain incompatible inputs; never invent guaranteed consistency.|P0|APP
states|Output limits|Marketing and API limits disagree; use actual backend limits.|P0|H5`;
export const features=rows.split('\n').map((row,index)=>{const [screen,title,description,priority,source]=row.split('|');return {id:'feature-'+index,screen,title,description,priority,source,observed:source==='APP'?'Local adaptation':source==='H6'?'Public shell observed':'Documented; behavior not tested'}});
