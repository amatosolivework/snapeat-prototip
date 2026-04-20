/*
  setmana.js — Lògica de la pantalla "La meva setmana" (setmana.html).
  Flux progressiu: pressupost → menú → llista → mode compra → resum.
  Totes les accions principals van per un sticky CTA al peu (iOS style).
  Els modals (recepta, swap, alternativa) són bottom-sheets.
*/

(function () {
  'use strict';

  const data = window.SnapEat && window.SnapEat.data;
  const shared = window.SnapEat && window.SnapEat.shared;
  if (!data || !shared) return;

  const { escapeHtml, escapeAttr, formatPrice } = shared;

  // ------------------------------
  //  Refs i estat
  // ------------------------------

  const refs = {};
  let currentStep = 'pressupost';

  function cacheRefs() {
    refs.sectPressupost = document.getElementById('section-pressupost');
    refs.sectMenu = document.getElementById('section-menu');
    refs.sectLlista = document.getElementById('section-llista');
    refs.sectCompra = document.getElementById('section-compra');
    refs.sectResum = document.getElementById('section-resum');

    refs.budgetInput = document.getElementById('budget-input');
    refs.menuSetmanal = document.getElementById('menu-setmanal');
    refs.menuBudgetPill = document.getElementById('menu-budget-pill');
    refs.llistaCompra = document.getElementById('llista-compra');
    refs.productesCompra = document.getElementById('productes-compra');
    refs.compraProgress = document.getElementById('compra-progress');
    refs.compraAmount = document.getElementById('compra-amount');
    refs.compraBar = document.getElementById('compra-bar');
    refs.compraBarFill = document.getElementById('compra-bar-fill');
    refs.resumGastat = document.getElementById('resum-gastat');
    refs.resumTotal = document.getElementById('resum-total');
    refs.resumProgress = document.getElementById('resum-progress');
    refs.stickyCta = document.getElementById('sticky-cta');
    refs.stickyCtaBtn = document.getElementById('sticky-cta-btn');
  }

  // ------------------------------
  //  Init
  // ------------------------------

  function init() {
    cacheRefs();

    const savedBudget = data.getBudget();
    if (refs.budgetInput) refs.budgetInput.value = savedBudget;

    if (refs.budgetInput) {
      refs.budgetInput.addEventListener('change', function () {
        const n = Number(refs.budgetInput.value);
        if (!isNaN(n) && n > 0) data.setBudget(n);
      });
    }

    const savedPlan = data.getWeekPlan();
    const savedList = data.getShoppingList();

    if (savedPlan) renderWeekPlan(savedPlan);
    if (savedList && savedList.length) renderShoppingList(savedList);

    // Determina el step inicial a partir de l'URL o de l'estat desat.
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'compra' && savedList && savedList.length) {
      showSection(refs.sectCompra);
      renderModeCompra(savedList);
      setStep('compra');
    } else if (savedList && savedList.length) {
      setStep('llista');
    } else if (savedPlan) {
      setStep('menu');
    } else {
      setStep('pressupost');
    }
  }

  // ------------------------------
  //  Sticky CTA — un sol botó que canvia segons el step
  // ------------------------------

  function setStep(step) {
    currentStep = step;
    if (!refs.stickyCta || !refs.stickyCtaBtn) return;

    const cfg = {
      pressupost: { label: 'Generar menú setmanal', handler: onGenerarMenu, variant: 'primary' },
      menu:       { label: 'Perfecte! Generar llista de compra', handler: onGenerarLlista, variant: 'primary' },
      llista:     { label: 'Vaig al súper', handler: onAnarComprar, variant: 'primary' },
      compra:     { label: 'Compra feta', handler: onAcabar, variant: 'primary' },
      resum:      null
    };

    const c = cfg[step];
    if (!c) {
      refs.stickyCta.hidden = true;
      return;
    }
    refs.stickyCta.hidden = false;
    refs.stickyCtaBtn.textContent = c.label;
    refs.stickyCtaBtn.className = 'btn btn--' + c.variant + ' btn--block';
    refs.stickyCtaBtn.onclick = c.handler;
    refs.stickyCtaBtn.disabled = false;
  }

  // ------------------------------
  //  Pas 1: Generar menú
  // ------------------------------

  function onGenerarMenu() {
    const budget = Number(refs.budgetInput.value);
    if (isNaN(budget) || budget < 10) {
      shared.showToast('Indica un pressupost d\'almenys 10 €', 'error');
      refs.budgetInput.focus();
      return;
    }

    if (refs.stickyCtaBtn) {
      refs.stickyCtaBtn.disabled = true;
      refs.stickyCtaBtn.textContent = 'Generant...';
    }

    setTimeout(function () {
      const prefs = data.getPreferences();
      const plan = data.generateWeekPlan(budget, prefs);
      data.setBudget(budget);
      data.setWeekPlan(plan);
      renderWeekPlan(plan);
      setStep('menu');
      if (refs.sectMenu) {
        refs.sectMenu.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 350);
  }

  function renderWeekPlan(plan) {
    if (!plan || !plan.days) return;
    showSection(refs.sectMenu);
    renderBudgetPill(plan);
    if (refs.menuSetmanal) {
      refs.menuSetmanal.innerHTML = plan.days.map(function (day, idx) {
        return dayCardHtml(day, idx);
      }).join('');
      wireDayCards(refs.menuSetmanal);
    }
  }

  function renderBudgetPill(plan) {
    if (!refs.menuBudgetPill) return;
    const total = Number(plan.totalEstimat) || 0;
    const budget = Number(plan.budget) || 0;
    const over = total > budget;
    const near = !over && total >= budget * 0.85;

    refs.menuBudgetPill.className = 'budget-pill' +
      (over ? ' budget-pill--over' : (near ? ' budget-pill--near' : ''));
    refs.menuBudgetPill.innerHTML =
      '<span class="budget-pill__amount">' + escapeHtml(formatPrice(total)) + '</span>' +
      '<span class="budget-pill__sep">de</span>' +
      '<span class="budget-pill__budget">' + escapeHtml(formatPrice(budget)) + '</span>';
  }

  function dayCardHtml(day, dayIndex) {
    const balance = data.getDayBalance ? data.getDayBalance(day) : null;
    const dots = balance ? dayDotsHtml(balance) : '';
    return '' +
      '<article class="week-day" data-day-index="' + dayIndex + '">' +
        '<header class="week-day__header">' +
          '<h3 class="week-day__title">' + escapeHtml(day.name) + '</h3>' +
          dots +
        '</header>' +
        mealInDayHtml('Dinar', day.dinar, dayIndex, 'dinar') +
        mealInDayHtml('Sopar', day.sopar, dayIndex, 'sopar') +
      '</article>';
  }

  // Mini-semàfor: 3 punts de color amb l'equilibri nutricional del dia.
  function dayDotsHtml(balance) {
    const keys = ['hidrats', 'verdures', 'proteina'];
    const labels = { hidrats: 'Hidrats', verdures: 'Verdures', proteina: 'Proteïna' };
    const stateDesc = { ok: 'OK', warn: 'mig', bad: 'fluix' };
    return '<span class="day-balance" role="img" aria-label="Balanç nutricional: ' +
      keys.map(function (k) { return labels[k] + ' ' + stateDesc[balance[k] || 'bad']; }).join(', ') + '">' +
      keys.map(function (k) {
        const state = balance[k] || 'bad';
        return '<span class="day-balance__dot day-balance__dot--' + state + '" aria-hidden="true"></span>';
      }).join('') +
    '</span>';
  }

  function mealInDayHtml(label, recipe, dayIndex, mealType) {
    if (!recipe) return '<p class="week-day__empty">—</p>';
    // Només 2 badges a la card: temps + preu. El detall va al bottom-sheet.
    const metaBadges =
      '<span class="meal-meta__badge"><span aria-hidden="true">⏱</span> ' + escapeHtml(recipe.temps_min + ' min') + '</span>' +
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

  function wireDayCards(container) {
    container.querySelectorAll('.week-day__meal-name').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.recipeId;
        const dayIndex = Number(btn.dataset.dayIndex);
        const mealType = btn.dataset.mealType;
        const recipe = data.getRecipes().find(function (r) { return r.id === id; });
        if (recipe) openRecipeSheet(recipe, dayIndex, mealType);
      });
    });
  }

  // ------------------------------
  //  Bottom-sheet de recepta completa
  // ------------------------------

  function openRecipeSheet(recipe, dayIndex, mealType) {
    const meta = data.getRecipeMeta ? data.getRecipeMeta(recipe) : {};

    const ingredients = (recipe.ingredients || []).map(function (ing) {
      return '<li class="recipe-ing"><span class="recipe-ing__name">' + escapeHtml(ing.nom) +
        '</span><span class="recipe-ing__qty">' + escapeHtml(ing.quantitat) + '</span></li>';
    }).join('');

    const passos = (recipe.passos || []).map(function (pas, idx) {
      return '<li class="recipe-step"><span class="recipe-step__num" aria-hidden="true">' + (idx + 1) +
        '</span><span class="recipe-step__text">' + escapeHtml(pas) + '</span></li>';
    }).join('');

    const chips = [
      '<span class="recipe-chip">⏱ ' + escapeHtml(recipe.temps_min + ' min') + '</span>',
      meta.utensili ? '<span class="recipe-chip">' + escapeHtml(meta.utensili) + '</span>' : '',
      meta.dificultat ? '<span class="recipe-chip recipe-chip--dif">' + escapeHtml(meta.dificultat) + '</span>' : '',
      '<span class="recipe-chip recipe-chip--price">' + escapeHtml(formatPrice(recipe.preu_aprox)) + '</span>'
    ].filter(Boolean).join('');

    const body = '' +
      '<div class="recipe-chips">' + chips + '</div>' +
      '<h3 class="recipe-sheet__subtitle">Ingredients</h3>' +
      '<ul class="recipe-ing-list">' + ingredients + '</ul>' +
      (passos ? '<h3 class="recipe-sheet__subtitle">Com es fa</h3><ol class="recipe-step-list">' + passos + '</ol>' : '');

    const canSwap = typeof dayIndex === 'number' && (mealType === 'dinar' || mealType === 'sopar');

    const actions = canSwap ? [
      {
        label: 'Canviar aquest àpat',
        variant: 'secondary',
        closeOnClick: true,
        onClick: function () { openSwapSheet(dayIndex, mealType, recipe); }
      }
    ] : [];

    shared.bottomSheet({
      title: recipe.nom,
      bodyHtml: body,
      actions: actions
    });
  }

  // ------------------------------
  //  Bottom-sheet de canvi d'àpat (swap)
  // ------------------------------

  function openSwapSheet(dayIndex, mealType, currentRecipe) {
    const prefs = data.getPreferences();
    const plan = data.getWeekPlan();
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

    const listHtml = alternatives.map(function (r, idx) {
      const m = data.getRecipeMeta ? data.getRecipeMeta(r) : {};
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

    const body = '' +
      '<p class="sheet-lead">Substituirem <strong>' + escapeHtml(currentRecipe.nom) + '</strong>. Tria la que més t\'abelleixi.</p>' +
      '<fieldset class="swap-options">' +
        '<legend class="visually-hidden">Alternatives</legend>' +
        listHtml +
      '</fieldset>';

    shared.bottomSheet({
      title: 'Quin àpat et ve més bé?',
      bodyHtml: body,
      actions: [
        { label: 'Cancel·lar', variant: 'ghost' },
        {
          label: 'Canviar',
          variant: 'primary',
          onClick: function (ctx) {
            const selected = ctx.root.querySelector('input[name="swap-choice"]:checked');
            const idx = selected ? Number(selected.value) : 0;
            const chosen = alternatives[idx];
            if (!chosen) return;
            const newPlan = data.replaceMealInPlan(dayIndex, mealType, chosen);
            if (newPlan) {
              renderWeekPlan(newPlan);
              shared.showToast('Àpat canviat: ' + chosen.nom, 'success');
            }
          }
        }
      ]
    });
  }

  // ------------------------------
  //  Pas 2: Llista de compra
  // ------------------------------

  function onGenerarLlista() {
    const plan = data.getWeekPlan();
    if (!plan) { shared.showToast('Genera primer el menú', 'error'); return; }
    const list = data.generateShoppingList(plan);
    data.setShoppingList(list);
    renderShoppingList(list);
    setStep('llista');
    if (refs.sectLlista) refs.sectLlista.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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

    const groups = groupByCategory(list);
    const categoriesOrder = ['Verdures', 'Proteïna', 'Llet i derivats', 'Bàsics', 'Altres'];
    const html = categoriesOrder
      .filter(function (cat) { return groups[cat] && groups[cat].length; })
      .map(function (cat) {
        const icon = CATEGORY_ICON[cat] || '🛒';
        return '' +
          '<section class="shopping-group">' +
            '<h3 class="grouped-list-heading"><span class="shopping-group__icon" aria-hidden="true">' + icon + '</span> ' + escapeHtml(cat) + '</h3>' +
            '<ul class="grouped-list shopping-group__list">' +
              groups[cat].map(shoppingRowHtml).join('') +
            '</ul>' +
          '</section>';
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
      '<li class="grouped-list__item" data-id="' + escapeAttr(item.id) + '">' +
        '<span class="grouped-list__label">' +
          escapeHtml(item.nom) +
          ' <span class="shopping-row__qty">' + escapeHtml(item.quantitat) + '</span>' +
        '</span>' +
        '<span class="grouped-list__value">' + escapeHtml(formatPrice(item.preuAprox)) + '</span>' +
      '</li>';
  }

  // ------------------------------
  //  Pas 3: Mode compra
  // ------------------------------

  function onAnarComprar() {
    const list = data.getShoppingList();
    if (!list || !list.length) { shared.showToast('Genera primer la llista', 'error'); return; }
    showSection(refs.sectCompra);
    renderModeCompra(list);
    setStep('compra');
    if (refs.sectCompra) refs.sectCompra.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderModeCompra(list) {
    if (!refs.productesCompra) return;
    refs.productesCompra.innerHTML = list.map(compraItemHtml).join('');
    wireCompraActions(refs.productesCompra);
    updateCompraProgress(list);
  }

  function compraItemHtml(item) {
    const comprat = !!item.comprat;
    return '' +
      '<article class="compra-item' + (comprat ? ' compra-item--done' : '') + '" data-id="' + escapeAttr(item.id) + '">' +
        '<button type="button" class="compra-item__check' + (comprat ? ' compra-item__check--on' : '') + '" data-action="toggle" data-id="' + escapeAttr(item.id) + '" aria-pressed="' + (comprat ? 'true' : 'false') + '" aria-label="' + escapeAttr((comprat ? 'Desmarcar' : 'Marcar') + ' com a comprat: ' + item.nom) + '">' +
          (comprat ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
        '</button>' +
        '<div class="compra-item__body">' +
          '<p class="compra-item__nom">' + escapeHtml(item.nom) + '</p>' +
          '<p class="compra-item__meta">' + escapeHtml(item.quantitat + ' · ' + formatPrice(item.preuAprox)) + '</p>' +
        '</div>' +
        '<button type="button" class="btn btn--ghost compra-item__alt" data-action="alternativa" data-id="' + escapeAttr(item.id) + '" aria-label="Buscar alternativa a ' + escapeAttr(item.nom) + '">Alternativa</button>' +
      '</article>';
  }

  function wireCompraActions(container) {
    container.querySelectorAll('[data-action="toggle"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.id;
        const list = data.getShoppingList();
        const item = list.find(function (i) { return i.id === id; });
        if (!item) return;
        data.updateShoppingItem(id, { comprat: !item.comprat });
        renderModeCompra(data.getShoppingList());
      });
    });

    container.querySelectorAll('[data-action="alternativa"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.id;
        const list = data.getShoppingList();
        const item = list.find(function (i) { return i.id === id; });
        if (item) openAltSheet(item);
      });
    });
  }

  function updateCompraProgress(list) {
    if (!refs.compraProgress) return;
    const comprats = list.filter(function (i) { return i.comprat; });
    const total = list.length;
    const gastat = comprats.reduce(function (s, i) { return s + (Number(i.preuAprox) || 0); }, 0);
    const budget = data.getBudget();

    refs.compraProgress.textContent = comprats.length + ' de ' + total + ' productes';
    if (refs.compraAmount) refs.compraAmount.textContent = formatPrice(gastat) + ' de ' + formatPrice(budget);

    if (refs.compraBar && refs.compraBarFill) {
      const pct = budget > 0 ? Math.min(100, Math.round((gastat / budget) * 100)) : 0;
      refs.compraBarFill.style.width = pct + '%';
      refs.compraBar.setAttribute('aria-valuenow', String(pct));
      refs.compraBar.classList.remove('progress-bar--warn', 'progress-bar--over');
      if (gastat > budget) refs.compraBar.classList.add('progress-bar--over');
      else if (pct >= 80) refs.compraBar.classList.add('progress-bar--warn');
    }
  }

  // ------------------------------
  //  Bottom-sheet d'alternativa d'ingredient
  // ------------------------------

  function openAltSheet(item) {
    const alternatives = data.getAlternatives(item.nom);

    const listHtml = alternatives.map(function (alt, idx) {
      return '' +
        '<label class="alt-option">' +
          '<input type="radio" name="alt-choice" value="' + idx + '"' + (idx === 0 ? ' checked' : '') + '>' +
          '<span class="alt-option__body">' +
            '<span class="alt-option__head">' +
              '<span class="alt-option__name">' + escapeHtml(alt.nom) + '</span>' +
              '<span class="alt-option__price">' + escapeHtml(formatPrice(alt.preuAprox)) + '</span>' +
            '</span>' +
            '<span class="alt-option__context">' + escapeHtml(alt.context) + '</span>' +
          '</span>' +
        '</label>';
    }).join('');

    const body = '' +
      '<p class="sheet-lead">Substituïm <strong>' + escapeHtml(item.nom) + '</strong> per una alternativa:</p>' +
      '<fieldset class="alt-options">' +
        '<legend class="visually-hidden">Alternatives</legend>' +
        listHtml +
      '</fieldset>';

    shared.bottomSheet({
      title: 'Necessites una alternativa?',
      bodyHtml: body,
      actions: [
        { label: 'Cancel·lar', variant: 'ghost' },
        {
          label: 'Triar alternativa',
          variant: 'primary',
          onClick: function (ctx) {
            const selected = ctx.root.querySelector('input[name="alt-choice"]:checked');
            const idx = selected ? Number(selected.value) : 0;
            const chosen = alternatives[idx];
            if (!chosen) return;
            data.updateShoppingItem(item.id, {
              nom: chosen.nom,
              preuAprox: chosen.preuAprox,
              comprat: false,
              substituit: true,
              originalNom: item.originalNom || item.nom
            });
            shared.showToast('Alternativa aplicada: ' + chosen.nom, 'success');
            renderModeCompra(data.getShoppingList());
          }
        }
      ]
    });
  }

  // ------------------------------
  //  Pas 4: Resum final
  // ------------------------------

  function onAcabar() {
    const list = data.getShoppingList();
    const gastat = list.filter(function (i) { return i.comprat; }).reduce(function (s, i) { return s + (Number(i.preuAprox) || 0); }, 0);
    const budget = data.getBudget();

    if (refs.resumGastat) refs.resumGastat.textContent = formatPrice(gastat);
    if (refs.resumTotal) refs.resumTotal.textContent = formatPrice(budget);
    if (refs.resumProgress) {
      const pct = budget > 0 ? Math.min(100, Math.round((gastat / budget) * 100)) : 0;
      refs.resumProgress.style.width = pct + '%';
      const bar = refs.resumProgress.parentNode;
      if (bar) {
        bar.classList.remove('progress-bar--warn', 'progress-bar--over');
        if (gastat > budget) bar.classList.add('progress-bar--over');
        else if (pct >= 80) bar.classList.add('progress-bar--warn');
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuenow', String(pct));
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');
      }
    }

    showSection(refs.sectResum);
    setStep('resum');
    if (refs.sectResum) refs.sectResum.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showSection(el) {
    if (!el) return;
    el.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
