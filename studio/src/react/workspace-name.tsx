import { useEffect, useRef } from 'react';
export function WorkspaceName({
  label,
  value,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.select(), []);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const name = input.current!.value.trim();
        if (name) onSave(name);
      }}
    >
      <h2>{label}</h2>
      <input ref={input} defaultValue={value} required maxLength={80} aria-label={label} />
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit">Save</button>
    </form>
  );
}
