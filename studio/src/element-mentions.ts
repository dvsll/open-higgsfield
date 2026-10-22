import { mentionAt, matchingElements, type MentionElement } from './mention-matching';

export function attachElementMentions(input: HTMLTextAreaElement, elements: MentionElement[], enabled: () => boolean): void {
  const menu = document.createElement('div'); menu.className = 'element-mentions'; menu.id = `${input.id}-mentions`;
  menu.setAttribute('role', 'listbox'); menu.setAttribute('aria-label', 'Elements'); menu.hidden = true; document.body.append(menu);
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-controls', menu.id); input.setAttribute('aria-expanded', 'false');
  let matches: MentionElement[] = [], active = 0, trigger: ReturnType<typeof mentionAt> = null, inserting = false;
  const hide = () => { menu.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
  const highlight = () => {
    menu.querySelectorAll<HTMLElement>('[role=option]').forEach((row,i) => { row.classList.toggle('active', i === active); row.setAttribute('aria-selected', String(i === active)); });
    input.setAttribute('aria-activedescendant', `${menu.id}-${active}`);
    menu.querySelector<HTMLElement>('.active')?.scrollIntoView({ block: 'nearest' });
  };
  const choose = (index: number) => {
    if (!trigger || !matches[index]) return;
    inserting = true;
    input.setRangeText(`@${matches[index].n} `, trigger.start, trigger.end, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true })); inserting = false; hide(); input.focus();
  };
  const position = () => {
    const r = input.getBoundingClientRect(); menu.style.width = `${Math.min(310, Math.max(230, r.width))}px`;
    menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${r.bottom + menu.offsetHeight + 6 < innerHeight ? r.bottom + 5 : Math.max(8, r.top - menu.offsetHeight - 5)}px`;
  };
  const update = () => {
    if (inserting) return;
    if (!enabled() || document.activeElement !== input || input.selectionStart !== input.selectionEnd) return hide();
    trigger = mentionAt(input.value, input.selectionStart);
    if (!trigger || (trigger.query.endsWith(' ') && elements.some(e => e.n.toLowerCase() === trigger!.query.trim().toLowerCase()))) return hide();
    matches = matchingElements(elements, trigger.query); active = 0;
    menu.replaceChildren();
    const heading = document.createElement('div'); heading.className = 'mentions-heading'; heading.textContent = 'Elements · prompt references'; menu.append(heading);
    if (!matches.length) {
      const empty = document.createElement('div'); empty.className = 'mentions-empty'; empty.textContent = 'No matching elements'; menu.append(empty);
      input.removeAttribute('aria-activedescendant');
    }
    matches.forEach((element,i) => {
      const row = document.createElement('button'); row.type = 'button'; row.id = `${menu.id}-${i}`; row.setAttribute('role', 'option');
      const icon = document.createElement('span'); icon.className = 'mention-icon'; icon.textContent = element.ic;
      const text = document.createElement('span'); const name = document.createElement('strong'); name.textContent = element.n;
      const detail = document.createElement('small'); detail.textContent = `${element.kind === 'cast' ? 'Character' : 'Place'} · ${element.d}`; text.append(name, detail); row.append(icon, text);
      row.onpointerdown = e => e.preventDefault(); row.onclick = () => choose(i); row.onmouseenter = () => { active = i; highlight(); }; menu.append(row);
    });
    menu.hidden = false; input.setAttribute('aria-expanded', 'true'); position(); if (matches.length) highlight();
  };
  input.addEventListener('input', update); input.addEventListener('focus', update); input.addEventListener('click', update); input.addEventListener('blur', hide);
  input.addEventListener('keyup', e => { if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) update(); });
  input.addEventListener('keydown', e => {
    if (menu.hidden || e.isComposing) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(); }
    else if (matches.length && ['ArrowDown','ArrowUp','Enter','Tab'].includes(e.key)) {
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Enter' || e.key === 'Tab') choose(active);
      else { active = (active + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length; highlight(); }
    }
  }, true);
  addEventListener('resize', hide); addEventListener('scroll', e => { if (!menu.contains(e.target as Node)) hide(); }, true);
}
