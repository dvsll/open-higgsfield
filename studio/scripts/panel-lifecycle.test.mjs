import assert from 'node:assert/strict';
import { parkPanel } from '../src/panel-lifecycle.ts';
class Host {
  children = [];
  parentElement = null;
  append(element) {
    if (element.parentElement) {
      const children = element.parentElement.children;
      children.splice(children.indexOf(element), 1);
    }
    this.children.push(element);
    element.parentElement = this;
  }
}
const parking = new Host(),
  first = new Host(),
  second = new Host(),
  panel = new Host();
first.append(panel);
parkPanel(panel, first, parking);
assert.equal(panel.parentElement, parking, 'unmounted panels remain in parking rather than disappearing');
second.append(panel);
parkPanel(panel, first, parking);
assert.equal(
  panel.parentElement,
  second,
  'cleanup from a previous slot cannot detach an already redocked panel',
);
parking.append(panel);
parkPanel(panel, second, parking);
assert.equal(panel.parentElement, parking, 'layout pre-parking and React cleanup are idempotent');
first.append(panel);
parkPanel(panel, first, parking);
assert.equal(parking.children.filter((item) => item === panel).length, 1);
console.log(
  'PASS: closed panels remain mounted, stale slot cleanup cannot detach redocked panels, and parking is idempotent.',
);
