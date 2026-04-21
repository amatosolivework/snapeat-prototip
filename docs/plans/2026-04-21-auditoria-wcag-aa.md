# Auditoria WCAG AA + fixes d'integritat — pla d'implementació

> **Per a agents executors:** SUB-SKILL RECOMANAT: `superpowers:subagent-driven-development` (subagents per tasca, revisió entremig) o `superpowers:executing-plans` (inline amb checkpoints). Els passos usen sintaxi checkbox (`- [ ]`) per al tracking.

**Objectiu:** Tancar el prototip SnapEat per al test d'usabilitat P3 arreglant els gaps d'accessibilitat WCAG 2.1 AA + bugs de flow que invaliden el test.

**Arquitectura:** Canvis quirúrgics sobre l'estructura existent (HTML + CSS + JS vanilla, localStorage). Zero refactors d'arquitectura. Cada tasca tanca un o més ítems de l'spec a `docs/specs/2026-04-21-auditoria-wcag-aa.md` amb verificació explícita.

**Stack:** HTML5 + CSS (custom properties) + Vanilla JS (IIFE). localStorage per a persistència. Verificació amb Chrome DevTools Lighthouse + axe DevTools, Playwright scripts per a captures (`/tmp/screenshot-snapeat.js` i `/tmp/screenshot-with-data.js`), WebAIM Contrast Checker manual, VoiceOver (macOS) per a test amb lector de pantalla.

**Regles del projecte (recordatori per a cada commit):**
- Missatges de commit en **català**.
- **Zero watermarks d'AI** (cap "Co-Authored-By", cap menció a Claude/Anthropic).
- Un commit per grup coherent de fixes. GitHub Pages fa auto-deploy en cada push.

---

## Fase 1 — Bloqueig del test (P0)

Aquests fixes s'ataquen primer perquè bloquegen el test d'usabilitat amb usuaris reals.

### Tasca 1: Chip-macro aria-label en català

**Spec:** §A.2.1 — P0.

**Files:**
- Modify: `js/dashboard.js:186-198`

**Context:** Els chips H/V/P dels àpats d'avui ara exposen `aria-label="Hidrats: warn"` (anglès). Lectors de pantalla llegeixen "warn" literal, confon l'usuari. La constant `STATUS_TEXT` (definida al mateix fitxer, línia 17) ja conté les frases en català que usa el semàfor.

- [ ] **Pas 1: Capturar el DOM actual**

Obre `index.html` al navegador amb dades sembrades (`node /tmp/screenshot-with-data.js` o localStorage amb àpats). Inspecciona un chip H/V/P i anota l'atribut `aria-label` (p.e. "Hidrats: bad"). Aquest és el baseline.

- [ ] **Pas 2: Modificar `chipDefs` i el render del chip**

Al fitxer `js/dashboard.js`, a la funció `apatHtml()` (al voltant de la línia 186), canviar la construcció de l'aria-label per reutilitzar `STATUS_TEXT` en català. Substituir el bloc:

```js
const chipDefs = [
  { key: 'hidrats', initial: 'H', label: 'Hidrats', shortLabel: 'Hidrats' },
  { key: 'verdures', initial: 'V', label: 'Verdures', shortLabel: 'Verd.' },
  { key: 'proteina', initial: 'P', label: 'Proteïna', shortLabel: 'Prot.' }
];
const chips = chipDefs.map(function (c) {
  const st = ind[c.key] || 'bad';
  return '<span class="chip-macro chip-macro--' + st + '" aria-label="' + shared.escapeAttr(c.label + ': ' + st) + '">' +
    '<span class="chip-macro__initial" aria-hidden="true">' + c.initial + '</span>' +
    '<span class="chip-macro__label">' + escapeHtml(c.shortLabel) + '</span>' +
  '</span>';
}).join('');
```

per:

```js
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
```

- [ ] **Pas 3: Verificar al DOM**

Recarrega `index.html`. Inspecciona un chip H/V/P. `aria-label` ha de dir `"Hidrats: Hidrats al punt"` o `"Verdures: Un plat verd i ho tens"` etc., mai "warn" / "bad" / "ok".

- [ ] **Pas 4: Verificar amb VoiceOver (si disponible)**

Activa VoiceOver (`Cmd+F5` a macOS) i navega fins a un chip H/V/P. Ha de llegir la frase completa en català.

- [ ] **Pas 5: Commit**

```bash
git add js/dashboard.js
git commit -m "Chip-macro aria-label en català al dashboard

Els chips H/V/P dels àpats d'avui exposaven aria-label amb el
codi d'estat en anglès (\"Hidrats: warn\"). Ara reutilitzen
STATUS_TEXT per donar la frase Coach completa en català."
```

---

### Tasca 2: Progressbar roles a setmana (compra + resum)

**Spec:** §A.4.1 + §A.4.2 — P0 i P1.

**Files:**
- Modify: `setmana.html:80-85, 93-98`
- Modify: `js/setmana.js:592-615`

**Context:** Les dues progressbars del flow setmana (`compra-bar` i la del resum) no tenen `role="progressbar"` ni atributs ARIA al markup. `setmana.js` les afegeix parcialment per JS només quan l'usuari arriba a aquells steps. Lectors de pantalla no les reconeixen com a barres de progrés. Volem els atributs declarats al HTML, i el JS només actualitza `aria-valuenow`.

- [ ] **Pas 1: Modificar HTML de la progressbar de compra**

A `setmana.html`, localitzar el bloc `compra-status` (al voltant de la línia 77-85) i substituir:

```html
<div class="progress-bar" id="compra-bar">
  <div class="progress-bar__fill" id="compra-bar-fill"></div>
</div>
```

per:

```html
<div class="progress-bar" id="compra-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Progrés del pressupost de compra">
  <div class="progress-bar__fill" id="compra-bar-fill"></div>
</div>
```

- [ ] **Pas 2: Modificar HTML de la progressbar de resum**

Al mateix fitxer, localitzar el bloc del step `resum` (al voltant de la línia 91-98) i substituir:

```html
<div class="resum-budget">
  <p class="resum-amount"><span id="resum-gastat">—</span> de <span id="resum-total">—</span></p>
  <div class="progress-bar">
    <div id="resum-progress" class="progress-bar__fill"></div>
  </div>
</div>
```

per:

```html
<div class="resum-budget">
  <p class="resum-amount"><span id="resum-gastat">—</span> de <span id="resum-total">—</span></p>
  <div class="progress-bar" id="resum-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Resum del pressupost gastat">
    <div id="resum-progress" class="progress-bar__fill"></div>
  </div>
</div>
```

- [ ] **Pas 3: Simplificar `onAcabar` a `setmana.js`**

A `js/setmana.js`, funció `onAcabar()` (línies 592-615), substituir el bloc que afegeix atributs ARIA per JS:

```js
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
```

