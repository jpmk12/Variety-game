// Pointer-based drag helper (works for touch and mouse). Makes `sourceEl` both
// tappable and draggable: a short press/release is a tap; moving past a small
// threshold spawns a floating "ghost" item that follows the finger and, on
// release over a pet, reports which pet it landed on.
//
//   makeDraggable(buttonEl, {
//     glyph: '🍖',
//     onTap: () => {...},              // treated as a normal button press
//     onDrop: (petId | null) => {...}, // dropped over .ac-animal[data-id=petId]
//   }) -> cleanup()

const THRESHOLD = 8; // px of movement before a press becomes a drag

export function makeDraggable(sourceEl, { glyph, onTap, onDrop }) {
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let ghost = null;
  let lastTarget = null;

  function petUnder(x, y) {
    const el = document.elementFromPoint(x, y);
    const pet = el && el.closest ? el.closest('.ac-animal') : null;
    return pet || null;
  }

  function highlight(pet) {
    if (lastTarget === pet) return;
    if (lastTarget) lastTarget.classList.remove('is-drop-target');
    if (pet) pet.classList.add('is-drop-target');
    lastTarget = pet;
  }

  function startDrag() {
    dragging = true;
    ghost = document.createElement('span');
    ghost.className = 'ac-drag-ghost';
    ghost.textContent = glyph;
    document.body.appendChild(ghost);
    sourceEl.classList.add('is-dragging');
  }

  function moveGhost(x, y) {
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
  }

  function onMove(e) {
    const x = e.clientX;
    const y = e.clientY;
    if (!dragging) {
      if (Math.abs(x - startX) < THRESHOLD && Math.abs(y - startY) < THRESHOLD) return;
      startDrag();
    }
    e.preventDefault();
    moveGhost(x, y);
    highlight(petUnder(x, y));
  }

  function cleanupDrag() {
    if (ghost) ghost.remove();
    ghost = null;
    highlight(null);
    sourceEl.classList.remove('is-dragging');
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
  }

  function onUp(e) {
    if (dragging) {
      const pet = petUnder(e.clientX, e.clientY);
      onDrop(pet ? pet.dataset.id : null);
    } else {
      onTap();
    }
    dragging = false;
    cleanupDrag();
  }

  function onCancel() {
    dragging = false;
    cleanupDrag();
  }

  function onDown(e) {
    // primary button / single touch only
    if (e.button != null && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    dragging = false;
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }

  sourceEl.addEventListener('pointerdown', onDown);

  return function cleanup() {
    sourceEl.removeEventListener('pointerdown', onDown);
    cleanupDrag();
  };
}
