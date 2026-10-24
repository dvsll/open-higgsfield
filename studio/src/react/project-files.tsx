import { useState } from 'react';
import type { ProjectFile } from '../project-files-index';
export function ProjectFilesView({
  files,
  onSelect,
  onOpen,
}: {
  files: ProjectFile[];
  onSelect: (file: ProjectFile) => void;
  onOpen: (file: ProjectFile) => void;
}) {
  const [selected, setSelected] = useState('');
  if (!files.length)
    return <p className="files-empty">Your images, videos and audio appear here as you create them.</p>;
  return (
    <>
      {(
        [
          ['video', 'Videos'],
          ['image', 'Images'],
          ['audio', 'Audio'],
        ] as const
      ).map(([kind, title]) => {
        const items = files.filter((f) => f.kind === kind);
        return (
          items.length > 0 && (
            <details key={kind} data-kind={kind} open>
              <summary>
                {title} · {items.length}
              </summary>
              {items.map((file) => (
                <div key={file.url} className="project-file">
                  <button
                    title={file.url.split('/').pop()}
                    aria-pressed={selected === file.url}
                    onClick={() => {
                      setSelected(file.url);
                      onSelect(file);
                    }}
                    onDoubleClick={() => onOpen(file)}
                  >
                    {file.label}
                  </button>
                  <a
                    href={file.url}
                    download={file.url.split('/').pop()}
                    title={'Download ' + file.label}
                    aria-label={'Download ' + file.label}
                  >
                    ↓
                  </a>
                </div>
              ))}
            </details>
          )
        );
      })}
    </>
  );
}