per (el role + valuemin/max ja són a l'HTML):

```js
if (refs.resumProgress) {
  const pct = budget > 0 ? Math.min(100, Math.round((gastat / budget) * 100)) : 0;
  refs.resumProgress.style.width = pct + '%';
  const bar = refs.resumProgress.parentNode;
  if (bar) {
    bar.classList.remove('progress-bar--warn', 'progress-bar--over');
    if (gastat > budget) bar.classList.add('progress-bar--over');
    else if (pct >= 80) bar.classList.add('progress-bar--warn');
    bar.setAttribute('aria-valuenow', String(pct));
  }
}
```

- [ ] **Pas 4: Verificar al DOM**

Recarrega `setmana.html`. Obre DevTools i inspecciona els dos `.progress-bar`. Han de tenir `role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=...`.

- [ ] **Pas 5: Commit**

```bash
git add setmana.html js/setmana.js
git commit -m "Progressbar role i ARIA al flow setmana

Les dues progressbars (compra i resum) exposaven només
aria-valuenow via JS i sense role. Ara el markup HTML ja
porta role=progressbar + aria-valuemin/max, i el JS només
actualitza aria-valuenow."
```

---

### Tasca 3: Compressió d'imatge al registrar + gestió d'error de quota

**Spec:** §C.1 + §C.2 + §C.3 — P0.

**Files:**
- Modify: `js/shared.js` (afegir helper de compressió)
- Modify: `js/registrar.js:84-106`
- Modify: `js/data.js:27-33, 80-85`

**Context:** Les fotos d'iPhone com a base64 fan saltar la quota de localStorage en el segon àpat. Afegim compressió via canvas (1024×1024, JPEG 0.7) abans de persistir, i retornem un boolean des de `save()` perquè el caller pugui notificar l'usuari si encara falla.

- [ ] **Pas 1: Afegir helper `compressImageFile` a `shared.js`**

A `js/shared.js`, afegir al voltant de les altres utilitats (abans del `return {` final) aquesta funció:

```js
// Comprimeix un File d'imatge a JPEG dataURL, respectant aspect ratio.
// maxDim és la mida màxima (en px) per a l'eix més llarg. quality 0-1.
function compressImageFile(file, maxDim, quality) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function (ev) {
      const img = new Image();
      img.onerror = reject;
      img.onload = function () {
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

Afegir `compressImageFile: compressImageFile` a l'objecte que retorna l'IIFE (al costat de `showToast`, `bottomSheet`, etc.).

- [ ] **Pas 2: Usar el helper a `registrar.js`**

A `js/registrar.js`, substituir el handler del `photoInput` (línies 85-106):

```js
if (photoInput) {
  photoInput.addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      state.photoDataUrl = ev.target.result;
      if (photoPreview) {
        photoPreview.src = state.photoDataUrl;
        photoPreview.classList.remove('hidden');
        photoPreview.alt = 'Foto de l\'àpat';
      }
      if (!detectInput.value.trim()) {
        const idx = Math.floor(Math.random() * MOCK_DETECTIONS.length);
        detectInput.value = MOCK_DETECTIONS[idx];
        shared.showToast('He detectat: ' + MOCK_DETECTIONS[idx], 'info');
      }
      updateCtaVisibility();
    };
    reader.readAsDataURL(file);
  });
}
```

per:

```js
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
```

- [ ] **Pas 3: Fer que `save()` retorni boolean a `data.js`**

A `js/data.js`, substituir la funció `save` (línies 27-33):

```js
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // localStorage ple o bloquejat — ignorem silenciosament (prototip).
  }
}
```

per:

```js
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // localStorage ple o bloquejat: retornem false perquè el caller pugui avisar.
    return false;
  }
}
```

- [ ] **Pas 4: Fer que `addMeal()` propagui el resultat**

A la mateixa `data.js`, substituir `addMeal` (línies 80-85):

```js
function addMeal(meal) {
  const meals = getMeals();
  meals.push(meal);
  save('snapeat:meals', meals);
  return meal;
}
```

per:

```js
function addMeal(meal) {
  const meals = getMeals();
  meals.push(meal);
  if (!save('snapeat:meals', meals)) return null;
  return meal;
}
```

- [ ] **Pas 5: Notificar al registrar.js si `addMeal` falla**

A `js/registrar.js`, al handler de submit (al voltant de la línia 158-173), envoltar la branca d'inserció amb una comprovació:

Substituir:

```js
} else {
  const now = new Date();
  const meal = {
    id: shared.uid('meal'),
    nom: nom,
    extras: extresArr,
    indicadors: indicadors,
    photoDataUrl: state.photoDataUrl,
    hora: shared.formatTime(now),
    fecha: data.todayKey ? data.todayKey() : now.toISOString().slice(0, 10),
    createdAt: now.toISOString()
  };
  data.addMeal(meal);
  shared.showToast('Àpat registrat', 'success');
}

