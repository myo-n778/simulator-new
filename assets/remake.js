(() => {
  const THEME_KEY = 'physics-remake-theme';
  const ZOOM_KEY = 'physics-remake-zoom';
  const ZOOM_VALUES = [75, 100, 125, 150, 200];
  const state = {
    theme: localStorage.getItem(THEME_KEY) || 'light',
    zoom: Number(localStorage.getItem(ZOOM_KEY) || 100),
    pan: false
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function clampZoom(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return 100;
    return Math.min(200, Math.max(75, next));
  }

  function activeCanvasViewports() {
    return Array.from(document.querySelectorAll('.remake-viewport.is-large'));
  }

  function applyTheme() {
    document.body.classList.toggle('remake-dark', state.theme === 'dark');
    document.querySelectorAll('[data-remake-theme]').forEach((button) => {
      const active = button.dataset.remakeTheme === state.theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-theme]').forEach((button) => {
      if (button.dataset.theme === state.theme && !button.classList.contains('is-active')) {
        button.click();
      }
    });
  }

  function setTheme(theme) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, state.theme);
    applyTheme();
  }

  function applyZoomToViewport(viewport, zoom) {
    const inner = viewport.querySelector('.remake-canvas-inner');
    const canvas = inner && inner.querySelector('canvas');
    if (!inner || !canvas) return;

    const baseW = Number(viewport.dataset.baseWidth || canvas.getBoundingClientRect().width || canvas.width || 1);
    const baseH = Number(viewport.dataset.baseHeight || canvas.getBoundingClientRect().height || canvas.height || 1);
    viewport.dataset.baseWidth = String(baseW);
    viewport.dataset.baseHeight = String(baseH);

    const scale = zoom / 100;
    inner.style.width = `${Math.ceil(baseW * scale)}px`;
    inner.style.height = `${Math.ceil(baseH * scale)}px`;
    canvas.style.transform = `scale(${scale})`;
    viewport.dataset.zoom = String(zoom);
  }

  function applyZoom(zoom) {
    state.zoom = clampZoom(zoom);
    localStorage.setItem(ZOOM_KEY, String(state.zoom));
    document.querySelectorAll('[data-remake-zoom-select]').forEach((select) => {
      select.value = String(state.zoom);
    });
    activeCanvasViewports().forEach((viewport) => applyZoomToViewport(viewport, state.zoom));
    syncNativeZoom(state.zoom);
  }

  function syncNativeZoom(zoom) {
    const nativeSelect = document.getElementById('zoomSelect');
    if (!(nativeSelect instanceof HTMLSelectElement)) return;

    const valueMap = {
      75: '90',
      100: 'fit',
      125: '120',
      150: '160',
      200: '220'
    };
    const mapped = valueMap[zoom] || String(zoom);
    if (!Array.from(nativeSelect.options).some((option) => option.value === mapped)) return;
    if (nativeSelect.value === mapped) return;

    nativeSelect.value = mapped;
    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function resetView() {
    applyZoom(100);
    activeCanvasViewports().forEach((viewport) => {
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    });
  }

  function setPan(enabled) {
    state.pan = Boolean(enabled);
    document.querySelectorAll('[data-remake-pan]').forEach((button) => {
      button.dataset.active = String(state.pan);
      button.setAttribute('aria-pressed', String(state.pan));
    });
    activeCanvasViewports().forEach((viewport) => {
      viewport.classList.toggle('is-panning', state.pan);
    });
  }

  function makeButton(text, attrs = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'remake-tool-button';
    button.textContent = text;
    Object.entries(attrs).forEach(([key, value]) => button.setAttribute(key, value));
    return button;
  }

  function makeZoomSelect() {
    const select = document.createElement('select');
    select.className = 'remake-tool-select';
    select.setAttribute('aria-label', 'ズーム');
    select.dataset.remakeZoomSelect = 'true';
    ZOOM_VALUES.forEach((value) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = `${value}%`;
      select.appendChild(option);
    });
    select.value = String(state.zoom);
    select.addEventListener('change', () => applyZoom(select.value));
    return select;
  }

  function showHelp() {
    const modal = document.querySelector('.remake-modal') || createModal();
    modal.classList.add('is-open');
  }

  function createModal() {
    const modal = document.createElement('div');
    modal.className = 'remake-modal';
    modal.innerHTML = `
      <div class="remake-modal-card" role="dialog" aria-modal="true" aria-label="リメイク版の使い方">
        <h2>リメイク版の使い方</h2>
        <p>再生、停止、リセット、モード切替、スライダー操作で物理量の変化を確認できます。</p>
        <p>ズームは大きな図の表示倍率を変えます。パンを有効にすると、拡大した図をドラッグで動かせます。</p>
        <div class="remake-modal-actions"><button type="button" class="remake-tool-button" data-remake-close>閉じる</button></div>
      </div>`;
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('[data-remake-close]')) {
        modal.classList.remove('is-open');
      }
    });
    document.body.appendChild(modal);
    return modal;
  }

  function installGlobalTools() {
    if (document.querySelector('.remake-global-tools')) return;

    const tools = document.createElement('div');
    tools.className = 'remake-global-tools';

    const help = makeButton('使い方');
    help.addEventListener('click', showHelp);

    const worksheet = makeButton('ワークシート');
    worksheet.addEventListener('click', () => window.print());

    const light = makeButton('ライト', { 'data-remake-theme': 'light', 'aria-pressed': 'false' });
    const dark = makeButton('ダーク', { 'data-remake-theme': 'dark', 'aria-pressed': 'false' });
    light.addEventListener('click', () => setTheme('light'));
    dark.addEventListener('click', () => setTheme('dark'));

    const pan = makeButton('パン', { 'data-remake-pan': 'true', 'aria-pressed': 'false' });
    pan.addEventListener('click', () => setPan(!state.pan));

    const reset = makeButton('表示リセット');
    reset.addEventListener('click', resetView);

    tools.append(help, worksheet, light, dark, makeZoomSelect(), pan, reset);

    const shellInner = document.querySelector('.sim-shell-inner');
    const header = document.querySelector('.sim-shell-header');
    if (shellInner) {
      shellInner.appendChild(tools);
    } else if (header) {
      header.appendChild(tools);
    } else {
      document.body.insertBefore(tools, document.body.firstChild);
    }
  }

  function installCanvasToolbar(viewport) {
    const toolbar = document.createElement('div');
    toolbar.className = 'remake-canvas-toolbar';

    const zoomDown = makeButton('-');
    const zoomUp = makeButton('+');
    const select = makeZoomSelect();
    const pan = makeButton('パン', { 'data-remake-pan': 'true', 'aria-pressed': 'false' });
    const reset = makeButton('リセット');

    zoomDown.addEventListener('click', () => applyZoom(state.zoom - 25));
    zoomUp.addEventListener('click', () => applyZoom(state.zoom + 25));
    pan.addEventListener('click', () => setPan(!state.pan));
    reset.addEventListener('click', resetView);

    toolbar.append(zoomDown, zoomUp, select, pan, reset);
    viewport.parentNode.insertBefore(toolbar, viewport);
  }

  function enableViewportDrag(viewport) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    viewport.addEventListener('pointerdown', (event) => {
      if (!state.pan || event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      scrollLeft = viewport.scrollLeft;
      scrollTop = viewport.scrollTop;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      viewport.scrollLeft = scrollLeft - (event.clientX - startX);
      viewport.scrollTop = scrollTop - (event.clientY - startY);
    });

    viewport.addEventListener('pointerup', (event) => {
      dragging = false;
      viewport.classList.remove('is-dragging');
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    });

    viewport.addEventListener('pointercancel', () => {
      dragging = false;
      viewport.classList.remove('is-dragging');
    });
  }

  function wrapCanvas(canvas) {
    if (canvas.closest('.remake-viewport') || canvas.dataset.remakeViewer === 'skip') return;
    if (document.body.classList.contains('remake-spring-dashboard') && canvas.id === 'scene') return;

    const rect = canvas.getBoundingClientRect();
    const large = rect.width >= 220 && rect.height >= 140;
    if (!large) return;
    const viewport = document.createElement('div');
    viewport.className = 'remake-viewport is-large';
    viewport.dataset.baseWidth = String(Math.max(1, Math.round(rect.width)));
    viewport.dataset.baseHeight = String(Math.max(1, Math.round(rect.height)));

    const inner = document.createElement('div');
    inner.className = 'remake-canvas-inner';

    canvas.parentNode.insertBefore(viewport, canvas);
    viewport.appendChild(inner);
    inner.appendChild(canvas);

    installCanvasToolbar(viewport);
    enableViewportDrag(viewport);
    applyZoomToViewport(viewport, state.zoom);
  }

  function installCanvasViewers() {
    const enhance = () => {
      Array.from(document.querySelectorAll('canvas')).forEach(wrapCanvas);
      setPan(state.pan);
      applyZoom(state.zoom);
    };
    requestAnimationFrame(enhance);
    window.setTimeout(enhance, 350);
    window.setTimeout(enhance, 1000);
  }

  function installFooter() {
    if (document.querySelector('.remake-status-footer')) return;
    const footer = document.createElement('div');
    footer.className = 'remake-status-footer';
    footer.innerHTML = '<span><strong>リメイク版</strong> 共通UI・テーマ・ズーム/パン対応</span><span>単位系: SI</span>';
    document.body.appendChild(footer);
  }

  ready(() => {
    document.body.classList.add('remake-ui');
    installGlobalTools();
    installCanvasViewers();
    installFooter();
    applyTheme();
  });
})();
