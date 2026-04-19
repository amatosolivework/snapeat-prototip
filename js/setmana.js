/*
  setmana.js — Lògica de la pantalla "La meva setmana" (setmana.html).
  Cobreix: pressupost, generació de menú, llista de compra, mode compra amb
  alternatives i resum final.
*/

(function () {
  'use strict';

  const data = window.SnapEat && window.SnapEat.data;
  const shared = window.SnapEat && window.SnapEat.shared;
  if (!data || !shared) return;

  const { escapeHtml, escapeAttr, formatPrice } = shared;

  // ------------------------------
  //  Referències DOM
  // ------------------------------

  const refs = {};

  function cacheRefs() {
    refs.sectPressupost = document.getElementById('section-pressupost');
    refs.sectMenu = document.getElementById('section-menu');
    refs.sectLlista = document.getElementById('section-llista');
    refs.sectCompra = document.getElementById('section-compra');
    refs.sectResum = document.getElementById('section-resum');

    refs.budgetInput = document.getElementById('budget-input');
    refs.btnGenerarMenu = document.getElementById('btn-generar-menu');
    refs.menuSetmanal = document.getElementById('menu-setmanal');
    refs.menuBudgetTotal = document.getElementById('menu-budget-total');
    refs.btnGenerarLlista = document.getElementById('btn-generar-llista');
    refs.llistaCompra = document.getElementById('llista-compra');
    refs.btnAnarComprar = document.getElementById('btn-anar-comprar');
    refs.productesCompra = document.getElementById('productes-compra');
    refs.compraProgress = document.getElementById('compra-progress');
    refs.btnAcabar = document.getElementById('btn-acabar');
    refs.resumGastat = document.getElementById('resum-gastat');
    refs.resumTotal = document.getElementById('resum-total');
    refs.resumProgress = document.getElementById('resum-progress');
    refs.alternativaTpl = document.getElementById('alternativa-template');
  }

  // ------------------------------
  //  Init
  // ------------------------------

  function init() {
    cacheRefs();

    // Prefill de pressupost.
    const savedBudget = data.getBudget();
    if (refs.budgetInput) refs.budgetInput.value = savedBudget;

    // Si hi ha un pla ja generat, el restaurem.
    const savedPlan = data.getWeekPlan();
    if (savedPlan) renderWeekPlan(savedPlan);

    // Si hi ha llista de compra guardada, la restaurem.
    const savedList = data.getShoppingList();
    if (savedList && savedList.length) renderShoppingList(savedList);

    wireEvents();

    // Suport URL ?mode=compra → mostrar directament la secció de compra.
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'compra' && savedList && savedList.length) {
      showSection(refs.sectCompra);
      renderModeCompra(savedList);
    }
  }

  function wireEvents() {
    if (refs.btnGenerarMenu) {
      refs.btnGenerarMenu.addEventListener('click', onGenerarMenu);
    }
    if (refs.btnGenerarLlista) {
      refs.btnGenerarLlista.addEventListener('click', onGenerarLlista);
    }
    if (refs.btnAnarComprar) {
      refs.btnAnarComprar.addEventListener('click', onAnarComprar);
    }
    if (refs.btnAcabar) {
      refs.btnAcabar.addEventListener('click', onAcabar);
    }
    // Desa el pressupost quan canvia.
    if (refs.budgetInput) {
      refs.budgetInput.addEventListener('change', function () {
        const n = Number(refs.budgetInput.value);
        if (!isNaN(n) && n > 0) data.setBudget(n);
      });
    }
  }

  // ------------------------------
  //  Pas 1: Generar menú
  // ------------------------------

  function onGenerarMenu() {
    const budget = Number(refs.budgetInput.value);
    if (isNaN(budget) || budget < 10) {
      shared.showToast('Indica un pressupost d\'almenys 10€', 'error');
      refs.budgetInput.focus();
      return;
    }

    refs.btnGenerarMenu.disabled = true;
    refs.btnGenerarMenu.textContent = 'Generant...';

    // Simulem una mica de temps per donar sensació de càlcul.
    setTimeout(function () {
      const prefs = data.getPreferences();
      const plan = data.generateWeekPlan(budget, prefs);
      data.setBudget(budget);
      data.setWeekPlan(plan);
      renderWeekPlan(plan);

      refs.btnGenerarMenu.disabled = false;
      refs.btnGenerarMenu.textContent = 'Tornar a generar';

      // Scroll suau cap al menú.
      if (refs.sectMenu) {
        refs.sectMenu.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const title = refs.sectMenu.querySelector('h2');
        if (title) title.setAttribute('tabindex', '-1');
      }
    }, 350);
  }

  function renderWeekPlan(plan) {
    if (!plan || !plan.days) return;
    showSection(refs.sectMenu);
    if (refs.menuBudgetTotal) {
      refs.menuBudgetTotal.textContent = formatPrice(plan.totalEstimat) + ' (pressupost ' + formatPrice(plan.budget) + ')';
    }
    if (refs.menuSetmanal) {
      refs.menuSetmanal.innerHTML = plan.days.map(dayCardHtml).join('');
      wireDayCards(refs.menuSetmanal, plan);
    }
  }

  function dayCardHtml(day) {
    return '' +
      '<article class="week-day" data-day="' + escapeAttr(day.name) + '">' +
        '<h3 class="week-day__title">' + escapeHtml(day.name) + '</h3>' +
        mealInDayHtml('Dinar', day.dinar) +
        mealInDayHtml('Sopar', day.sopar) +
      '</article>';
  }

  function mealInDayHtml(label, recipe) {
    if (!recipe) return '<p class="week-day__empty">—</p>';
    return '' +
      '<div class="week-day__meal" data-recipe-id="' + escapeAttr(recipe.id) + '">' +
        '<p class="week-day__meal-label">' + escapeHtml(label) + '</p>' +
        '<button type="button" class="week-day__meal-name btn btn--ghost" data-recipe-id="' + escapeAttr(recipe.id) + '" style="text-align:left;display:block;width:100%;padding:4px 0;">' +
          escapeHtml(recipe.nom) +
        '</button>' +
        '<p class="week-day__meal-meta" style="font-size:12px;color:#6B7280;">' +
          escapeHtml(recipe.temps_min + ' min · ' + formatPrice(recipe.preu_aprox)) +
        '</p>' +
      '</div>';
  }

  function wireDayCards(container, plan) {
    container.querySelectorAll('[data-recipe-id]').forEach(function (btn) {
      if (btn.tagName !== 'BUTTON') return;
      btn.addEventListener('click', function () {
        const id = btn.dataset.recipeId;
        const recipe = data.getRecipes().find(function (r) { return r.id === id; });
        if (recipe) showRecipeModal(recipe);
      });
    });
  }

  function showRecipeModal(recipe) {
    const ingredients = (recipe.ingredients || []).map(function (ing) {
      return '<li>' + escapeHtml(ing.nom + ' — ' + ing.quantitat) + '</li>';
    }).join('');

    const body = '' +
      '<p style="color:#4B5563;margin:0 0 12px;">' +
        escapeHtml(recipe.temps_min + ' minuts · ' + formatPrice(recipe.preu_aprox)) +
      '</p>' +
      '<h3 style="font-size:16px;font-weight:600;margin:0 0 8px;">Ingredients</h3>' +
      '<ul style="padding-left:20px;margin:0;">' + ingredients + '</ul>';

    showInfoModal(recipe.nom, body);
  }

  // Mostra un modal informatiu senzill (OK com a únic botó).
  function showInfoModal(title, bodyHtml) {
    const overlay = document.createElement('div');
    overlay.className = 'modal modal--visible';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'info-modal-title');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(17, 24, 39, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';
    overlay.style.zIndex = '180';

    overlay.innerHTML = '' +
      '<div class="modal__dialog" role="document" style="background:#fff;border-radius:16px;padding:24px;max-width:420px;width:100%;box-shadow:0 10px 15px -3px rgba(0,0,0,0.10);">' +
        '<h2 id="info-modal-title" class="modal__title" style="margin:0 0 12px;font-size:20px;font-weight:700;">' + escapeHtml(title) + '</h2>' +
        '<div class="modal__body" style="margin-bottom:16px;">' + bodyHtml + '</div>' +
        '<div class="modal__actions" style="display:flex;justify-content:flex-end;">' +
          '<button type="button" class="btn btn--primary" data-action="close">Tancar</button>' +
        '</div>' +
      '</div>';

    const previous = document.activeElement;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const closeBtn = overlay.querySelector('[data-action="close"]');
    closeBtn.focus();

    function close() {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (previous && previous.focus) try { previous.focus(); } catch (e) { /* ignore */ }
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
  }

  // ------------------------------
  //  Pas 2: Generar llista de compra
  // ------------------------------

  function onGenerarLlista() {
    const plan = data.getWeekPlan();
    if (!plan) {
      shared.showToast('Genera primer el menú', 'error');
      return;
    }
    const list = data.generateShoppingList(plan);
    data.setShoppingList(list);
    renderShoppingList(list);
    if (refs.sectLlista) {
      refs.sectLlista.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderShoppingList(list) {
    if (!refs.llistaCompra) return;
    showSection(refs.sectLlista);

    // Agrupem per categoria.
    const groups = groupByCategory(list);
    const categoriesOrder = ['Verdures', 'Proteïna', 'Llet i derivats', 'Bàsics', 'Altres'];
    const html = categoriesOrder
      .filter(function (cat) { return groups[cat] && groups[cat].length; })
      .map(function (cat) {
        return '' +
          '<div class="shopping-group">' +
            '<h3 class="shopping-group__title" style="font-size:16px;font-weight:600;margin:12px 0 6px;">' + escapeHtml(cat) + '</h3>' +
            '<ul class="shopping-group__list" style="list-style:none;padding:0;margin:0;">' +
              groups[cat].map(shoppingRowHtml).join('') +
            '</ul>' +
          '</div>';
      })
      .join('');
    refs.llistaCompra.innerHTML = html;
  }

  function groupByCategory(list) {
    const g = {};
    list.forEach(function (item) {
      const cat = item.categoria || 'Altres';
      if (!g[cat]) g[cat] = [];
      g[cat].push(item);
    });
    return g;
  }

  function shoppingRowHtml(item) {
    return '' +
      '<li data-id="' + escapeAttr(item.id) + '" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #E5E7EB;">' +
        '<span>' + escapeHtml(item.nom + ' — ' + item.quantitat) + '</span>' +
        '<span style="color:#6B7280;font-size:14px;">' + escapeHtml(formatPrice(item.preuAprox)) + '</span>' +
      '</li>';
  }

  // ------------------------------
  //  Pas 3: Mode compra
  // ------------------------------

  function onAnarComprar() {
    const list = data.getShoppingList();
    if (!list || !list.length) {
      shared.showToast('Genera primer la llista', 'error');
      return;
    }
    showSection(refs.sectCompra);
    renderModeCompra(list);
    if (refs.sectCompra) {
      refs.sectCompra.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderModeCompra(list) {
    if (!refs.productesCompra) return;
    const html = list.map(compraItemHtml).join('');
    refs.productesCompra.innerHTML = html;
    wireCompraActions(refs.productesCompra);
    updateCompraProgress(list);
  }

  function compraItemHtml(item) {
    const comprat = !!item.comprat;
    return '' +
      '<article class="compra-item" data-id="' + escapeAttr(item.id) + '" style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:8px;background:' + (comprat ? '#ECFDF5' : '#fff') + ';">' +
        '<button type="button" class="compra-item__check" data-action="toggle" data-id="' + escapeAttr(item.id) + '" aria-pressed="' + (comprat ? 'true' : 'false') + '" aria-label="' + escapeAttr((comprat ? 'Desmarcar' : 'Marcar') + ' com a comprat: ' + item.nom) + '" style="min-width:44px;min-height:44px;border-radius:9999px;border:2px solid ' + (comprat ? '#059669' : '#D1D5DB') + ';background:' + (comprat ? '#059669' : '#fff') + ';color:' + (comprat ? '#fff' : '#9CA3AF') + ';display:flex;align-items:center;justify-content:center;font-size:20px;">' +
          (comprat ? '✓' : '') +
        '</button>' +
        '<div class="compra-item__body" style="flex:1;">' +
          '<p class="compra-item__nom" style="font-weight:600;margin:0;' + (comprat ? 'text-decoration:line-through;color:#6B7280;' : '') + '">' + escapeHtml(item.nom) + '</p>' +
          '<p class="compra-item__meta" style="margin:0;color:#6B7280;font-size:14px;">' + escapeHtml(item.quantitat + ' · ' + formatPrice(item.preuAprox)) + '</p>' +
        '</div>' +
        '<button type="button" class="btn btn--ghost" data-action="alternativa" data-id="' + escapeAttr(item.id) + '" aria-label="Buscar alternativa a ' + escapeAttr(item.nom) + '" style="font-size:14px;">' +
          'Alternativa' +
        '</button>' +
      '</article>';
  }

  function wireCompraActions(container) {
    container.querySelectorAll('[data-action="toggle"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.id;
        const list = data.getShoppingList();
        const item = list.find(function (i) { return i.id === id; });
        if (!item) return;
        const next = !item.comprat;
        data.updateShoppingItem(id, { comprat: next });
        renderModeCompra(data.getShoppingList());
      });
    });

    container.querySelectorAll('[data-action="alternativa"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.id;
        const list = data.getShoppingList();
        const item = list.find(function (i) { return i.id === id; });
        if (!item) return;
        showAlternativesModal(item);
      });
    });
  }

  function updateCompraProgress(list) {
    if (!refs.compraProgress) return;
    const comprats = list.filter(function (i) { return i.comprat; }).length;
    refs.compraProgress.textContent = comprats + ' de ' + list.length + ' productes';
  }

  // ------------------------------
  //  Modal d'alternatives
  // ------------------------------

  function showAlternativesModal(item) {
    const alternatives = data.getAlternatives(item.nom);

    const altsHtml = alternatives.map(function (alt, idx) {
      return '' +
        '<label style="display:flex;gap:8px;padding:8px;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:8px;cursor:pointer;">' +
          '<input type="radio" name="alt-choice" value="' + idx + '"' + (idx === 0 ? ' checked' : '') + '>' +
          '<div>' +
            '<p style="margin:0;font-weight:600;">' + escapeHtml(alt.nom) + ' <span style="color:#059669;font-weight:500;">(' + escapeHtml(formatPrice(alt.preuAprox)) + ')</span></p>' +
            '<p style="margin:4px 0 0;color:#4B5563;font-size:14px;">' + escapeHtml(alt.context) + '</p>' +
          '</div>' +
        '</label>';
    }).join('');

    const body = '' +
      '<p style="color:#4B5563;margin:0 0 12px;">Substituïm <strong>' + escapeHtml(item.nom) + '</strong> per una alternativa que encaixi millor:</p>' +
      '<fieldset style="border:none;padding:0;margin:0;">' +
        '<legend class="visually-hidden">Tria una alternativa</legend>' +
        altsHtml +
      '</fieldset>';

    const overlay = document.createElement('div');
    overlay.className = 'modal modal--visible';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'alt-modal-title');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(17, 24, 39, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '24px';
    overlay.style.zIndex = '180';

    overlay.innerHTML = '' +
      '<div class="modal__dialog" role="document" style="background:#fff;border-radius:16px;padding:24px;max-width:420px;width:100%;box-shadow:0 10px 15px -3px rgba(0,0,0,0.10);">' +
        '<h2 id="alt-modal-title" class="modal__title" style="margin:0 0 12px;font-size:20px;font-weight:700;">Necessites una alternativa?</h2>' +
        '<div class="modal__body">' + body + '</div>' +
        '<div class="modal__actions" style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">' +
          '<button type="button" class="btn btn--ghost" data-action="cancel">Cancel·lar</button>' +
          '<button type="button" class="btn btn--primary" data-action="confirm">Triar alternativa</button>' +
        '</div>' +
      '</div>';

    const previous = document.activeElement;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const confirmBtn = overlay.querySelector('[data-action="confirm"]');
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');
    confirmBtn.focus();

    function close() {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (previous && previous.focus) try { previous.focus(); } catch (e) { /* ignore */ }
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    }

    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);

    confirmBtn.addEventListener('click', function () {
      const selected = overlay.querySelector('input[name="alt-choice"]:checked');
      const idx = selected ? Number(selected.value) : 0;
      const chosen = alternatives[idx];
      if (!chosen) { close(); return; }

      // Substituïm el producte: modifiquem el seu nom i preu a la llista.
      data.updateShoppingItem(item.id, {
        nom: chosen.nom,
        preuAprox: chosen.preuAprox,
        comprat: false,
        substituit: true,
        originalNom: item.originalNom || item.nom
      });
      close();
      shared.showToast('Alternativa aplicada: ' + chosen.nom, 'success');
      renderModeCompra(data.getShoppingList());
    });
  }

  // ------------------------------
  //  Pas 4: Resum final
  // ------------------------------

  function onAcabar() {
    const list = data.getShoppingList();
    const gastat = list.filter(function (i) { return i.comprat; }).reduce(function (sum, i) { return sum + (Number(i.preuAprox) || 0); }, 0);
    const budget = data.getBudget();

    if (refs.resumGastat) refs.resumGastat.textContent = formatPrice(gastat);
    if (refs.resumTotal) refs.resumTotal.textContent = formatPrice(budget);
    if (refs.resumProgress) {
      const pct = budget > 0 ? Math.min(100, Math.round((gastat / budget) * 100)) : 0;
      refs.resumProgress.style.width = pct + '%';
      refs.resumProgress.style.background = pct <= 100 ? '#10B981' : '#D97706';
      refs.resumProgress.setAttribute('role', 'progressbar');
      refs.resumProgress.setAttribute('aria-valuenow', String(pct));
      refs.resumProgress.setAttribute('aria-valuemin', '0');
      refs.resumProgress.setAttribute('aria-valuemax', '100');
    }

    showSection(refs.sectResum);
    if (refs.sectResum) {
      refs.sectResum.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ------------------------------
  //  Utilitat: mostra una secció hidden
  // ------------------------------

  function showSection(el) {
    if (!el) return;
    el.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
