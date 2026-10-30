import {CloseButton} from './close-button';
export function RuntimeSetupSurface() {
  return (
    <>
      <header>
        <div>
          <h2>{'Set up local generation'}</h2>
          <p>{'Use your ComfyUI, or let Studio set up a separate local instance.'}</p>
        </div>
        <CloseButton data-close label="Close local generation setup"/>
      </header>
      <div className="setup-options">
        <button data-mode="existing" aria-pressed="true">
          {'Use existing ComfyUI'}
        </button>
        <button data-mode="managed" aria-pressed="false">
          {'Set up a local instance'}
        </button>
      </div>
      <section data-existing>
        <form data-connect>
          <label>
            {'ComfyUI address'}
            <input name="url" type="url" required defaultValue="http://127.0.0.1:8188" />
          </label>
          <label>
            {'Models folder '}
            <small>{'optional · needed only to download missing models'}</small>
            <input name="models" placeholder="C:\\ComfyUI\\models" list="setup-model-folders" />
          </label>
          <datalist id="setup-model-folders"></datalist>
          <div data-discovered></div>
          <p>
            {
              'Start your Desktop, portable or manual ComfyUI first. Existing models are reused. If needed, Studio installs its small Python connector separately.'
            }
          </p>
          <button type="submit">{'Connect ComfyUI'}</button>
        </form>
      </section>
      <section data-managed hidden>
        <p>
          {'Installs ComfyUI and its Python dependencies into '}
          <code data-managed-path></code>
          {'. Your existing ComfyUI is left alone. Models are chosen separately below.'}
        </p>
        <label>
          {'Hardware'}
          <select data-gpu>
            <option value="nvidia">{'NVIDIA · 20-series or newer'}</option>
            <option value="apple">{'Apple Silicon'}</option>
            <option value="cpu">{'CPU · much slower'}</option>
          </select>
        </label>
        <p>
          {'Requires '}
          <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">
            {'Python 3.12 or 3.13'}
          </a>
          {' and '}
          <a href="https://git-scm.com/downloads" target="_blank" rel="noreferrer">
            {'Git'}
          </a>
          {'. Older NVIDIA, AMD and Intel users can install '}
          <a href="https://www.comfy.org/download" target="_blank" rel="noreferrer">
            {'ComfyUI Desktop'}
          </a>
          {', then connect it here.'}
        </p>
        <p>
          <a href="https://github.com/Comfy-Org/ComfyUI" target="_blank" rel="noreferrer">
            {'ComfyUI · GPL-3.0'}
          </a>
          {
            ' · GPU libraries come from official PyTorch packages. This can take several minutes and multiple GB.'
          }
        </p>
        <button data-install>{'Download & install ComfyUI'}</button>
        <button data-start hidden>
          {'Start local runtime'}
        </button>
      </section>
      <section className="setup-task" role="status" aria-live="polite">
        <strong data-task-title>{'Checking local runtime…'}</strong>
        <p data-task-message></p>
        <progress hidden></progress>
        <small data-task-bytes></small>
        <details data-logs hidden>
          <summary>{'Setup details'}</summary>
          <pre></pre>
        </details>
        <button data-cancel hidden>
          {'Stop setup'}
        </button>
      </section>
      <section className="setup-models">
        <h3>{'Choose model packs'}</h3>
        <p>
          {
            'Model downloads can use tens of GB of internet data. Check the total below before starting, especially on a metered connection. Only missing files are fetched; interrupted downloads can resume.'
          }
        </p>
        <div data-packs></div>
        <p data-download-size></p>
        <button data-download disabled>
          {'Download selected missing models'}
        </button>
        <p data-ready></p>
      </section>
      <p data-error role="alert"></p>
    </>
  );
}