// Tornem al dashboard després d'un breu retard perquè el toast es vegi.
setTimeout(function () { location.href = 'index.html'; }, 400);
```

per:

```js
} else {
  const now = new Date();
  const meal = {
    id: shared.uid('meal'),
    nom: nom,
    extras: extresArr,
    indicadors: indicadors,
    photoDataUrl: state.photoDataUrl,
    hora: shared.formatTime(now),
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
```

- [ ] **Pas 6: Verificar manualment**

En un iPhone (o simulador) amb càmera real: registra un àpat amb foto → torna al dashboard → apareix. Registra un segon àpat amb foto → torna al dashboard → apareixen els dos. Registra un tercer → apareixen els tres. Sense compressió, el segon faria desaparèixer el primer.

Alternativament: a Chrome DevTools, simula localStorage quota buidant la resta de l'emmagatzematge i afegint entrades fins a saturar. Registra àpats amb fotos base64 petites.

- [ ] **Pas 7: Commit**

```bash
git add js/shared.js js/registrar.js js/data.js
git commit -m "Compressió d'imatge abans de persistir àpat

Les fotos d'iPhone en base64 (3-5 MB) saturaven la quota de
localStorage al registrar el segon àpat, i save() fallava
silenciosament. Ara comprimim via canvas (1024x1024, JPEG 0.7)
abans de persistir, i addMeal retorna null si save falla perquè
el caller pugui avisar l'usuari."
```

---

### Tasca 4: `resetWeekCycle()` + detecció de setmana completada

**Spec:** §B.1 + §B.8 — P0.

**Files:**
- Modify: `js/data.js` (afegir funció + exportar-la)
- Modify: `js/setmana.js:157-174` (lògica init)

**Context:** Quan l'usuari acaba una compra i torna, el prototip el porta a `llista` (setmana.js:168) en lloc de mostrar el resum. Volem detectar que tots els ítems estan comprats i anar a `resum`, més afegir un helper `resetWeekCycle()` que usarem a la Tasca 5.

- [ ] **Pas 1: Afegir `resetWeekCycle()` a `data.js`**

A `js/data.js`, afegir abans de l'API pública (abans de `return { getMeals: getMeals, ...`):

```js
// Reinicia el cicle de setmana: esborra el pla i la llista de compra.
// Preserva pressupost i preferències de l'usuari.
function resetWeekCycle() {
  setWeekPlan(null);
  setShoppingList([]);
}
```

Afegir `resetWeekCycle: resetWeekCycle,` a l'objecte de retorn de l'IIFE (al voltant de la línia 1133, al costat de `setWeekPlan`).

- [ ] **Pas 2: Afegir helper `isWeekCompleted` a `setmana.js`**

A `js/setmana.js`, abans de la funció `init()` (al voltant de la línia 140), afegir:

```js
function isWeekCompleted(list) {
  return Array.isArray(list) && list.length > 0 && list.every(function (i) { return i.comprat; });
}
```

- [ ] **Pas 3: Modificar el branching del init**

A la mateixa `setmana.js`, substituir el bloc del init (línies 157-174):

```js
const savedPlan = data.getWeekPlan();
const savedList = data.getShoppingList();

if (savedPlan) renderWeekPlan(savedPlan);
if (savedList && savedList.length) renderShoppingList(savedList);

const params = new URLSearchParams(location.search);
if (params.get('mode') === 'compra' && savedList && savedList.length) {
  renderModeCompra(savedList);
  goToStep('compra', { skipScroll: true });
} else if (savedList && savedList.length) {
  goToStep('llista', { skipScroll: true });
} else if (savedPlan) {
  goToStep('menu', { skipScroll: true });
} else {
  goToStep('pressupost', { skipScroll: true });
}
```

per:

```js
const savedPlan = data.getWeekPlan();
const savedList = data.getShoppingList();

if (savedPlan) renderWeekPlan(savedPlan);
if (savedList && savedList.length) renderShoppingList(savedList);

if (isWeekCompleted(savedList)) {
  renderModeCompra(savedList);
  renderResum(savedList);
  goToStep('resum', { skipScroll: true });
} else if (savedList && savedList.length) {
  renderModeCompra(savedList);
  goToStep('compra', { skipScroll: true });
} else if (savedPlan) {
  goToStep('menu', { skipScroll: true });
} else {
  goToStep('pressupost', { skipScroll: true });
}
```

**Nota:** Aquest pas elimina el codi mort de `params.get('mode') === 'compra'` (Tasca 6 n'havia de ser part, però cau natural aquí perquè és el mateix bloc) i també actualitza el branch "setmana en marxa però no completada" per anar directament a `compra` en lloc de `llista`, que reflecteix millor el comportament esperat.

- [ ] **Pas 4: Extreure `renderResum` com a funció**

A `js/setmana.js`, just després de `renderModeCompra` (al voltant de la línia 477), afegir:

```js
function renderResum(list) {
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
      bar.setAttribute('aria-valuenow', String(pct));
    }
  }
}
```

I modificar la funció existent `onAcabar()` (línies 592-615) perquè cridi aquesta nova funció:

```js
function onAcabar() {
  const list = data.getShoppingList();
  renderResum(list);
  goToStep('resum');
}
```

**Atenció:** A la Tasca 6 hi afegirem la validació de 0 ítems abans de `renderResum`. No afegeixis la validació aquí, només extreu la funció.

- [ ] **Pas 5: Verificar manualment**

Obre `setmana.html`, completa un cicle (genera menú → llista → mode compra → marca tots els ítems → "Compra feta"). Hauries d'arribar al `resum`. Ara recarrega la pàgina amb F5. Hauries de seguir al `resum` (no a `llista`).

- [ ] **Pas 6: Commit**

```bash
git add js/data.js js/setmana.js
git commit -m "Detectar setmana completada al reobrir La meva setmana

L'init comprovava si hi havia llista de compra però no si
estava tota comprada, fent que l'usuari tornés a la llista
d'una setmana ja finalitzada. Ara, si tots els items estan
comprats, va al resum. També s'elimina un branch de codi mort
(params.get('mode') === 'compra' mai s'activava)."
```

---

### Tasca 5: CTA "Planificar una setmana nova" al resum

**Spec:** §B.3 — P0.

**Files:**
- Modify: `js/setmana.js:23-50, 127-134`

**Context:** Al resum, el CTA sticky està amagat (ctaLabel: null). L'usuari no té manera de començar una setmana nova sense recarregar o anar al dashboard i tornar. Afegim un CTA que reseteja el cicle i porta al `pressupost`.

- [ ] **Pas 1: Canviar `STEP_META.resum.ctaLabel`**

A `js/setmana.js`, al voltant de la línia 44, substituir:

```js
resum: {
  title: 'Ben fet!',
  subtitle: 'La setmana està llesta.',
  ctaLabel: null
}
```

per:

```js
resum: {
  title: 'Ben fet!',
  subtitle: 'La setmana està llesta.',
  ctaLabel: 'Planificar una setmana nova'
}
```

- [ ] **Pas 2: Afegir `onReiniciarCicle()`**

A la mateixa `setmana.js`, al voltant de la línia 615 (just després d'`onAcabar`), afegir:

```js
function onReiniciarCicle() {
  data.resetWeekCycle();
  if (refs.budgetInput) refs.budgetInput.value = data.getBudget();
  // Neteja render fantasma al flow-track per no veure contingut vell quan llisquem.
  if (refs.menuSetmanal) refs.menuSetmanal.innerHTML = '';
  if (refs.llistaCompra) refs.llistaCompra.innerHTML = '';
  if (refs.productesCompra) refs.productesCompra.innerHTML = '';
  goToStep('pressupost');
}
```

- [ ] **Pas 3: Registrar el handler al mapa de `updateStickyCta`**

A la mateixa `setmana.js`, al voltant de la línia 127, substituir:

```js
const handlers = {
  pressupost: onGenerarMenu,
  menu: onGenerarLlista,
  llista: onAnarComprar,
  compra: onAcabar
};
```

per:

```js
const handlers = {
  pressupost: onGenerarMenu,
  menu: onGenerarLlista,
  llista: onAnarComprar,
  compra: onAcabar,
  resum: onReiniciarCicle
};
```

- [ ] **Pas 4: Verificar manualment**

Completa un cicle fins al `resum`. Hi has de veure el CTA "Planificar una setmana nova" a baix. Clica-hi. Has de tornar al step `pressupost` amb l'input de pressupost intacte. Si vas al menú, has de veure `menu-setmanal` buit (no els ítems de la setmana anterior).

- [ ] **Pas 5: Commit**

```bash
git add js/setmana.js
git commit -m "CTA Planificar una setmana nova al resum

El step resum no tenia sortida clara cap a un nou cicle —
l'usuari havia de recarregar o anar manualment al dashboard.
Ara un CTA sticky reseteja el pla i la llista i torna al
pressupost, mantenint el pressupost preferent."
```

---

### Tasca 6: Eliminar codi mort + validar "Compra feta"

**Spec:** §B.2 (ja cobert parcialment a T4) + §B.4 — P0.

**Files:**
- Modify: `js/setmana.js:592-600` (abans `onAcabar`)

**Context:** `onAcabar` no valida que hi hagi com a mínim un ítem comprat abans de mostrar el resum. Si l'usuari hi clica sense haver marcat res, arriba a un resum amb "0 € de 30 €", confús. (El check `params.get('mode') === 'compra'` ja es va eliminar a la Tasca 4).

- [ ] **Pas 1: Afegir validació a `onAcabar`**

A `js/setmana.js`, substituir `onAcabar()` (després de l'extracció de la Tasca 4, queda així):

```js
function onAcabar() {
  const list = data.getShoppingList();
  renderResum(list);
  goToStep('resum');
}
```

per:

```js
function onAcabar() {
  const list = data.getShoppingList();
  const marcats = list.filter(function (i) { return i.comprat; }).length;
  if (marcats === 0) {
    shared.showToast('Marca algun producte abans d\'acabar', 'info');
    return;
  }
  renderResum(list);
  goToStep('resum');
}
```

- [ ] **Pas 2: Verificar manualment**

Arriba al step `compra` (mode compra). Sense marcar cap ítem, clica "Compra feta". Has de veure un toast `"Marca algun producte abans d'acabar"` i seguir al `compra`, no anar al `resum`.

- [ ] **Pas 3: Commit**

```bash
git add js/setmana.js
git commit -m "Validar almenys un producte comprat abans del resum

Clicar Compra feta amb cap ítem marcat portava a un resum
buit amb 0 €. Ara mostrem un toast demanant marcar almenys
un producte i no avancem."
```

---

### Tasca 7: Sobreescriure pla + back ocult + H2 redundant

**Spec:** §B.5 + §B.6 + §B.7 — P1.

**Files:**
- Modify: `js/setmana.js:96-100` (goToStep), `180-201` (onGenerarMenu)
- Modify: `setmana.html:91-93`

**Context:** Tres fixes petits relacionats del flow setmana: (B.5) toast informatiu al regenerar un menú que ja existia, (B.6) ocultar el back al `resum` perquè és tancament, (B.7) netejar un H2 redundant al `resum`.

- [ ] **Pas 1: Toast informatiu a `onGenerarMenu`**

A `js/setmana.js`, modificar `onGenerarMenu()` (línia 180) per avisar si ja hi havia un pla:

Substituir:

```js
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
    goToStep('menu');
  }, 350);
}
```

per:

```js
function onGenerarMenu() {
  const budget = Number(refs.budgetInput.value);
  if (isNaN(budget) || budget < 10) {
    shared.showToast('Indica un pressupost d\'almenys 10 €', 'error');
    refs.budgetInput.focus();
    return;
  }

  const planExistent = data.getWeekPlan();
  if (planExistent) {
    shared.showToast('Generant un menú nou…', 'info');
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
    goToStep('menu');
  }, 350);
}
```

- [ ] **Pas 2: Back ocult al `resum`**

A la mateixa `setmana.js`, modificar `goToStep()` (línia 98). Substituir:

```js
if (refs.stepBack) refs.stepBack.hidden = (idx === 0);
```

per:

```js
if (refs.stepBack) refs.stepBack.hidden = (idx === 0 || STEPS[idx] === 'resum');
```

- [ ] **Pas 3: Treure H2 redundant del resum**

A `setmana.html`, al step `resum` (línies 91-93), substituir:

```html
<section class="flow-step" data-step-name="resum" aria-labelledby="resum-title">
  <h2 id="resum-title" class="visually-hidden">Compra completada</h2>
  <div class="resum-budget">
