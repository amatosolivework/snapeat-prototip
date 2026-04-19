/*
  perfil.js — Lògica de la pantalla "Perfil" (perfil.html).
  Carrega i desa preferències alimentàries i el pressupost per defecte a localStorage.
*/

(function () {
  'use strict';

  const data = window.SnapEat && window.SnapEat.data;
  const shared = window.SnapEat && window.SnapEat.shared;
  if (!data || !shared) return;

  function init() {
    const vegChk = document.getElementById('pref-vegetaria');
    const glutenChk = document.getElementById('pref-sense-gluten');
    const lactChk = document.getElementById('pref-sense-lactosa');
    const budgetInput = document.getElementById('default-budget');

    // Prefill amb els valors actuals.
    const prefs = data.getPreferences();
    if (vegChk) vegChk.checked = !!prefs.vegetaria;
    if (glutenChk) glutenChk.checked = !!prefs.senseGluten;
    if (lactChk) lactChk.checked = !!prefs.senseLactosa;
    if (budgetInput) budgetInput.value = data.getBudget();

    // Desa preferències al canviar.
    function savePrefs() {
      const newPrefs = {
        vegetaria: vegChk ? vegChk.checked : false,
        senseGluten: glutenChk ? glutenChk.checked : false,
        senseLactosa: lactChk ? lactChk.checked : false
      };
      data.setPreferences(newPrefs);
      shared.showToast('Guardat', 'success');
    }

    [vegChk, glutenChk, lactChk].forEach(function (el) {
      if (el) el.addEventListener('change', savePrefs);
    });

    // Desa pressupost al canviar — amb una petita deferència perquè no
    // mostrem toast a cada tecla.
    if (budgetInput) {
      budgetInput.addEventListener('change', function () {
        const n = Number(budgetInput.value);
        if (isNaN(n) || n < 10) {
          shared.showToast('El pressupost ha de ser d\'almenys 10€', 'error');
          budgetInput.value = data.getBudget();
          return;
        }
        data.setBudget(n);
        shared.showToast('Guardat', 'success');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
