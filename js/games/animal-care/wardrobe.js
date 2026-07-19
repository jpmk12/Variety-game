// Renders a pet's equipped accessories as an overlay inside the pet's box.
// Keeping this separate means the room, the zoomed detail, and every mini-game
// dress the same pet the same way — just call decoratePet(petBox, equipped).

import { accessoryById, accessorySVG } from './accessories.js';

// `equipped` is a { slot: accessoryId } map. Clears any prior overlay first so
// re-calling on the same element (e.g. after a re-render) stays clean.
export function decoratePet(container, equipped) {
  if (!container) return;
  container.querySelectorAll('.ac-acc').forEach((n) => n.remove());
  if (!equipped) return;
  // Size accessories relative to the pet box so they scale on any pet/screen.
  const box = container.getBoundingClientRect().width || container.offsetWidth || 120;
  for (const slot of Object.keys(equipped)) {
    const acc = accessoryById(equipped[slot]);
    if (!acc) continue;
    const span = document.createElement('span');
    span.className = 'ac-acc';
    span.innerHTML = accessorySVG(acc.id);
    span.style.left = acc.x + '%';
    span.style.top = acc.y + '%';
    const sz = box * acc.size;
    span.style.width = sz + 'px';
    span.style.height = sz + 'px';
    container.appendChild(span);
  }
}