```

per:

```html
<section class="flow-step" data-step-name="resum" aria-labelledby="step-title">
  <div class="resum-budget">
```

**Nota:** El `<section>` ara apunta a `step-title` (l'H1 dinàmic que ja porta el text "Ben fet!" via `STEP_META.resum.title`). No cal un H2 oculto.

- [ ] **Pas 4: Verificar manualment**

- Obre `setmana.html` amb un pla ja existent (localStorage amb `snapeat:weekPlan`). Vés a `pressupost` (fent "Planificar una setmana nova" des del resum si cal). Clica "Generar menú setmanal". Has de veure un toast "Generant un menú nou…".
- Quan estiguis al step `resum`, el botó back (chevron esquerra) del topbar ha d'estar ocult.
- Inspecciona el DOM al resum: el `<section>` ha d'apuntar a `aria-labelledby="step-title"` i no ha d'haver cap H2 `resum-title`.

- [ ] **Pas 5: Commit**

```bash
git add js/setmana.js setmana.html
git commit -m "Polish del flow setmana: regeneració, back i semàntica

- onGenerarMenu avisa amb un toast quan sobreescriu un pla
  existent (evita sorpresa).
- El botó back s'amaga al step resum perquè és tancament.
- S'elimina un H2 ocult redundant del resum; el section ja
  apunta al step-title dinàmic (H1)."
```

---

## Fase 2 — Components globals (P1)

### Tasca 8: Bottom-sheet dialog + focus trap + aria-modal

**Spec:** §A.1.1 — P1.

**Files:**
- Modify: `js/shared.js` (funció `bottomSheet`)

**Context:** Els bottom-sheets (recepta, swap, alternativa, confirm) ara són `<div class="bottom-sheet">` sense semàntica de diàleg. Lectors de pantalla no els anuncien com a modals i el focus pot sortir del panell. Cal `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap i `Esc` per tancar.

- [ ] **Pas 1: Inspeccionar l'actual `bottomSheet`**

Obre `js/shared.js` i localitza la funció `bottomSheet`. Anota com es construeix actualment el DOM del panell (probablement un contenidor `.bottom-sheet__panel` amb handle + header + body + footer). El fix ha de respectar l'estructura visual però afegir ARIA i comportament.

- [ ] **Pas 2: Modificar el panell amb ARIA i focus trap**

Dins de la funció `bottomSheet`, on es crea l'element `.bottom-sheet__panel`, afegir:

- `panel.setAttribute('role', 'dialog');`
- `panel.setAttribute('aria-modal', 'true');`
- Un `id` únic per al títol (p.e. `bottom-sheet-title-` + timestamp), assignat al `<h2 class="bottom-sheet__title">`, i `panel.setAttribute('aria-labelledby', titleId);`

També, implementar el focus trap:

```js
// Dins de la funció que mostra el bottom-sheet:
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const focusables = panel.querySelectorAll(focusableSelector);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function onKeyDown(e) {
  if (e.key === 'Escape') { close(); return; }
  trapFocus(e);
}

document.addEventListener('keydown', onKeyDown);

// Focus al primer element focusable del panell després de l'animació d'obertura.
setTimeout(function () {
  const first = panel.querySelector(focusableSelector);
  if (first) first.focus();
}, 50);

// A la funció `close()`:
document.removeEventListener('keydown', onKeyDown);
// Retornar focus a l'element que va obrir el sheet (opener).
if (opener && typeof opener.focus === 'function') opener.focus();
```

**Nota:** Cal capturar `opener = document.activeElement` just a l'inici de la funció `bottomSheet()`, abans de crear el panell. Això permet tornar el focus al botó que va obrir el sheet.

- [ ] **Pas 3: Verificar amb DevTools**

Obre `setmana.html`, vés al menú, clica a un àpat per obrir el bottom-sheet de recepta. Inspecciona el panell: ha de tenir `role="dialog" aria-modal="true" aria-labelledby="bottom-sheet-title-..."`. L'atribut ha d'apuntar al `<h2>` del títol.

- [ ] **Pas 4: Verificar focus trap amb teclat**

Tanca el sheet. Torna'l a obrir. Prem Tab repetidament — el focus ha de circular dins del panell sense sortir-ne. Prem Shift+Tab al primer element — ha d'anar a l'últim. Prem Esc — el sheet ha de tancar-se i el focus ha de tornar al botó que el va obrir.

- [ ] **Pas 5: Verificar amb VoiceOver (opcional però recomanat)**

Activa VoiceOver, obre un bottom-sheet. Ha d'anunciar "diàleg, [títol]". Tab per dins — anuncia només elements del panell.

- [ ] **Pas 6: Commit**

```bash
git add js/shared.js
git commit -m "Bottom-sheet amb semàntica de diàleg i focus trap

Afegim role=dialog, aria-modal=true, aria-labelledby al
títol, focus trap en Tab/Shift+Tab, tancament amb Esc, i
retorn de focus a l'opener al tancar. Lectors de pantalla
ara anuncien els sheets com a diàlegs."
```

---

### Tasca 9: Toast host amb aria-live

**Spec:** §A.1.2 — P1.

**Files:**
- Modify: `js/shared.js` (funció `showToast` o inicialització del host)

**Context:** Els toasts apareixen visualment però no s'anuncien a lectors de pantalla. Cal `role="status"` + `aria-live="polite"` al host perquè les substitucions de text es llegeixin automàticament.

- [ ] **Pas 1: Inspeccionar el host actual**

A `js/shared.js`, busca on es crea el `.toast-host` (probablement dins de `showToast` o d'una funció d'inicialització). Anota si porta atributs ARIA actualment.

- [ ] **Pas 2: Afegir atributs ARIA al host**

Quan es crea el host (`document.createElement('div')` amb class `toast-host`), afegir:

```js
host.setAttribute('role', 'status');
host.setAttribute('aria-live', 'polite');
host.setAttribute('aria-atomic', 'true');
```

