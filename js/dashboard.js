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
  const STATUS_TEXT = {
    hidrats: { ok: 'Hidrats al punt', warn: 'Una mica alts', bad: 'Et falten hidrats' },
    verdures: { ok: 'Verdures OK', warn: 'Poc a poc', bad: 'Falten verdures' },
    proteina: { ok: 'Proteïna al punt', warn: 'Una mica baixa', bad: 'Falta proteïna' }
  };

  // Icones (emoji) per a cada categoria del semàfor — reforç visual a l'anti-daltonisme.
  const CATEGORY_ICON = {
    hidrats: '🌾',
    verdures: '🥗',
    proteina: '🥚'
  };

  // Palette rotatiu per al placeholder d'àpat sense foto (first letter badge).
  const PLACEHOLDER_VARIANTS = ['green', 'warm', 'coral'];

  function renderDashboard() {
    renderTodayDate();
    const meals = data.getMeals();
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

  function cellHtml(cell, state) {
    const safeState = (state === 'ok' || state === 'warn' || state === 'bad') ? state : 'bad';
    const statusText = STATUS_TEXT[cell.key][safeState];
    const icon = CATEGORY_ICON[cell.key] || '•';
    return '' +
      '<article class="semafor-cell semafor-cell--' + safeState + '" aria-label="' + shared.escapeAttr(cell.label + ': ' + statusText) + '">' +
        '<span class="semafor-cell__icon" aria-hidden="true">' + icon + '</span>' +
        '<h3 class="semafor-cell__label">' + escapeHtml(cell.label) + '</h3>' +
        '<p class="semafor-cell__status">' + escapeHtml(statusText) + '</p>' +
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
      '<span class="banner__icon" aria-hidden="true">' + escapeHtml(suggestion.icon || '💡') + '</span>' +
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

  // Retorna HTML per al thumbnail — imatge si n'hi ha, placeholder si no.
  function mealThumbHtml(m) {
    if (m.photoDataUrl) {
      return '<img class="apat-card__foto" src="' + shared.escapeAttr(m.photoDataUrl) + '" alt="">';
    }

    const photoUrl = data.getMealPhoto(m.nom || '');
    if (photoUrl) {
      return '<img class="apat-card__foto" src="' + shared.escapeAttr(photoUrl) + '" alt="">';
    }

    // Placeholder amb la inicial en un gradient — el color depèn d'un hash simple
    // perquè dos àpats diferents no acabin sempre del mateix color.
    const initial = (m.nom || '?').trim().charAt(0).toUpperCase() || '?';
    const variant = PLACEHOLDER_VARIANTS[((m.id || '').length + initial.charCodeAt(0)) % PLACEHOLDER_VARIANTS.length];
    return '<div class="apat-card__foto-placeholder apat-card__foto-placeholder--' + variant + '" aria-hidden="true">' + escapeHtml(initial) + '</div>';
  }

  function apatHtml(m) {
    const hora = m.hora || formatTime(new Date(m.createdAt || Date.now()));
    const nom = escapeHtml(m.nom || 'Àpat');
    const extras = (m.extras && m.extras.length) ? m.extras.join(', ') : '';
    const extrasHtml = extras
      ? '<p class="apat-card__extras">+ ' + escapeHtml(extras) + '</p>'
      : '';

    // Mini-indicadors per àpat — 3 chips amb color segons estat.
    const ind = m.indicadors || data.analyzeMeal(m.nom || '');
    const chips = ['hidrats', 'verdures', 'proteina'].map(function (k) {
      const st = ind[k] || 'bad';
      const label = { hidrats: 'Hidrats', verdures: 'Verdures', proteina: 'Proteïna' }[k];
      return '<span class="chip chip--mini chip--' + st + '" aria-label="' + shared.escapeAttr(label + ' ' + st) + '">' + escapeHtml(label) + '</span>';
    }).join('');

    return '' +
      '<li class="apat-card" data-id="' + shared.escapeAttr(m.id) + '">' +
        mealThumbHtml(m) +
        '<div class="apat-card__body">' +
          '<span class="apat-card__hora">' + escapeHtml(hora) + '</span>' +
          '<h3 class="apat-card__nom">' + nom + '</h3>' +
          extrasHtml +
          '<div class="apat-card__chips">' + chips + '</div>' +
        '</div>' +
        '<div class="apat-card__actions">' +
          '<button type="button" class="btn btn--ghost" data-action="edit" data-id="' + shared.escapeAttr(m.id) + '" aria-label="Editar àpat ' + shared.escapeAttr(m.nom || '') + '">Editar</button>' +
          '<button type="button" class="btn btn--ghost" data-action="delete" data-id="' + shared.escapeAttr(m.id) + '" aria-label="Eliminar àpat ' + shared.escapeAttr(m.nom || '') + '">Eliminar</button>' +
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
