/* Bounded noninteractive editor marks. No scene pixels, clock or reveal authority. */
(function (root) {
  'use strict';
  function mount(overlay) {
    const document = overlay.ownerDocument || root.document;
    const MAX_NODES = 230;
    function clear() {
      overlay.hidden = true;
      overlay.replaceChildren();
      delete overlay.dataset.paintedX;
      delete overlay.dataset.paintedY;
    }
    function render(layout, origin) {
      clear();
      if (!layout || !origin || ![origin.left, origin.top, origin.width, origin.height].every(Number.isFinite) || origin.width <= 0 || origin.height <= 0) throw new Error('Editor guide bounds are unavailable.');
      const rect = layout.contentRect;
      if (!rect || ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.x < -1e-7 || rect.y < -1e-7 || rect.width <= 0 || rect.height <= 0 || rect.x + rect.width > origin.width + 1e-7 || rect.y + rect.height > origin.height + 1e-7) throw new Error('Editor content bounds are unavailable.');
      const lines = [];
      for (const kind of ['grid', 'center']) for (const axis of ['x', 'y']) {
        const values = layout[kind] && layout[kind][axis], extent = axis === 'x' ? rect.width : rect.height;
        if (!Array.isArray(values) || values.length > 99) throw new Error('Editor guide line count is invalid.');
        for (const position of values) {
          if (!Number.isFinite(position) || position <= 0 || position >= extent) throw new Error('Editor guide position is invalid.');
          lines.push({kind, axis, position});
        }
      }
      if (lines.length + 2 > MAX_NODES || !layout.effectiveInterval || ![layout.effectiveInterval.x, layout.effectiveInterval.y].every(value => Number.isFinite(value) && value > 0)) throw new Error('Editor guide layout is invalid.');
      const content = document.createElement('div'); content.id = 'editor-aids-content';
      for (const [property, value] of Object.entries({left: rect.x, top: rect.y, width: rect.width, height: rect.height})) content.style[property] = value + 'px';
      for (const {kind, axis, position} of lines) {
        const line = document.createElement('span'); line.className = 'editor-aid-line ' + kind + '-' + axis;
        line.dataset.kind = kind; line.dataset.axis = axis;
        line.style[axis === 'x' ? 'left' : 'top'] = position + 'px'; content.appendChild(line);
      }
      for (const [property, value] of Object.entries(origin)) overlay.style[property] = value + 'px';
      overlay.dataset.paintedX = String(layout.effectiveInterval.x); overlay.dataset.paintedY = String(layout.effectiveInterval.y);
      overlay.replaceChildren(content); overlay.hidden = false;
    }
    clear(); return Object.freeze({render, clear});
  }
  root.ImageryEditorAidsUI = Object.freeze({mount});
}(typeof globalThis !== 'undefined' ? globalThis : this));