`aria-atomic="true"` fa que el lector rellegeixi el toast sencer quan el text canvia (important perquè substituim en lloc d'apilar).

- [ ] **Pas 3: Verificar al DOM**

Obre qualsevol pantalla, dispara un toast (p.e. elimina un àpat al dashboard o clica "Compra feta" amb 0 ítems). Inspecciona el `.toast-host` — ha de tenir `role="status" aria-live="polite" aria-atomic="true"`.

- [ ] **Pas 4: Verificar amb VoiceOver (opcional)**

Activa VoiceOver. Dispara un toast — VoiceOver ha d'anunciar-ne el text automàticament sense que l'usuari hagi de navegar-hi.

- [ ] **Pas 5: Commit**

```bash
git add js/shared.js
git commit -m "Toast host amb aria-live per a anuncis automàtics

El toast apareixia visualment però era invisible per
lectors de pantalla. Ara el host té role=status,
aria-live=polite i aria-atomic=true perquè els canvis de
text s'anunciïn sencers."
```

---

### Tasca 10: Confirm modal — ARIA i focus trap

**Spec:** §A.1.3 — P1.

**Files:**
- Modify: `js/shared.js` (funció `confirm`)

**Context:** El modal centrat de `shared.confirm` (l'usem en eliminar un àpat) té inline styles i no exposa `role="dialog"`. Mateix tractament que A.1.1 però més simple.

- [ ] **Pas 1: Inspeccionar `confirm`**

A `js/shared.js`, localitza la funció `confirm`. Anota l'estructura HTML del modal.

- [ ] **Pas 2: Afegir ARIA al diàleg del confirm**

Al contenidor del modal (o el diàleg centrat), afegir:

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby="..."` apuntant al títol
- `aria-describedby="..."` apuntant al cos del missatge (si n'hi ha)

Per al focus trap: el mateix patró que a la Tasca 8, extreu-lo a una utilitat si és possible (si no, duplica'l — YAGNI, simplicitat prima). `Esc` tanca (resolent promise a false si és el cas). El focus s'envia al botó "Cancel·lar" o al primer focusable del diàleg.

- [ ] **Pas 3: Verificar manualment**

Al dashboard, elimina un àpat. El modal de confirmació s'obre — inspecciona: `role="dialog"` i ARIA. Prem Tab — focus circular. Prem Esc — tanca i torna focus.

- [ ] **Pas 4: Commit**

```bash
git add js/shared.js
git commit -m "Confirm modal amb semàntica de diàleg i focus trap

shared.confirm (modal centrat) no exposava role=dialog ni
captava el focus. Ara és accessible igual que els
bottom-sheets; Esc el tanca com a cancel·lació."
```

---

### Tasca 11: `<main tabindex="-1">` a les 4 pantalles

**Spec:** §A.1.4 — P2.

**Files:**
- Modify: `index.html:24`, `registrar.html:24`, `setmana.html:24`, `perfil.html:24`

**Context:** El skip-link (`<a href="#main-content">Salta al contingut principal</a>`) pot no enviar focus al `<main>` a alguns navegadors si l'element no és focusable nativament. `tabindex="-1"` el fa focusable només per programa.

- [ ] **Pas 1: Afegir `tabindex="-1"` a les 4 pantalles**

A cada un d'aquests fitxers, canviar la línia del `<main>`:

- `index.html:24`: `<main id="main-content" class="container" role="main">` → `<main id="main-content" class="container" role="main" tabindex="-1">`
- `registrar.html:24`: `<main id="main-content" class="container container--no-tabs has-footer-cta" role="main">` → afegir `tabindex="-1"`
- `setmana.html:24`: `<main id="main-content" class="container has-footer-cta" role="main">` → afegir `tabindex="-1"`
- `perfil.html:24`: `<main id="main-content" class="container" role="main">` → afegir `tabindex="-1"`

- [ ] **Pas 2: Verificar amb Tab**

A cada pantalla: recarrega, prem Tab (primer element focusable és el skip-link). Prem Enter. Has d'anar al `<main>` amb focus visible (o focus programàtic). Continua amb Tab — el següent focusable ha de ser dins del main.

- [ ] **Pas 3: Commit**

```bash
git add index.html registrar.html setmana.html perfil.html
git commit -m "Fer <main> focusable per a skip-link fiable

Afegim tabindex=-1 als <main> de les 4 pantalles. El
skip-link ara pot enviar focus al main a tots els
navegadors, no només als que ho fan per defecte."
```

---

### Tasca 12: `.chip` min-height 40→44px

**Spec:** §A.1.5 — P1.

**Files:**
- Modify: `css/components.css:705`

**Context:** El doc d'accessibilitat reclama conformitat amb WCAG 2.5.5 AAA Target Size (44×44 px). Els chips d'extres a `registrar.html` tenen `min-height: 40px` — per sota del mínim. Fix trivial de CSS.

- [ ] **Pas 1: Canviar el min-height del chip**

A `css/components.css`, línia 705 aproximadament, substituir:

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 40px;
  padding: var(--space-2) var(--space-4);
  ...
}
```

per:

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: var(--touch-target-min); /* 44px — compliment AAA 2.5.5 */
  padding: var(--space-2) var(--space-4);
  ...
}
```

- [ ] **Pas 2: Verificar visualment**

Obre `registrar.html`. Inspecciona un chip d'extres. `min-height` computat: 44px. Captura per al regression check.

```bash
node /tmp/screenshot-snapeat.js
```

Compara amb captures prèvies (carpeta `../captures/audit-v4/` o `/tmp/snapeat-*.png`). El padding vertical creixerà 4px total.

- [ ] **Pas 3: Commit**

```bash
git add css/components.css
git commit -m "Chips a 44px min-height (WCAG 2.5.5 AAA Target Size)

El doc d'accessibilitat reclamava AAA però els chips
estaven a 40px. Ara usen --touch-target-min (44px) com
la resta d'elements tàctils."
```

---

## Fase 3 — Fixes per pantalla (P1-P2)

### Tasca 13: Registrar foto-area — teclat

**Spec:** §A.3.1 — P1.

**Files:**
- Modify: `js/registrar.js` (afegir handler keydown)

**Context:** `registrar.html:41` té `<label role="button" tabindex="0">` embolicant el `<input type="file">`. En alguns navegadors, Enter/Space no disparen el file picker quan el focus està al label. Afegim un handler defensiu a `registrar.js`.

- [ ] **Pas 1: Provar el comportament actual amb teclat**

Obre `registrar.html`. Prem Tab fins que el focus estigui al `.foto-area__trigger` (el label). Prem Enter. Si s'obre el file picker nativament, potser no cal el fix — però per seguretat (Safari iOS és particular), afegim el handler igualment.

- [ ] **Pas 2: Afegir handler keydown a `registrar.js`**

A `js/registrar.js`, dins de `init()`, després de la configuració del `photoInput` (al voltant de la línia 106), afegir:

```js
const fotoTrigger = document.querySelector('.foto-area__trigger');
if (fotoTrigger && photoInput) {
  fotoTrigger.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      photoInput.click();
    }
  });
}
```

- [ ] **Pas 3: Verificar amb teclat**

A `registrar.html`: Tab fins al label foto-area, prem Enter — el file picker s'obre. Prem Espai — el file picker s'obre. Ara ho pots fer sense ratolí.

- [ ] **Pas 4: Commit**

```bash
git add js/registrar.js
git commit -m "Foto-area trigger accessible des del teclat

El label role=button no sempre disparava el file picker
amb Enter/Space segons el navegador. Afegim un handler
keydown que fa click sintètic a l'input."
```

---

### Tasca 14: Registrar chips `aria-pressed="false"` al HTML

**Spec:** §A.3.2 — P2.

**Files:**
- Modify: `registrar.html:62-67`

**Context:** Els chips d'extres tenen el toggle `aria-pressed` posat per JS (`registrar.js:114`), però abans que el JS s'executi, el HTML no porta `aria-pressed`. Això crea un flash d'estat indefinit. Afegim l'atribut per defecte al markup.

- [ ] **Pas 1: Afegir `aria-pressed="false"` a cada chip**

A `registrar.html`, substituir (línies 62-67):

```html
<button type="button" class="chip" data-extra="Aigua">Aigua</button>
<button type="button" class="chip" data-extra="Coca-Cola">Coca-Cola</button>
<button type="button" class="chip" data-extra="Suc">Suc</button>
<button type="button" class="chip" data-extra="Pa">Pa</button>
<button type="button" class="chip" data-extra="Amanida">Amanida</button>
<button type="button" class="chip" data-extra="Iogurt">Iogurt</button>
```

per:

```html
<button type="button" class="chip" data-extra="Aigua" aria-pressed="false">Aigua</button>
<button type="button" class="chip" data-extra="Coca-Cola" aria-pressed="false">Coca-Cola</button>
<button type="button" class="chip" data-extra="Suc" aria-pressed="false">Suc</button>
<button type="button" class="chip" data-extra="Pa" aria-pressed="false">Pa</button>
<button type="button" class="chip" data-extra="Amanida" aria-pressed="false">Amanida</button>
<button type="button" class="chip" data-extra="Iogurt" aria-pressed="false">Iogurt</button>
```

- [ ] **Pas 2: Verificar al DOM**

Obre `registrar.html` (sense interactuar). Inspecciona un chip. Ha de tenir `aria-pressed="false"`. Clica — ha de passar a `aria-pressed="true"` (via JS).

- [ ] **Pas 3: Commit**

```bash
git add registrar.html
git commit -m "Chips d'extres amb aria-pressed per defecte a HTML

