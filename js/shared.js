/*
  shared.js — Utilitats compartides entre pantalles.
  Inclou: icones, formats, toast, modal de confirmació, navegació activa i skip-link.
*/

window.SnapEat = window.SnapEat || {};

window.SnapEat.shared = (function () {
  'use strict';

  // ------------------------------
  //  Set d'icones (SVG inline)
  //  Mantingut sincronitzat amb les icones de Lucide usades a l'HTML estàtic.
  // ------------------------------

  const ICONS = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    plus: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    camera: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    edit: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    alertCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    shoppingCart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    clock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  };

  // Retorna el marcatge SVG de la icona amb atribut aria adequat.
  function icon(name, ariaLabel) {
    const svg = ICONS[name];
    if (!svg) return '';
    const aria = ariaLabel ? ' aria-label="' + escapeAttr(ariaLabel) + '" role="img"' : ' aria-hidden="true"';
    return svg.replace('<svg', '<svg' + aria);
  }

  // ------------------------------
  //  Formatadors
  // ------------------------------

  function formatPrice(n) {
    const num = Number(n);
    if (isNaN(num)) return '—';
    try {
      return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(num);
    } catch (err) {
      return num.toFixed(2) + ' €';
    }
  }

  function formatTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function getDayName(date) {
    const days = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
    const d = date instanceof Date ? date : new Date(date);
    return days[d.getDay()];
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/["'&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ------------------------------
  //  Toast
  // ------------------------------

  // Mostra un missatge efímer. type: 'success' | 'info' | 'error'.
  function showToast(message, type) {
    if (!message) return;
    const kind = type || 'info';

    // Reutilitzem un únic contenidor per evitar apilar toasts orfes.
    let host = document.getElementById('snapeat-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'snapeat-toast-host';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      host.style.position = 'fixed';
      host.style.left = '50%';
      host.style.bottom = '80px';
      host.style.transform = 'translateX(-50%)';
      host.style.zIndex = '200';
      host.style.display = 'flex';
      host.style.flexDirection = 'column';
      host.style.gap = '8px';
      host.style.pointerEvents = 'none';
      document.body.appendChild(host);
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast--' + kind;
    toast.textContent = message;
    toast.style.background = kind === 'error' ? '#991B1B' : '#111827';
    toast.style.color = '#fff';
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '12px';
    toast.style.fontSize = '14px';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.05)';
    toast.style.maxWidth = '320px';
    toast.style.pointerEvents = 'auto';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 200ms ease-out, transform 200ms ease-out';
    toast.style.transform = 'translateY(8px)';

    host.appendChild(toast);

    // Forcem un reflow per a la transició d'entrada.
    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, 2800);
  }

  // ------------------------------
  //  Modal de confirmació (Promise-based)
  // ------------------------------

  function confirm(title, message, opts) {
    const options = opts || {};
    const confirmLabel = options.confirmLabel || 'Confirmar';
    const cancelLabel = options.cancelLabel || 'Cancel·lar';
    const danger = !!options.danger;

    return new Promise(function (resolve) {
      const overlay = document.createElement('div');
      overlay.className = 'modal modal--visible';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'confirm-title');

      // Estils inline com a fallback per si la CSS no té classes coincidents.
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'rgba(17, 24, 39, 0.5)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '24px';
      overlay.style.zIndex = '180';

      overlay.innerHTML = '' +
        '<div class="modal__dialog" role="document" style="background:#fff;border-radius:16px;padding:24px;max-width:420px;width:100%;box-shadow:0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.05);">' +
          '<h2 id="confirm-title" class="modal__title" style="margin:0 0 8px;font-size:20px;font-weight:700;">' + escapeHtml(title || 'Confirmar') + '</h2>' +
          (message ? '<p class="modal__body" style="margin:0 0 16px;color:#4B5563;">' + escapeHtml(message) + '</p>' : '') +
          '<div class="modal__actions" style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button type="button" class="btn btn--ghost" data-action="cancel">' + escapeHtml(cancelLabel) + '</button>' +
            '<button type="button" class="btn ' + (danger ? 'btn--danger' : 'btn--primary') + '" data-action="confirm">' + escapeHtml(confirmLabel) + '</button>' +
          '</div>' +
        '</div>';

      const previouslyFocused = document.activeElement;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      const confirmBtn = overlay.querySelector('[data-action="confirm"]');
      const cancelBtn = overlay.querySelector('[data-action="cancel"]');
      const focusable = [cancelBtn, confirmBtn];
      confirmBtn.focus();

      function close(result) {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (previouslyFocused && previouslyFocused.focus) {
          try { previouslyFocused.focus(); } catch (e) { /* ignore */ }
        }
        resolve(result);
      }

      function onKey(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close(false);
        } else if (e.key === 'Tab') {
          // Focus trap simple.
          const idx = focusable.indexOf(document.activeElement);
          if (e.shiftKey) {
            if (idx <= 0) {
              e.preventDefault();
              focusable[focusable.length - 1].focus();
            }
          } else {
            if (idx === focusable.length - 1) {
              e.preventDefault();
              focusable[0].focus();
            }
          }
        } else if (e.key === 'Enter' && document.activeElement === confirmBtn) {
          // Comportament natural — el button activa-el.
        }
      }

      confirmBtn.addEventListener('click', function () { close(true); });
      cancelBtn.addEventListener('click', function () { close(false); });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(false);
      });
      document.addEventListener('keydown', onKey);
    });
  }

  // ------------------------------
  //  Bottom sheet (iOS-style)
  //  Panell que llisca des de baix amb backdrop blur. Substitueix els modals
  //  centrats per donar-li l'aire natiu iOS.
  //  Ús: const close = shared.bottomSheet({ title, bodyHtml, actions, onClose })
  // ------------------------------

  function bottomSheet(config) {
    const cfg = config || {};
    const titleId = 'bs-title-' + Math.floor(Math.random() * 1e6);

    const root = document.createElement('div');
    root.className = 'bottom-sheet';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', titleId);

    const backdrop = document.createElement('div');
    backdrop.className = 'bottom-sheet__backdrop';

    const panel = document.createElement('div');
    panel.className = 'bottom-sheet__panel';

    // Drag handle (decoratiu, però també tap-target per tancar amb gestos futurs)
    const handle = document.createElement('div');
    handle.className = 'bottom-sheet__handle';
    handle.setAttribute('aria-hidden', 'true');

    const header = document.createElement('header');
    header.className = 'bottom-sheet__header';

    const title = document.createElement('h2');
    title.className = 'bottom-sheet__title';
    title.id = titleId;
    title.textContent = cfg.title || '';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'bottom-sheet__close';
    closeBtn.setAttribute('aria-label', 'Tancar');
    closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'bottom-sheet__body';
    if (cfg.bodyHtml) body.innerHTML = cfg.bodyHtml;
    else if (cfg.bodyNode) body.appendChild(cfg.bodyNode);

    panel.appendChild(handle);
    panel.appendChild(header);
    panel.appendChild(body);

    // Accions: footer amb botons. Si no s'especifica, s'amaga.
    let footer = null;
    if (Array.isArray(cfg.actions) && cfg.actions.length) {
      footer = document.createElement('footer');
      footer.className = 'bottom-sheet__footer';
      cfg.actions.forEach(function (a, idx) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn--' + (a.variant || 'primary');
        btn.textContent = a.label || 'OK';
        btn.dataset.actionIndex = String(idx);
        footer.appendChild(btn);
      });
      panel.appendChild(footer);
    }

    root.appendChild(backdrop);
    root.appendChild(panel);

    const previousFocus = document.activeElement;
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';

    // Força reflow abans d'animar entrada.
    /* eslint-disable no-unused-expressions */
    root.getBoundingClientRect().height;
    /* eslint-enable no-unused-expressions */
    root.classList.add('bottom-sheet--visible');

    function close() {
      root.classList.remove('bottom-sheet--visible');
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      // Esperem la transició abans de remoure.
      setTimeout(function () {
        if (root.parentNode) root.parentNode.removeChild(root);
      }, 320);
      if (previousFocus && previousFocus.focus) {
        try { previousFocus.focus(); } catch (e) { /* ignore */ }
      }
      if (typeof cfg.onClose === 'function') cfg.onClose();
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    }

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', onKey);

    // Wire actions: el click invoca onClick amb funció close() disponible.
    if (footer && cfg.actions) {
      cfg.actions.forEach(function (a, idx) {
        const btn = footer.querySelector('[data-action-index="' + idx + '"]');
        if (!btn) return;
        btn.addEventListener('click', function () {
          if (typeof a.onClick === 'function') {
            const result = a.onClick({ close: close, root: root });
            // Si onClick retorna false, no tanca automàticament.
            if (result !== false && a.closeOnClick !== false) close();
          } else if (a.closeOnClick !== false) {
            close();
          }
        });
      });
    }

    // Primer focus al primer botó d'acció o al close.
    setTimeout(function () {
      const firstAction = footer && footer.querySelector('.btn');
      (firstAction || closeBtn).focus();
    }, 100);

    return close;
  }

  // ------------------------------
  //  Tab actiu i skip-link
  // ------------------------------

  function markActiveTab() {
    const path = location.pathname.split('/').pop() || 'index.html';
    const tabs = document.querySelectorAll('.tab-bar .tab');
    tabs.forEach(function (a) {
      const href = (a.getAttribute('href') || '').split('/').pop();
      if (href === path || (path === '' && href === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function wireSkipLink() {
    const link = document.querySelector('.skip-link');
    if (!link) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const main = document.getElementById('main-content');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus();
      }
    });
  }

  // ------------------------------
  //  Fix iOS PWA: evitar que els links interns obrin Safari
  //  Quan l'app s'afegeix a la pantalla d'inici (mode standalone), per defecte
  //  iOS obre els <a href> en una pestanya de Safari en lloc de navegar dins
  //  la PWA. Interceptem i forcem location.href per mantenir el context.
  // ------------------------------

  function handleStandaloneNavigation() {
    const isStandalone = (window.navigator.standalone === true) ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (!isStandalone) return;

    document.addEventListener('click', function (e) {
      const link = e.target.closest && e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Deixem passar: anchors, protocols especials, atributs target forçats.
      if (href.charAt(0) === '#') return;
      if (/^(mailto:|tel:|sms:|javascript:)/i.test(href)) return;
      if (link.target && link.target !== '_self' && link.target !== '') return;
      if (link.hasAttribute('download')) return;

      // Si és absolut, només interceptem si és al mateix origin.
      if (/^https?:\/\//i.test(href)) {
        if (href.indexOf(location.origin) !== 0) return;
      }

      e.preventDefault();
      window.location.href = link.href;
    });
  }

  // ------------------------------
  //  Inicialització
  // ------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    markActiveTab();
    wireSkipLink();
    handleStandaloneNavigation();
  });

  return {
    icon: icon,
    formatPrice: formatPrice,
    formatTime: formatTime,
    getDayName: getDayName,
    uid: uid,
    showToast: showToast,
    confirm: confirm,
    bottomSheet: bottomSheet,
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr
  };
})();
