/** Closed dock panels must remain in the document: media/controller services retain their IDs. */
export function parkPanel(element: HTMLElement, slot: HTMLElement, parking: HTMLElement): void {
  if (element.parentElement === slot) parking.append(element);
}