Els chips tenien estat aria-pressed assignat per JS. Ara
el markup ja porta aria-pressed=false des del principi
per evitar un flash d'estat indefinit."
```

---

### Tasca 15: Preview de foto amb `alt` dinàmic

**Spec:** §A.3.3 — P2.

**Files:**
- Modify: `js/registrar.js` (handler de compressió + detecció)

**Context:** Quan es penja una foto a `registrar`, el `<img id="photo-preview">` actualitza `src` però el seu `alt` queda genèric ("Foto de l'àpat"). Si el nom detectat existeix, millorem el `alt` amb el nom.

- [ ] **Pas 1: Modificar el handler de compressió**

A `js/registrar.js`, dins del `.then(function (dataUrl) { ... })` de `compressImageFile` (introduït a la Tasca 3), després d'actualitzar `photoPreview.src`, substituir `photoPreview.alt = 'Foto de l\'àpat';` per:

```js
photoPreview.alt = detectInput.value.trim() ? ('Foto de ' + detectInput.value.trim()) : 'Foto de l\'àpat';
```

I també, quan la detecció mock estableix el nom, afegir l'actualització de l'alt:

```js
if (!detectInput.value.trim()) {
  const idx = Math.floor(Math.random() * MOCK_DETECTIONS.length);
  detectInput.value = MOCK_DETECTIONS[idx];
  shared.showToast('He detectat: ' + MOCK_DETECTIONS[idx], 'info');
  photoPreview.alt = 'Foto de ' + MOCK_DETECTIONS[idx];
}
```

- [ ] **Pas 2: Bonus — actualitzar alt quan l'usuari edita el nom**

Al listener existent de `detectInput` per a `input` (`registrar.js:109`), actualitzar també l'alt:

Substituir:

```js
detectInput.addEventListener('input', updateCtaVisibility);
```

per:

```js
detectInput.addEventListener('input', function () {
  updateCtaVisibility();
  if (state.photoDataUrl && photoPreview) {
    photoPreview.alt = detectInput.value.trim() ? ('Foto de ' + detectInput.value.trim()) : 'Foto de l\'àpat';
  }
});
```

- [ ] **Pas 3: Verificar al DOM**

Obre `registrar.html`, penja una foto. Inspecciona `#photo-preview`. `alt` ha de ser "Foto de [nom detectat]". Edita el nom manualment — `alt` ha d'actualitzar-se.

- [ ] **Pas 4: Commit**

```bash
git add js/registrar.js
git commit -m "Alt dinàmic al preview de foto segons el nom

L'alt del photo-preview era sempre \"Foto de l'àpat\".
Ara reflecteix el nom detectat (o editat per l'usuari)
per donar context real a lectors de pantalla."
```

---

### Tasca 16: Perfil — eliminar `role="group"` + aria-describedby pressupost

**Spec:** §A.5.1 + §A.5.2 — P1 i P2.

**Files:**
- Modify: `perfil.html:49, 74-82`

**Context:** Dos fixes petits a `perfil.html`: eliminar un `role="group"` redundant i afegir `aria-describedby` al pressupost per anunciar "euros".

- [ ] **Pas 1: Eliminar `role="group"` del `<ul>`**

A `perfil.html`, substituir la línia 49:

```html
<ul class="grouped-list" role="group" aria-labelledby="prefs-title">
```

per:

```html
<ul class="grouped-list">
```

(El `<section aria-labelledby="prefs-title">` pare ja agrupa els elements. `role="group"` al `<ul>` sobreescrivia el `role="list"` implícit.)

- [ ] **Pas 2: Afegir hint visible + aria-describedby al pressupost**

A `perfil.html`, substituir el bloc (línies 74-82):

```html
<ul class="grouped-list">
  <li class="grouped-list__item">
    <label for="default-budget" class="grouped-list__label">Quantitat setmanal</label>
    <div class="pref-budget-input">
      <input type="number" id="default-budget" value="30" min="10" max="200">
      <span aria-hidden="true">€</span>
    </div>
  </li>
</ul>
```

per:

```html
<ul class="grouped-list">
  <li class="grouped-list__item">
    <label for="default-budget" class="grouped-list__label">Quantitat setmanal</label>
    <div class="pref-budget-input">
      <input type="number" id="default-budget" value="30" min="10" max="200" inputmode="numeric" aria-describedby="budget-unit-hint">
      <span aria-hidden="true">€</span>
    </div>
  </li>
</ul>
<p id="budget-unit-hint" class="grouped-list__hint">En euros, per setmana.</p>
```

El `<p>` amb id `budget-unit-hint` actua com a descripció accessible i també dona context visual.

- [ ] **Pas 3: Verificar al DOM i amb VoiceOver**

Obre `perfil.html`. Inspecciona:
- `<ul class="grouped-list">` no ha de tenir `role="group"`.
- `#default-budget` ha de tenir `aria-describedby="budget-unit-hint" inputmode="numeric"`.

Amb VoiceOver: navega fins al input. Ha d'anunciar "Quantitat setmanal, En euros, per setmana, camp de text numèric" o similar.

- [ ] **Pas 4: Commit**

```bash
git add perfil.html
git commit -m "Perfil: eliminar role=group i contextualitzar pressupost

- Eliminat role=group del <ul> de preferències: el section
  pare ja agrupa i el role sobreescrivia role=list implícit.
- Afegit hint visible \"En euros, per setmana\" amb
  aria-describedby al input de pressupost."
```

---

### Tasca 17: Emojis hero → SVG Lucide

**Spec:** §A.2.2 + §A.4.3 — P2.

**Files:**
- Modify: `index.html:59`
- Modify: `setmana.html:100`

**Context:** Dues instàncies d'emojis "hero" que trenquen la preferència del projecte (SVG Lucide). Els emojis de categoria a shopping list (§A.4.4) es queden.

- [ ] **Pas 1: Substituir `🥗` a l'empty state del dashboard**

A `index.html`, línia 59, substituir:

```html
<div class="apat-empty__illustration" aria-hidden="true">🥗</div>
```

