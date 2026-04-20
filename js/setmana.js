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
    refs.compraAmount = document.getElementById('compra-amount');
    refs.compraBar = document.getElementById('compra-bar');
    refs.compraBarFill = document.getElementById('compra-bar-fill');
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
      refs.menuSetmanal.innerHTML = plan.days.map(function (day, idx) {
        return dayCardHtml(day, idx);
      }).join('');
      wireDayCards(refs.menuSetmanal, plan);
    }
    // Si hi ha una llista de compra ja generada i l'acabem de canviar,
    // avisem l'usuari amb un subtle hint sota el botó.
    refreshLlistaHint(plan);
  }

  // Si l'usuari ja havia generat la llista i després canvia un àpat, avisem.
  function refreshLlistaHint(plan) {
    const list = data.getShoppingList();
    if (!list || !list.length) return;
    // Marquem l'existència d'una llista desactualitzada com a flag a localStorage.
    // La llegim a l'hora de renderitzar-la.
    const btn = refs.btnGenerarLlista;
    if (btn) btn.textContent = 'Tornar a generar la llista de compra';
  }

  function dayCardHtml(day, dayIndex) {
    return '' +
      '<article class="week-day" data-day-index="' + dayIndex + '">' +
        '<h3 class="week-day__title">' + escapeHtml(day.name) + '</h3>' +
        mealInDayHtml('Dinar', day.dinar, dayIndex, 'dinar') +
        mealInDayHtml('Sopar', day.sopar, dayIndex, 'sopar') +
      '</article>';
  }

  function mealInDayHtml(label, recipe, dayIndex, mealType) {
    if (!recipe) return '<p class="week-day__empty">—</p>';
    const meta = data.getRecipeMeta ? data.getRecipeMeta(recipe) : { dificultat: '', utensili: '' };
    const metaBadges =
      '<span class="meal-meta__badge"><span aria-hidden="true">⏱</span> ' + escapeHtml(recipe.temps_min + ' min') + '</span>' +
      (meta.utensili ? '<span class="meal-meta__badge">' + escapeHtml(meta.utensili) + '</span>' : '') +
      (meta.dificultat ? '<span class="meal-meta__badge meal-meta__badge--dif">' + escapeHtml(meta.dificultat) + '</span>' : '') +
      '<span class="meal-meta__badge meal-meta__badge--price">' + escapeHtml(formatPrice(recipe.preu_aprox)) + '</span>';

    return '' +
      '<div class="week-day__meal" data-day-index="' + dayIndex + '" data-meal-type="' + mealType + '">' +
        '<p class="week-day__meal-label">' + escapeHtml(label) + '</p>' +
        '<button type="button" class="week-day__meal-name" data-recipe-id="' + escapeAttr(recipe.id) + '" data-day-index="' + dayIndex + '" data-meal-type="' + mealType + '">' +
          escapeHtml(recipe.nom) +
        '</button>' +
        '<div class="meal-meta">' + metaBadges + '</div>' +
      '</div>';
  }

  function wireDayCards(container, plan) {
    container.querySelectorAll('.week-day__meal-name').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.recipeId;
        const dayIndex = Number(btn.dataset.dayIndex);
        const mealType = btn.dataset.mealType;
        const recipe = data.getRecipes().find(function (r) { return r.id === id; });
        if (recipe) showRecipeModal(recipe, dayIndex, mealType);
      });
    });
  }

  function showRecipeModal(recipe, dayIndex, mealType) {
    const ingredients = (recipe.ingredients || []).map(function (ing) {
      return '<li>' + escapeHtml(ing.nom + ' — ' + ing.quantitat) + '</li>';
    }).join('');
    const meta = data.getRecipeMeta ? data.getRecipeMeta(recipe) : { dificultat: '', utensili: '' };
    const metaLine = recipe.temps_min + ' min · ' + (meta.utensili || '') +
      (meta.dificultat ? ' · ' + meta.dificultat : '') +
      ' · ' + formatPrice(recipe.preu_aprox);

    const body = '' +
      '<p class="recipe-modal__meta">' + escapeHtml(metaLine) + '</p>' +
      '<h3 class="recipe-modal__subtitle">Ingredients</h3>' +
      '<ul class="recipe-modal__ingredients">' + ingredients + '</ul>';

    // Si sabem a quin dia pertany la recepta, oferim un botó per canviar-la.
    const canSwap = typeof dayIndex === 'number' && (mealType === 'dinar' || mealType === 'sopar');

    showRecipeInfoModal(recipe.nom, body, canSwap ? {
      swapLabel: 'Canviar aquest àpat',
      onSwap: function () { showAlternativeRecipesModal(dayIndex, mealType, recipe); }
    } : null);
  }

  // Modal informatiu amb acció opcional de swap.
  function showRecipeInfoModal(title, bodyHtml, swapOpts) {
    const overlay = buildOverlay('recipe-modal-title');
    const swapButton = swapOpts
      ? '<button type="button" class="btn btn--secondary" data-action="swap">' + escapeHtml(swapOpts.swapLabel) + '</button>'
      : '';

    overlay.innerHTML = '' +
      '<div class="modal__dialog" role="document">' +
        '<h2 id="recipe-modal-title" class="modal__title">' + escapeHtml(title) + '</h2>' +
        '<div class="modal__body">' + bodyHtml + '</div>' +
        '<div class="modal__actions">' +
          swapButton +
          '<button type="button" class="btn btn--primary" data-action="close">Tancar</button>' +
        '</div>' +
      '</div>';

    const close = mountOverlay(overlay);
    const closeBtn = overlay.querySelector('[data-action="close"]');
    if (closeBtn) { closeBtn.focus(); closeBtn.addEventListener('click', close); }

    if (swapOpts) {
      const swapBtn = overlay.querySelector('[data-action="swap"]');
      if (swapBtn) {
        swapBtn.addEventListener('click', function () {
          close();
          swapOpts.onSwap();
        });
      }
    }
  }

  // Crea un overlay modal accessible amb els atributs correctes.
  function buildOverlay(titleId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal modal--visible modal--overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', titleId);
    return overlay;
  }

  // Munta l'overlay al body, gestiona focus i retorna una funció close().
  function mountOverlay(overlay) {
    const previous = document.activeElement;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function close() {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (previous && previous.focus) try { previous.focus(); } catch (e) { /* ignore */ }
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    }

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    return close;
  }

  // ------------------------------
  //  Canvi d'un àpat individual dins el menú
  // ------------------------------

  function showAlternativeRecipesModal(dayIndex, mealType, currentRecipe) {
    const prefs = data.getPreferences();
    const plan = data.getWeekPlan();
    // Excloem la resta d'àpats ja triats a la setmana per evitar repeticions.
    const excludeIds = [];
    if (plan && plan.days) {
      plan.days.forEach(function (d) {
        if (d.dinar) excludeIds.push(d.dinar.id);
        if (d.sopar) excludeIds.push(d.sopar.id);
      });
    }
    const alternatives = data.getAlternativeRecipes(currentRecipe, mealType, prefs, excludeIds);

    if (!alternatives.length) {
      shared.showToast('No trobem alternatives diferents ara mateix', 'info');
      return;
    }

    const overlay = buildOverlay('swap-modal-title');
    const listHtml = alternatives.map(function (r, idx) {
      const m = data.getRecipeMeta ? data.getRecipeMeta(r) : { dificultat: '', utensili: '' };
      const subline = r.temps_min + ' min · ' + (m.utensili || '') +
        (m.dificultat ? ' · ' + m.dificultat : '') +
        ' · ' + formatPrice(r.preu_aprox);
      return '' +
        '<label class="swap-option">' +
          '<input type="radio" name="swap-choice" value="' + idx + '"' + (idx === 0 ? ' checked' : '') + '>' +
          '<span class="swap-option__body">' +
            '<span class="swap-option__name">' + escapeHtml(r.nom) + '</span>' +
            '<span class="swap-option__meta">' + escapeHtml(subline) + '</span>' +
          '</span>' +
        '</label>';
    }).join('');

    overlay.innerHTML = '' +
      '<div class="modal__dialog" role="document">' +
        '<h2 id="swap-modal-title" class="modal__title">Quin àpat et ve més bé?</h2>' +
        '<p class="modal__body">Substituirem <strong>' + escapeHtml(currentRecipe.nom) + '</strong>. Tria la que més t\'abelleixi.</p>' +
        '<fieldset class="swap-options">' +
          '<legend class="visually-hidden">Alternatives</legend>' +
          listHtml +
        '</fieldset>' +
        '<div class="modal__actions">' +
          '<button type="button" class="btn btn--ghost" data-action="cancel">Cancel·lar</button>' +
          '<button type="button" class="btn btn--primary" data-action="confirm">Canviar</button>' +
        '</div>' +
      '</div>';

    const close = mountOverlay(overlay);
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');
    const confirmBtn = overlay.querySelector('[data-action="confirm"]');
    if (confirmBtn) confirmBtn.focus();
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        const selected = overlay.querySelector('input[name="swap-choice"]:checked');
        const idx = selected ? Number(selected.value) : 0;
        const chosen = alternatives[idx];
        if (!chosen) { close(); return; }
        const newPlan = data.replaceMealInPlan(dayIndex, mealType, chosen);
        close();
        if (newPlan) {
          renderWeekPlan(newPlan);
          shared.showToast('Àpat canviat: ' + chosen.nom, 'success');
        }
      });
    }
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

  // Emoji per a cada categoria de compra — reforç visual ràpid al súper.
  const CATEGORY_ICON = {
    'Verdures': '🥬',
    'Proteïna': '🍗',
    'Llet i derivats': '🥛',
    'Bàsics': '🌾',
    'Altres': '🛒'
  };

  function renderShoppingList(list) {
    if (!refs.llistaCompra) return;
    showSection(refs.sectLlista);

    // Agrupem per categoria.
    const groups = groupByCategory(list);
    const categoriesOrder = ['Verdures', 'Proteïna', 'Llet i derivats', 'Bàsics', 'Altres'];
    const html = categoriesOrder
      .filter(function (cat) { return groups[cat] && groups[cat].length; })
      .map(function (cat) {
        const icon = CATEGORY_ICON[cat] || '🛒';
        return '' +
          '<div class="shopping-group">' +
            '<h3 class="shopping-group__title"><span class="shopping-group__icon" aria-hidden="true">' + icon + '</span>' + escapeHtml(cat) + '</h3>' +
            '<ul class="shopping-group__list">' +
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
      '<li data-id="' + escapeAttr(item.id) + '">' +
        '<span>' + escapeHtml(item.nom + ' — ' + item.quantitat) + '</span>' +
        '<span style="color:var(--color-text-muted);font-size:var(--font-size-small);font-weight:var(--font-weight-medium);">' + escapeHtml(formatPrice(item.preuAprox)) + '</span>' +
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
      '<article class="compra-item" data-id="' + escapeAttr(item.id) + '" data-comprat="' + (comprat ? 'true' : 'false') + '">' +
        '<button type="button" class="compra-item__check" data-action="toggle" data-id="' + escapeAttr(item.id) + '" aria-pressed="' + (comprat ? 'true' : 'false') + '" aria-label="' + escapeAttr((comprat ? 'Desmarcar' : 'Marcar') + ' com a comprat: ' + item.nom) + '" style="min-width:44px;min-height:44px;border-radius:9999px;border:2px solid ' + (comprat ? 'var(--color-brand)' : 'var(--color-border-strong)') + ';background:' + (comprat ? 'var(--color-brand)' : 'var(--color-surface)') + ';color:' + (comprat ? '#fff' : 'var(--color-text-subtle)') + ';display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;cursor:pointer;transition:all 0.15s;">' +
          (comprat ? '✓' : '') +
        '</button>' +
        '<div class="compra-item__body" style="flex:1;min-width:0;">' +
          '<p class="compra-item__nom" style="font-weight:var(--font-weight-semibold);margin:0;font-size:var(--font-size-body);' + (comprat ? 'text-decoration:line-through;color:var(--color-text-muted);' : 'color:var(--color-text);') + '">' + escapeHtml(item.nom) + '</p>' +
          '<p class="compra-item__meta" style="margin:2px 0 0;color:var(--color-text-muted);font-size:var(--font-size-small);">' + escapeHtml(item.quantitat + ' · ' + formatPrice(item.preuAprox)) + '</p>' +
        '</div>' +
        '<button type="button" class="btn btn--ghost" data-action="alternativa" data-id="' + escapeAttr(item.id) + '" aria-label="Buscar alternativa a ' + escapeAttr(item.nom) + '" style="font-size:var(--font-size-small);">' +
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
    const comprats = list.filter(function (i) { return i.comprat; });
    const total = list.length;
    const gastat = comprats.reduce(function (sum, i) { return sum + (Number(i.preuAprox) || 0); }, 0);
    const budget = data.getBudget();

    refs.compraProgress.textContent = comprats.length + ' de ' + total + ' productes';

    if (refs.compraAmount) {
      refs.compraAmount.textContent = formatPrice(gastat) + ' de ' + formatPrice(budget);
    }

    if (refs.compraBar && refs.compraBarFill) {
      const pct = budget > 0 ? Math.min(100, Math.round((gastat / budget) * 100)) : 0;
      refs.compraBarFill.style.width = pct + '%';
      refs.compraBar.setAttribute('aria-valuenow', String(pct));
      // Canvi subtil de color: verd fins 80%, ambar fins 100%, vermell si supera.
      refs.compraBar.classList.remove('progress-bar--warn', 'progress-bar--over');
      if (gastat > budget) refs.compraBar.classList.add('progress-bar--over');
      else if (pct >= 80) refs.compraBar.classList.add('progress-bar--warn');
    }
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
