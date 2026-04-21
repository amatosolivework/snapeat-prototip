/*
  registrar.js — Lògica de la pantalla de registre d'àpat (registrar.html).
  Permet captura/previsualització de foto, edició del text detectat,
  selecció d'extres (chips + text lliure) i desar l'àpat a localStorage.
  Suporta mode edició via ?edit=<id>.
*/

(function () {
  'use strict';

  const data = window.SnapEat && window.SnapEat.data;
  const shared = window.SnapEat && window.SnapEat.shared;
  if (!data || !shared) return;

  // Deteccions simulades — es tria una segons una mica d'aleatori per donar vida a la demo.
  // En una implementació real això seria la resposta d'un model de visió.
  const MOCK_DETECTIONS = [
    'Pasta carbonara amb nata',
    'Amanida de pollastre i alvocat',
    'Arròs amb verdures saltat',
    'Truita de patates amb tomàquet',
    'Pollastre al forn amb patates',
    'Entrepà de pernil',
    'Hamburguesa amb patates fregides',
    'Llenties estofades amb verdures'
  ];

  let state = {
    editId: null,
    photoDataUrl: null,
    extres: new Set()
  };

  function init() {
    const form = document.getElementById('form-registrar');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const detectInput = document.getElementById('detect-result');
    const extrasChips = document.getElementById('extras-chips');
    const extraCustom = document.getElementById('extra-custom');
    const btnRegistrar = document.getElementById('btn-registrar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const footerCta = document.getElementById('footer-cta');

    if (!form || !detectInput) return;

    // El CTA només apareix quan hi ha foto I nom (manual o autodetectat).
    // Si falta qualsevol dels dos, es manté amagat — evitem clics ambigus.
    function updateCtaVisibility() {
      if (!footerCta) return;
      const hasPhoto = !!state.photoDataUrl;
      const hasName = (detectInput.value || '').trim().length > 0;
      footerCta.classList.toggle('footer-cta--hidden', !(hasPhoto && hasName));
    }

    // Mode edició?
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) {
      const existing = data.getMeal(editId);
      if (existing) {
        state.editId = editId;
        detectInput.value = existing.nom || '';
        if (existing.photoDataUrl && photoPreview) {
          photoPreview.src = existing.photoDataUrl;
          photoPreview.classList.remove('hidden');
          photoPreview.alt = 'Foto de ' + existing.nom;
          state.photoDataUrl = existing.photoDataUrl;
        }
        if (existing.extras && existing.extras.length) {
          existing.extras.forEach(function (x) { state.extres.add(x); });
          syncChipsState(extrasChips);
        }
        if (btnRegistrar) btnRegistrar.textContent = 'Guardar canvis';
        const h1 = document.querySelector('.registrar-header h1');
        if (h1) h1.textContent = 'Editar àpat';
      }
    }

    // Inicialitzem la visibilitat del CTA: en mode edició ja tindrà els 2 camps.
    updateCtaVisibility();

    // Foto — previsualització on change.
    if (photoInput) {
      photoInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        shared.compressImageFile(file, 1024, 0.7).then(function (dataUrl) {
          state.photoDataUrl = dataUrl;
          if (photoPreview) {
            photoPreview.src = dataUrl;
            photoPreview.classList.remove('hidden');
            photoPreview.alt = 'Foto de l\'àpat';
          }
          // Detecció simulada: si el camp està buit, proposem un nom aleatori.
          if (!detectInput.value.trim()) {
            const idx = Math.floor(Math.random() * MOCK_DETECTIONS.length);
            detectInput.value = MOCK_DETECTIONS[idx];
            shared.showToast('He detectat: ' + MOCK_DETECTIONS[idx], 'info');
          }
          updateCtaVisibility();
        }).catch(function () {
          shared.showToast('No hem pogut processar la foto, torna a provar', 'error');
        });
      });
    }

    // Input del nom — actualitzem la visibilitat del CTA a cada tecla.
    detectInput.addEventListener('input', updateCtaVisibility);

    // Chips — toggle amb aria-pressed.
    if (extrasChips) {
      extrasChips.querySelectorAll('.chip').forEach(function (chip) {
        chip.setAttribute('aria-pressed', state.extres.has(chip.dataset.extra) ? 'true' : 'false');
        chip.addEventListener('click', function () {
          const extra = chip.dataset.extra;
          if (!extra) return;
          if (state.extres.has(extra)) {
            state.extres.delete(extra);
            chip.setAttribute('aria-pressed', 'false');
            chip.classList.remove('chip--selected');
          } else {
            state.extres.add(extra);
            chip.setAttribute('aria-pressed', 'true');
            chip.classList.add('chip--selected');
          }
        });
      });
    }

    // Submit — validar i desar.
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nom = (detectInput.value || '').trim();
      if (!nom) {
        shared.showToast('Escriu què has menjat per continuar', 'error');
        detectInput.focus();
        return;
      }

      // Afegim extra personalitzat si existeix.
      const custom = (extraCustom && extraCustom.value || '').trim();
      if (custom) state.extres.add(custom);

      const extresArr = Array.from(state.extres);
      const indicadors = data.analyzeMeal(nom + ' ' + extresArr.join(' '));

      if (state.editId) {
        data.updateMeal(state.editId, {
          nom: nom,
          extras: extresArr,
          indicadors: indicadors,
          photoDataUrl: state.photoDataUrl,
          updatedAt: new Date().toISOString()
        });
        shared.showToast('Àpat actualitzat', 'success');
      } else {
        const now = new Date();
        const meal = {
          id: shared.uid('meal'),
          nom: nom,
          extras: extresArr,
          indicadors: indicadors,
          photoDataUrl: state.photoDataUrl,
          hora: shared.formatTime(now),
          // Data local (YYYY-MM-DD) per filtrar àpats d'avui sense saltar un dia a UTC.
          fecha: data.todayKey ? data.todayKey() : now.toISOString().slice(0, 10),
          createdAt: now.toISOString()
        };
        const saved = data.addMeal(meal);
        if (!saved) {
          shared.showToast('No hem pogut guardar. Prova d\'eliminar un àpat antic.', 'error');
          return;
        }
        shared.showToast('Àpat registrat', 'success');
      }

      // Tornem al dashboard després d'un breu retard perquè el toast es vegi.
      setTimeout(function () { location.href = 'index.html'; }, 400);
    });

    // Cancel·lar — tornar enrere o al dashboard.
    if (btnCancelar) {
      btnCancelar.addEventListener('click', function () {
        if (document.referrer && document.referrer.indexOf(location.origin) === 0) {
          history.back();
        } else {
          location.href = 'index.html';
        }
      });
    }
  }

  function syncChipsState(container) {
    if (!container) return;
    container.querySelectorAll('.chip').forEach(function (chip) {
      const pressed = state.extres.has(chip.dataset.extra);
      chip.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      if (pressed) chip.classList.add('chip--selected');
      else chip.classList.remove('chip--selected');
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