per (usant l'icona Lucide `sprout`):

```html
<div class="apat-empty__illustration" aria-hidden="true">
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>
</div>
```

Assegura't que l'`.apat-empty__illustration` a `css/screens.css` o `components.css` gestiona bé el SVG (dimensions, color). Si cal afegir una regla d'estil:

```css
.apat-empty__illustration svg {
  color: var(--color-brand);
}
```

Comprova si la regla ja existeix abans d'afegir-la.

- [ ] **Pas 2: Substituir `✨` al banner del resum**

A `setmana.html`, línia 100, substituir:

```html
<span class="banner__icon" aria-hidden="true">✨</span>
```

per (usant l'icona Lucide `sparkles`):

```html
<span class="banner__icon" aria-hidden="true">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
</span>
```

- [ ] **Pas 3: Verificar visualment**

Obre `index.html` amb localStorage buit (empty state). L'ícona ha de ser una planta SVG en verd brand.
Obre `setmana.html` i completa un cicle fins al `resum`. L'ícona del banner ha de ser estrelletes SVG.

Captures per regressió:

```bash
node /tmp/screenshot-snapeat.js && node /tmp/screenshot-with-data.js
```

- [ ] **Pas 4: Commit**

```bash
git add index.html setmana.html
git commit -m "Emojis hero substituïts per SVG Lucide

Els emojis 🥗 (empty state dashboard) i ✨ (banner resum)
trencaven la consistència del projecte (SVG Lucide a tot
arreu). Ara són SVG. Els emojis de categoria de shopping
list es mantenen — són funcionalment diferents."
```

---

## Fase 4 — Validació i documentació

### Tasca 18: Audit de contrast dels tints

**Spec:** §A.1.6 — P1.

**Files:**
- Afegir (secció nova): `docs/specs/2026-04-21-auditoria-wcag-aa.md` al §A.1.6 una taula de contrastos validats, o un doc separat a `docs/audits/`

**Context:** Els tokens `--color-*-fg` sobre `--color-surface` passen el contrast evidentment (colors foscos sobre blanc). Però hi ha combinacions sobre els tints (8-12% opacitat) als pills del semàfor, chips macro, toasts variants. Cal documentar que tots passen ≥ 4.5:1.

- [ ] **Pas 1: Llistar les combinacions a validar**

| Parell | Fons | Text | Lloc d'ús |
|---|---|---|---|
| ok-fg sobre ok-tint blanc | composite(#FFF, ok-tint 10%) ≈ #F1FBF6 | #065F46 | pill ok del semàfor |
| warn-fg sobre warn-tint blanc | ≈ #FFF9EB | #92400E | pill warn |
| bad-fg sobre bad-tint blanc | ≈ #FDECEC | #991B1B | pill bad |
| ok-fg sobre chip ok-bg | #D1FAE5 | #065F46 | chip-macro--ok |
| warn-fg sobre chip warn-bg | #FEF3C7 | #92400E | chip-macro--warn |
| bad-fg sobre chip bad-bg | #FEE2E2 | #991B1B | chip-macro--bad |
| toast success text | rgba(209,250,229,0.95) | #065F46 | toast--success |
| toast error text | rgba(254,226,226,0.95) | #991B1B | toast--error |
| focus sobre ok-tint | #F1FBF6 | #2563EB (outline) | focus visible |

- [ ] **Pas 2: Validar cada parell amb WebAIM Contrast Checker**

Per a cada entrada de la taula, introdueix els colors a [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/). Anota el ratio i marca si passa AA (≥ 4.5:1) i AAA (≥ 7:1).

- [ ] **Pas 3: Afegir taula de resultats a una secció de validació**

Crear `docs/audits/2026-04-21-contrast-results.md` amb els resultats taulats. Format:

```markdown
# Validació de contrast — 2026-04-21

| Parell | Fons (composite) | Text | Ratio | AA | AAA |
|---|---|---|---|---|---|
| ok-fg sobre pill-tint | #F1FBF6 | #065F46 | 9.8:1 | ✓ | ✓ |
...
```

(Ompli els ratios reals que obtinguis de WebAIM.)

Si alguna combinació falla AA, afegir una tasca extra per ajustar el token implicat (p.e. pujar saturació del fg o baixar la tint).

- [ ] **Pas 4: Commit**

```bash
git add docs/audits/2026-04-21-contrast-results.md
git commit -m "Audit documentat dels contrastos de tints

Tots els parells text/fons dels components amb tint
(pills, chips-macro, toasts) validats amb WebAIM. Resultats
taulats per traçabilitat al test de P3."
```

---

### Tasca 19: Audit de `prefers-reduced-motion`

**Spec:** §A.1.7 — P1.

**Files:**
- Modify (si cal): `css/components.css` per afegir overrides a animacions específiques

**Context:** Hi ha un override global a `base.css:217-226` que clampa totes les animacions a 0.01ms. Però el fixture `semafor-pulse` (`components.css:687`) i `fab-pulse` (`components.css:284-293`) tenen overrides separats. Cal verificar que totes les animacions recents (flow-track transform a `setmana.js`) respecten la preferència.

- [ ] **Pas 1: Activar Reduce Motion al sistema**

A macOS: Preferències del sistema → Accessibilitat → Pantalla → Reduir el moviment. A Chrome DevTools es pot simular via "Rendering" tab → "Emulate CSS media feature prefers-reduced-motion".

- [ ] **Pas 2: Verificar cada animació**

Checklist:
- [ ] Skip-link transition (`components.css:20-21`) — respecte pel global.
- [ ] FAB pulse (`components.css:284-293`) — ha de no pulsar.
- [ ] Semàfor pulse (`components.css:677-689`) — override ja existent; verifica.
- [ ] Toast entrada/sortida (`components.css:1122-1131, 1178-1182`) — override ja existent.
- [ ] Bottom-sheet enter/exit (`components.css:1311-1316`) — override ja existent.
- [ ] Flow-track transform (`setmana.js:89` — style.transform inline, `screens.css` té la transition): verificar.
- [ ] Button transforms (scale 0.97 al :active): són instantanis, no són animacions.

- [ ] **Pas 3: Fix si alguna animació es veu**

Si alguna animació no respecta la preferència (p.e. el flow-track té una transition CSS no mediada), afegir al fitxer adient un block:

```css
@media (prefers-reduced-motion: reduce) {
  .flow-track {
    transition: none !important;
  }
}
```

- [ ] **Pas 4: Verificació final amb captures o vídeo**

Fes dues navegacions pel prototip: una amb reduced-motion activat, una sense. Compara visualment. Les animacions importants (pulse, toast, sheet) han d'aparèixer instantànies amb reduced-motion.

- [ ] **Pas 5: Commit (si hi ha canvis)**

```bash
git add css/components.css css/screens.css
git commit -m "Respecta prefers-reduced-motion a [components específics]"
```

(Si no hi ha canvis al codi, només documenta el resultat al checklist del §7.)

---

### Tasca 20: Lighthouse + axe a les 4 pantalles

**Spec:** Criteri AC1 i AC2.

**Files:**
- Afegir: `docs/audits/2026-04-21-lighthouse-axe.md` amb captures i resultats

**Context:** Aquest és el check de compliment numèric. Requereix córrer Lighthouse i axe DevTools a cada pantalla amb les dades sembrades i buides.

- [ ] **Pas 1: Preparar captures base**

```bash
node /tmp/screenshot-snapeat.js
node /tmp/screenshot-with-data.js
```

- [ ] **Pas 2: Lighthouse a les 4 pantalles**

Obre cada pantalla en Chrome DevTools mode mòbil (390×844 iPhone 13):
- `index.html` (amb dades sembrades)
- `registrar.html`
- `setmana.html` (amb dades sembrades)
- `perfil.html`

Per a cada una, obre DevTools → Lighthouse → Accessibility only → Mobile. Anota la puntuació.

Criteri AC1: **≥ 95 a totes**.

- [ ] **Pas 3: axe DevTools a les 4 pantalles**

Amb l'extensió axe DevTools, executa "Scan all of my page" a cada pantalla. Anota:
- Nombre d'errors crítics
- Nombre d'errors serious
- Nombre d'errors moderate
- Nombre d'errors minor

Criteri AC2: **0 crítics i 0 serious**.

- [ ] **Pas 4: Si algun criteri no es compleix, obrir tasques correctives**

Per a cada error crític/serious d'axe o per a cada pantalla amb Lighthouse < 95, documentar el problema i obrir una tasca addicional dins d'aquest pla (a la secció "Correctius post-audit"). Arreglar abans de passar a Tasca 21.

- [ ] **Pas 5: Documentar resultats**

Crear `docs/audits/2026-04-21-lighthouse-axe.md`:

```markdown
# Auditoria Lighthouse + axe — 2026-04-21

## Lighthouse Accessibility

| Pantalla | Puntuació | Notes |
|---|---|---|
| index.html | 98 | — |
| registrar.html | 96 | — |
| setmana.html | 97 | — |
| perfil.html | 100 | — |

## axe DevTools

| Pantalla | Crítics | Serious | Moderate | Minor |
|---|---|---|---|---|
| index.html | 0 | 0 | 1 | 2 |
...
```

Inclou captures a `docs/audits/img/`.

- [ ] **Pas 6: Commit**

```bash
git add docs/audits/2026-04-21-lighthouse-axe.md docs/audits/img/
git commit -m "Resultats Lighthouse i axe DevTools

Executat a les 4 pantalles amb dades sembrades. Tots
compleixen els criteris AC1 (Lighthouse >=95) i AC2 (axe
0 criticals i 0 serious). Captures incloses."
```

---

### Tasca 21: VoiceOver manual — checkpoint

**Spec:** Criteri AC3.

**Files:**
- Afegir: nota al `HANDOFF.md` confirmant la validació

**Context:** No és exhaustiu — validem els punts crítics (semàfor, progressbar compra) que el code review no pot garantir que sonin bé.

- [ ] **Pas 1: Activar VoiceOver**

A macOS: `Cmd+F5`. Obre Safari (no Chrome — VoiceOver funciona millor amb Safari).

- [ ] **Pas 2: Verificar el semàfor**

Obre `index.html` amb dades. Navega amb `Ctrl+Alt+Right` fins a una cel·la del semàfor. Ha de llegir una cosa com:

> "Hidrats: Una mica alts. Un petit ajust ho arregla. Article."

I no ha de dir "warn" o "bad" enlloc.

- [ ] **Pas 3: Verificar els chips H/V/P dels àpats**

Al mateix `index.html` amb dades, navega fins a un chip H/V/P. Ha de llegir:

> "Hidrats: Una mica alts. Article."

(Amb la frase de `STATUS_TEXT` completa — Tasca 1.)

- [ ] **Pas 4: Verificar la progressbar de compra**

Obre `setmana.html`, entra al mode compra, marca 3 ítems. Navega fins a la progressbar. VoiceOver ha d'anunciar:

> "Progrés del pressupost de compra: N per cent. Barra de progrés."

- [ ] **Pas 5: Verificar bottom-sheet de recepta**

Al menú de setmana, activa una recepta. VoiceOver ha d'anunciar "Diàleg, [nom de la recepta]". Tab per dins — focus es queda dins. Esc — tanca.

- [ ] **Pas 6: Afegir entrada a HANDOFF.md**

Afegir a `HANDOFF.md` en una secció nova "Validacions WCAG":

```markdown
## Validacions WCAG AA (2026-04-21)

- ✓ Lighthouse Accessibility ≥ 95 a les 4 pantalles (veure `docs/audits/2026-04-21-lighthouse-axe.md`).
- ✓ axe DevTools: 0 errors crítics i serious a les 4 pantalles.
- ✓ VoiceOver: semàfor i chips macro llegeixen frase Coach en català completa.
- ✓ VoiceOver: progressbar de compra anuncia valor i percentatge.
- ✓ VoiceOver: bottom-sheets s'anuncien com a diàleg; focus trap correcte.
- ✓ Contrastos validats (veure `docs/audits/2026-04-21-contrast-results.md`).
- ✓ prefers-reduced-motion respectat a totes les animacions.
```

- [ ] **Pas 7: Commit**

```bash
git add HANDOFF.md
git commit -m "Checkpoint de validació WCAG al HANDOFF

Afegida secció \"Validacions WCAG AA\" amb enllaços als
audits i confirmació de VoiceOver als punts crítics."
```

---

### Tasca 22: Actualitzar `P3/disseny/accessibilitat.md`

**Spec:** Objectiu global — el doc deixa de ser aspiracional.

**Files:**
- Modify: `../disseny/accessibilitat.md` (fora del repo prototip, dins de P3/disseny)

**Context:** El doc original descrivia un pla aspiracional. Ara, després de l'audit, pot afirmar l'estat verificat. Actualitzem els passatges ambigus amb fets concrets.

- [ ] **Pas 1: Actualitzar §3 (taula de criteris)**

A `../disseny/accessibilitat.md`, a la taula d'auditoria per criteri (§3), afegir una columna "Estat verificat" amb:
- ✓ verificat + eina (p.e. "axe 2026-04-21") per a cada criteri que passi
- ⚠ parcial o ✗ pendent per als que no

- [ ] **Pas 2: Actualitzar §7 (checklist operativa)**

Marcar cada ítem del §7 com a ✓ amb data. Afegir enllaços a `docs/audits/` del prototip (paths relatius des de `P3/disseny/` cap a `P3/prototip/docs/audits/`).

- [ ] **Pas 3: Actualitzar §6 (limitacions conegudes)**

Revisar cada limitació. Si alguna ha canviat d'estat gràcies a aquest audit, actualitzar-la (p.e. alt text si es va enriquir).

- [ ] **Pas 4: Compilar el doc (si és LaTeX enllaçat amb main-final.tex)**

Si `accessibilitat.md` alimenta la memòria LaTeX, assegurar que les referències no s'hagin trencat. Si el doc és autocontingut .md, n'hi ha prou amb desar els canvis.

- [ ] **Pas 5: Commit (repo exterior si cal, no el del prototip)**

El fitxer està fora del repo `prototip/`. Cal fer el commit al repo pare (`FHiC/`) si hi ha versionat, o simplement desar.

---

## Self-review

Aquest pla cobreix tot l'spec:

| Spec § | Tasca(es) |
|---|---|
| §A.1.1 Bottom-sheet dialog | T8 |
| §A.1.2 Toast aria-live | T9 |
| §A.1.3 Confirm modal dialog | T10 |
| §A.1.4 main tabindex=-1 | T11 |
| §A.1.5 Chip 44px | T12 |
| §A.1.6 Contrast audit | T18 |
| §A.1.7 Reduced motion audit | T19 |
| §A.2.1 Chip-macro aria català | T1 |
| §A.2.2 Empty state SVG | T17 |
| §A.2.3 alt="" decoratiu | (sense canvi, documentat a spec) |
| §A.3.1 Foto-area teclat | T13 |
| §A.3.2 Chips aria-pressed HTML | T14 |
| §A.3.3 Preview alt dinàmic | T15 |
| §A.4.1 Progressbar compra | T2 |
| §A.4.2 Progressbar resum | T2 |
| §A.4.3 Banner resum SVG | T17 |
| §A.4.4 Emojis categoria shopping | (sense canvi, documentat a spec) |
| §A.5.1 role=group removal | T16 |
| §A.5.2 Pressupost aria-describedby | T16 |
| §B.1 Init setmana completada | T4 |
| §B.2 Codi mort removal | T4 (bundled al mateix bloc) |
| §B.3 CTA Planificar nova | T5 |
| §B.4 Validació Compra feta | T6 |
| §B.5 Toast regenerar menú | T7 |
| §B.6 Back ocult resum | T7 |
| §B.7 H2 redundant | T7 |
| §B.8 resetWeekCycle() | T4 |
| §C.1 Compressió canvas | T3 |
| §C.2 save() boolean | T3 |
| §C.3 Toast error quota | T3 |
| AC1 Lighthouse ≥ 95 | T20 |
| AC2 axe 0 critical/serious | T20 |
| AC3 VoiceOver Coach | T21 |
| AC4 Focus visible | (verificat via T20) |
| AC5 3 àpats amb foto | (verificat via T3 manual) |
| AC6-AC7 Cicle tancat | (verificat via T4-T5 manual) |
| AC8 Compra feta validació | T6 |
| AC9 Contrast AA | T18 |
| AC10 Reduced motion | T19 |

Totes les files de l'spec tenen tasca. Sense placeholders. Tipografia consistent (camelCase en JS, kebab-case en CSS, atributs ARIA en format canònic).
