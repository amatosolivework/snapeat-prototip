/*
  dashboard.js — Lògica de la pantalla "Avui" (index.html).
  Renderitza el semàfor nutricional agregat, el suggeriment diari i la llista d'àpats.
*/

(function () {
  'use strict';

  const data = window.SnapEat && window.SnapEat.data;
  const shared = window.SnapEat && window.SnapEat.shared;
  if (!data || !shared) return;

  const { escapeHtml, formatTime } = shared;

  // Etiquetes de text segons estat del semàfor.
  // To Coach: mai culpem, sempre proposem un gest concret i fàcil.
  const STATUS_TEXT = {
    hidrats: { ok: 'Hidrats al punt', warn: 'Una mica alts', bad: 'Encara hi caben hidrats' },
    verdures: { ok: 'Verdures OK', warn: 'Afegeix-ne un toc més', bad: 'Un plat verd i ho tens' },
    proteina: { ok: 'Proteïna al punt', warn: 'Una mica baixa', bad: 'Afegeix un ou o iogurt' }
  };

  // Etiqueta curta de la pill d'estat. To Coach: "Millora" és proactiu, no punitiu.
  const STATUS_PILL_LABEL = {
    ok: 'OK',
    warn: 'Atent',
    bad: 'Millora'
  };

  // Icones SVG (Lucide) per a cada categoria. Es renderitzen com a HTML cru dins
  // de cellHtml() — el contingut el controlem nosaltres, no és input d'usuari.
  const CATEGORY_ICON = {
    hidrats:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M2 22 16 8"/>' +
        '<path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/>' +
        '<path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/>' +
        '<path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/>' +
        '<path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/>' +
      '</svg>',
    verdures:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M11 20A7 7 0 0 1 4 13V6h7a7 7 0 0 1 7 7v7z"/>' +
        '<path d="M11 13V6a7 7 0 0 1 7 0"/>' +
      '</svg>',
    proteina:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M12 22c6.23-.05 7.87-5.57 7.5-10-.36-4.34-3.95-9.96-7.5-10-3.55.04-7.14 5.66-7.5 10-.37 4.43 1.27 9.95 7.5 10z"/>' +
      '</svg>'
  };

  // Palette rotatiu per al placeholder d'àpat sense foto (first letter badge).
  const PLACEHOLDER_VARIANTS = ['green', 'warm', 'coral'];

  function renderDashboard() {
    renderTodayDate();
    // Només àpats d'avui — els d'altres dies es conserven però no embruten el dashboard.
    const meals = data.getMealsToday ? data.getMealsToday() : data.getMeals();
    renderSemafor(meals);
    renderSuggestion(meals);
    renderMealsList(meals);
    renderFabState(meals);
  }

  function renderTodayDate() {
    const el = document.getElementById('today-day-name');
    if (!el) return;
    const now = new Date();
    const dayName = shared.getDayName(now);
    let datePart;
    try {
      datePart = now.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' });
    } catch (err) {
      datePart = (now.getDate()) + '/' + (now.getMonth() + 1);
    }
    el.textContent = dayName + ', ' + datePart;
  }

  function renderSemafor(meals) {
    const el = document.getElementById('semafor');
    if (!el) return;
    const agg = data.aggregateIndicadors(meals);
    const cells = [
      { key: 'hidrats', label: 'Hidrats' },
      { key: 'verdures', label: 'Verdures' },
      { key: 'proteina', label: 'Proteïna' }
    ];
    el.innerHTML = cells.map(function (c) { return cellHtml(c, agg[c.key]); }).join('');
  }

  // Sufix breu per a aria-label quan l'estat no és ok.
  // Garanteix que lectors de pantalla rebin sempre un missatge proactiu,
  // fins i tot si el banner Coach estigués amagat per algun motiu futur.
  const ARIA_COACH_SUFFIX = {
    warn: '. Un petit ajust ho arregla.',
    bad: '. Pots millorar-ho.'
  };

  function cellHtml(cell, state) {
    const safeState = (state === 'ok' || state === 'warn' || state === 'bad') ? state : 'bad';
    const statusText = STATUS_TEXT[cell.key][safeState];
    const iconHtml = CATEGORY_ICON[cell.key] || '';
    const pillLabel = STATUS_PILL_LABEL[safeState];
    const ariaLabel = cell.label + ': ' + statusText + (ARIA_COACH_SUFFIX[safeState] || '');
    return '' +
      '<article class="semafor-cell" aria-label="' + shared.escapeAttr(ariaLabel) + '">' +
        '<span class="semafor-cell__ring semafor-cell__ring--' + safeState + '" aria-hidden="true">' + iconHtml + '</span>' +
        '<h3 class="semafor-cell__label">' + escapeHtml(cell.label) + '</h3>' +
        '<p class="semafor-cell__status">' + escapeHtml(statusText) + '</p>' +
        '<span class="semafor-cell__pill semafor-cell__pill--' + safeState + '">' + escapeHtml(pillLabel) + '</span>' +
      '</article>';
  }

  function renderSuggestion(meals) {
    const el = document.getElementById('suggeriment');
    if (!el) return;
    const agg = data.aggregateIndicadors(meals);
    const suggestion = data.getDailySuggestion(agg, meals.length);
    if (!suggestion) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML = '' +
      '<span class="banner__icon" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>' +
          '<path d="M9 18h6"/>' +
          '<path d="M10 22h4"/>' +
        '</svg>' +
      '</span>' +
      '<p class="banner__text">' + escapeHtml(suggestion.text) + '</p>';
  }

  function renderMealsList(meals) {
    const list = document.getElementById('llista-apats');
    if (!list) return;

    if (!meals.length) {
      const tpl = document.getElementById('empty-state-template');
      if (tpl && 'content' in tpl) {
        list.innerHTML = '';
        list.appendChild(tpl.content.cloneNode(true));
      } else if (tpl) {
        list.innerHTML = tpl.innerHTML;
      } else {
        list.innerHTML = '<li class="apat-empty"><p>Encara no has registrat cap àpat avui.</p></li>';
      }
      return;
    }

    // Ordenem per hora (més recent a dalt).
    const sorted = meals.slice().sort(function (a, b) {
      return (b.hora || '').localeCompare(a.hora || '');
    });

    list.innerHTML = sorted.map(apatHtml).join('');
    wireMealActions(list);
  }

  // Retorna HTML per a la zona media (hero): imatge si n'hi ha, placeholder si no.
  function mealMediaHtml(m) {
    if (m.photoDataUrl) {
      return '<img class="apat-card__foto" src="' + shared.escapeAttr(m.photoDataUrl) + '" alt="">';
    }
    const photoUrl = data.getMealPhoto(m.nom || '');
    if (photoUrl) {
      return '<img class="apat-card__foto" src="' + shared.escapeAttr(photoUrl) + '" alt="">';
    }
    // Placeholder amb la inicial en gradient — hash estable per àpat.
    const initial = (m.nom || '?').trim().charAt(0).toUpperCase() || '?';
    const variant = PLACEHOLDER_VARIANTS[((m.id || '').length + initial.charCodeAt(0)) % PLACEHOLDER_VARIANTS.length];
    return '<div class="apat-card__foto-placeholder apat-card__foto-placeholder--' + variant + '" aria-hidden="true">' + escapeHtml(initial) + '</div>';
  }

  function apatHtml(m) {
    const hora = m.hora || formatTime(new Date(m.createdAt || Date.now()));
    const nom = escapeHtml(m.nom || 'Àpat');
    const extras = (m.extras && m.extras.length) ? m.extras.join(' · ') : '';
    const extrasHtml = extras
      ? '<p class="apat-card__extras">' + escapeHtml(extras) + '</p>'
      : '';

    // Macro chips amb inicial visible (H/V/P) + nom + color d'estat.
    const ind = m.indicadors || data.analyzeMeal(m.nom || '');
    const chipDefs = [
      { key: 'hidrats', initial: 'H', label: 'Hidrats', shortLabel: 'Hidrats' },
      { key: 'verdures', initial: 'V', label: 'Verdures', shortLabel: 'Verd.' },
      { key: 'proteina', initial: 'P', label: 'Proteïna', shortLabel: 'Prot.' }
    ];
    const chips = chipDefs.map(function (c) {
      const st = ind[c.key] || 'bad';
      const statusText = STATUS_TEXT[c.key][st];
      return '<span class="chip-macro chip-macro--' + st + '" aria-label="' + shared.escapeAttr(c.label + ': ' + statusText) + '">' +
        '<span class="chip-macro__initial" aria-hidden="true">' + c.initial + '</span>' +
        '<span class="chip-macro__label">' + escapeHtml(c.shortLabel) + '</span>' +
      '</span>';
    }).join('');

    return '' +
      '<li class="apat-card" data-id="' + shared.escapeAttr(m.id) + '">' +
        '<div class="apat-card__media">' +
          mealMediaHtml(m) +
          '<span class="apat-card__hora-overlay">' + escapeHtml(hora) + '</span>' +
        '</div>' +
        '<div class="apat-card__body">' +
          '<h3 class="apat-card__nom">' + nom + '</h3>' +
          extrasHtml +
          '<div class="apat-card__chips">' + chips + '</div>' +
          '<div class="apat-card__actions">' +
            '<button type="button" class="btn btn--ghost" data-action="edit" data-id="' + shared.escapeAttr(m.id) + '" aria-label="Editar àpat ' + shared.escapeAttr(m.nom || '') + '">Editar</button>' +
            '<button type="button" class="btn btn--ghost" data-action="delete" data-id="' + shared.escapeAttr(m.id) + '" aria-label="Eliminar àpat ' + shared.escapeAttr(m.nom || '') + '">Eliminar</button>' +
          '</div>' +
        '</div>' +
      '</li>';
  }

  function wireMealActions(list) {
    list.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.id;
        location.href = 'registrar.html?edit=' + encodeURIComponent(id);
      });
    });

    list.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const ok = await shared.confirm(
          'Eliminar àpat?',
          'Aquesta acció no es pot desfer. Podràs tornar a registrar-lo si vols.',
          { danger: true, confirmLabel: 'Eliminar', cancelLabel: 'No, tornar' }
        );
        if (!ok) return;
        data.removeMeal(btn.dataset.id);
        shared.showToast('Àpat eliminat', 'info');
        renderDashboard();
      });
    });
  }

  // Si l'usuari encara no ha registrat cap àpat, fem pulsar el FAB subtilment.
  function renderFabState(meals) {
    const fab = document.getElementById('fab-registrar');
    if (!fab) return;
    if (!meals.length) {
      fab.classList.add('fab--pulse');
    } else {
      fab.classList.remove('fab--pulse');
    }
  }

  document.addEventListener('DOMContentLoaded', renderDashboard);
})();
