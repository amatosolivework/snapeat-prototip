# Auditoria WCAG 2.1 AA global + fixes d'integritat del prototip

**Data:** 2026-04-21
**Estat:** Spec acordat amb Alex al brainstorming del 2026-04-21
**Àmbit:** Tot el prototip (4 pantalles + flows dinàmics) + bugs que invaliden el test d'usabilitat
**Spec previ relacionat:** `2026-04-20-redisseny-avui.md` — §7 d'aquell doc ja anunciava que l'auditoria global anava a part

---

## 1. Context i problema

El prototip ha anat iterant-se en cicles curts (audit-v3, audit-v4, flow horitzontal, redisseny Avui) mentre l'accessibilitat s'ha anat consolidant de manera oportunista. El doc `P3/disseny/accessibilitat.md` descriu un objectiu WCAG 2.1 AA amb 20 criteris, però la seva checklist no s'ha executat de manera sistemàtica contra el codi real. A més, durant l'últim sprint s'han detectat **dos bugs de flow** que no són estrictament d'accessibilitat però que **trencarien el test d'usabilitat amb ≥4 usuaris** previst per P3:

1. El cicle de "La meva setmana" no es tanca: completar una compra i tornar a la pantalla més tard mostra la llista antiga com si encara fos en curs.
2. El registre de múltiples àpats amb fotos reals fa saltar la quota de `localStorage`; el segon àpat no es persisteix i "desapareix" al dashboard.

Aquest spec consolida tot el que cal arreglar abans que el prototip sigui testable. Tres seccions germanes:

- **§A** — auditoria WCAG 2.1 AA pantalla per pantalla.
- **§B** — tancament del cicle "La meva setmana".
- **§C** — integritat del prototip al test real (persistència de fotos).

## 2. Objectius

- El prototip passa **Lighthouse Accessibility ≥ 95** i **axe DevTools amb 0 errors crítics i 0 serious** a les 4 pantalles.
- La Laura pot completar el flow setmana, acabar, i tornar-hi un altre dia sense sentir que l'app "recorda massa" o està trencada.
- La Laura pot registrar 3+ àpats amb foto al llarg del dia i veure'ls tots al dashboard.
- El doc `P3/disseny/accessibilitat.md` deixa de ser aspiracional i passa a descriure l'estat verificat del codi.

## 3. Abast

**Dins:**
- Les 4 pantalles HTML (`index.html`, `registrar.html`, `setmana.html`, `perfil.html`) i els seus JS associats.
- Els components compartits a `shared.js` (bottom-sheet, toast, confirm) i tots els CSS (`base.css`, `components.css`, `layout.css`, `screens.css`, `variables.css`).
- Els bugs de flow descrits a §B i §C.

**Fora** (vegeu §13):
- Actualitzar `P3/disseny/accessibilitat.md`. Es fa al final, amb resultats reals.
- Canvis de copy, redisseny d'elements, afegir pantalles noves.

## 4. Estratègia de verificació

Tres capes, aplicables per pantalla:

1. **Code review estàtic + captures Playwright**. Validació de DOM (aria-labels, roles, landmarks, focus order) i estats visuals (focus, hover, empty states).
2. **Lighthouse Accessibility + axe DevTools** a cada pantalla. Criteris d'acceptance numèrics.
3. **VoiceOver manual** puntual, només a moments crítics: llegir el semàfor, escoltar l'anunci post-registre, progressbar de compra. No és preceptiu component per component.

Eines: WebAIM Contrast Checker per a validació de contrast. Ordinador de test: Safari + VoiceOver a macOS. Chrome DevTools per a axe/Lighthouse.

---

## §A — Auditoria WCAG 2.1 AA global

Organitzat per pantalla perquè la implementació serà pantalla per pantalla. Cada ítem porta tag de prioritat:

- **P0** — bloquejant, impacte directe a l'experiència o trenca un criteri que el doc ja reclamava complir.
- **P1** — important, millora clara.
- **P2** — polish.

### A.1 Global (shared.js, components.css, base.css)

| ID | Prioritat | Ítem | Verificació |
|---|---|---|---|
| A.1.1 | P1 | `shared.bottomSheet()`: panell amb `role="dialog"` + `aria-modal="true"` + `aria-labelledby` apuntant al títol. Focus trap a dins del panell. `Esc` tanca. Tap al backdrop tanca (mantenir el comportament actual si ja existeix). | VoiceOver ha d'anunciar "diàleg" al obrir. Tab-cycling no surt del panell. |
| A.1.2 | P1 | `shared.showToast()`: el host ha de tenir `role="status"` + `aria-live="polite"`. Les substitucions de toast no trenquen l'anunci. | VoiceOver llegeix automàticament el toast quan apareix. |
| A.1.3 | P1 | `shared.confirm()` (modal centrat): igual que A.1.1 si encara és modal centrat; si es migra a bottom-sheet, hereta A.1.1. | Inspecció DOM + VoiceOver. |
| A.1.4 | P2 | `<main>` de les 4 pantalles: afegir `tabindex="-1"` perquè el skip-link pugui enviar-hi focus a tots els navegadors. | Tab + Enter al skip-link → focus va a `<main>`. |
| A.1.5 | P1 | `.chip` (`components.css:701`): pujar `min-height` de 40px a 44px. | Chrome DevTools (inspeccionar mida tàctil). |
| A.1.6 | P1 | Audit de contrast dels tints amb WebAIM: `ok-fg`/`warn-fg`/`bad-fg` sobre `surface` i sobre els respectius tints 8-12%. Documentar els parells validats. | WebAIM Contrast Checker, ≥ 4.5:1 (text petit). |
| A.1.7 | P2 | `prefers-reduced-motion`: revisar que cap animació afegida recentment escapa del reset global (`base.css:217`). Auditar `semafor-pulse`, `fab-pulse`, `flow-track transform`. | Safari amb Reduce Motion activat. |

### A.2 Avui (index.html + dashboard.js)

| ID | Prioritat | Ítem | Verificació |
|---|---|---|---|
| A.2.1 | P0 | `dashboard.js:194` — chips macro H/V/P: l'`aria-label` actual és `"Hidrats: warn"` (anglès). Substituir per `STATUS_TEXT[c.key][st]` en català (ja existeix a la mateixa funció a la línia 17). | Inspecció DOM + VoiceOver. |
| A.2.2 | P2 | Empty state `🥗` (`index.html:59`) → SVG Lucide (`sprout` o similar). | Captura + render. |
| A.2.3 | P2 | `dashboard.js:165-169` — `alt=""` a `apat-card__foto`: deixar com està (decoratiu, el H3 adjacent porta el nom). Documentat com a decisió. | Sense canvi, només referenciat al doc final. |

### A.3 Registrar (registrar.html + registrar.js)

| ID | Prioritat | Ítem | Verificació |
|---|---|---|---|
| A.3.1 | P1 | `registrar.html:41` — `<label role="button" tabindex="0">` disparant l'input de foto: verificar que `Enter`/`Space` disparen el file picker a Safari iOS. Si no, afegir handler `keydown` a `registrar.js` que faci click sintètic al `photoInput`. | Prova manual amb teclat sense ratolí. |
| A.3.2 | P2 | Chips d'extres (`registrar.html:62-68`): `registrar.js:114` ja posa `aria-pressed` al render inicial, però els chips al HTML estàtic no porten `aria-pressed="false"` per defecte. Afegir-lo a l'HTML evita un flash d'estat indefinit abans que el JS s'executi. | Inspecció DOM amb JS desactivat. |
| A.3.3 | P2 | `<img id="photo-preview" alt="...">` (`registrar.html:48`): quan es carrega la foto, actualitzar `alt` amb `"Foto de " + detectedName` per consistència amb el mode edit (que ja ho fa). | Inspecció DOM després d'upload. |

### A.4 Setmana (setmana.html + setmana.js)

| ID | Prioritat | Ítem | Verificació |
|---|---|---|---|
| A.4.1 | P0 | `setmana.html:82` — `progress-bar` de compra: afegir `role="progressbar" aria-valuemin="0" aria-valuemax="100"` a l'HTML. `setmana.js:529` ja posa `aria-valuenow`, conservar. | Inspecció DOM + VoiceOver. |
| A.4.2 | P1 | `setmana.html:95` — `progress-bar` de resum: unificar amb A.4.1 (els atributs a l'HTML, no afegir-los per JS a `onAcabar`). | Inspecció DOM. |
| A.4.3 | P2 | `setmana.html:100` — `✨` banner resum → SVG Lucide (`sparkles`). | Captura. |
| A.4.4 | P2 | Emojis categoria a `CATEGORY_ICON` (`setmana.js:411`) `🥬 🍗 🥛 🌾 🛒`: els deixem — són decoratius (`aria-hidden="true"`) i canvien el registre tipogràfic de llistes de compra. Documentat com a decisió. | Sense canvi. |

### A.5 Perfil (perfil.html)

| ID | Prioritat | Ítem | Verificació |
|---|---|---|---|
| A.5.1 | P1 | `perfil.html:49` — eliminar `role="group"` del `<ul>`. El `<section aria-labelledby="prefs-title">` ja agrupa; `role="group"` sobreescriu el `role="list"` implícit. | Inspecció DOM. |
| A.5.2 | P2 | Pressupost a `perfil.html:78`: `aria-describedby` cap a un `.hint` amb "Quantitat setmanal en euros", perquè els lectors anunciïn la unitat. | VoiceOver llegint l'input. |

---

## §B — Tancament del cicle "La meva setmana"

El flow actual es queda obert: l'usuari pot completar la compra i anar al dashboard, però l'estat persistit no reflecteix "setmana acabada". Aquesta secció tanca el cicle.

### B.1 Detecció de "setmana completada" al init

- A `setmana.js:157-173`, abans de triar el step inicial, comprovar si `savedList && savedList.length && savedList.every(i => i.comprat)`. Si es compleix, anar a `resum` en lloc de `llista`.
- Calcular i pintar el resum com si l'usuari acabés d'arribar-hi (mateixa lògica que `onAcabar`, extreta a una funció `renderResum(list)` reutilitzable).

### B.2 Codi mort

Eliminar el check `params.get('mode') === 'compra'` (`setmana.js:164`) i el branch associat. El query param no s'afegeix enlloc; el branch és inaccessible.

### B.3 Nou CTA "Planificar una setmana nova" al `resum`

- `STEP_META.resum.ctaLabel` passa de `null` a `"Planificar una setmana nova"`.
- Handler nou `onReiniciarCicle()` a `setmana.js`:
  1. Crida a `data.resetWeekCycle()` (funció nova a `data.js`, veure §B.8).
  2. Reseteja l'input de pressupost a `data.getBudget()` (que persisteix, no es toca).
  3. Neteja els `innerHTML` de `menu-setmanal`, `llista-compra`, `productes-compra` per evitar render fantasma en el slide horitzontal.
  4. `goToStep('pressupost')`.
- Cal registrar el handler al mapa de `updateStickyCta()` (`setmana.js:127-133`): afegir `resum: onReiniciarCicle`.
- Preservem el botó "Tornar al dashboard" existent al contingut del step — és una sortida secundària.

### B.4 Validació de "Compra feta"

A `onAcabar()` (`setmana.js:592`), si `list.filter(i => i.comprat).length === 0`, mostrar `shared.showToast('Marca algun producte abans d\'acabar', 'info')` i no fer `goToStep`. Evita resums buits.

### B.5 Confirmació al sobreescriure pla existent

A `onGenerarMenu()` (`setmana.js:180`), si `data.getWeekPlan()` ja retorna alguna cosa, mostrar toast `'Generant un nou menú…'` (informatiu, no bloquejant) abans del `setTimeout`. Elimina sorpresa però no afegeix fricció.

### B.6 Back button ocult al `resum`

A `goToStep()` (`setmana.js:98`), canviar la condició: `refs.stepBack.hidden = (idx === 0 || STEPS[idx] === 'resum')`. El `resum` és un tancament; tornar-hi enrere entra en conflicte amb el nou CTA de reinici.

### B.7 Simplificació del marcatge H2 al `resum`

A `setmana.html:92`, eliminar `<h2 id="resum-title" class="visually-hidden">Compra completada</h2>`. L'H1 dinàmic `#step-title` ja s'actualitza a `"Ben fet!"` via `STEP_META.resum.title`, i el `<section>` pot mantenir `aria-labelledby="step-title"`.

### B.8 Funció `resetWeekCycle()` a data.js

Afegir una funció pública a `data.js` que encapsuli els passos del reset:

```js
function resetWeekCycle() {
  setWeekPlan(null);
  setShoppingList([]);
}
```

Exposar-la al `return { ... }` final del mòdul. És el helper que `onReiniciarCicle()` (§B.3) crida. Preserva el pressupost i les preferències de l'usuari — només neteja el cicle actiu.

---

## §C — Integritat del prototip al test real

Bug de persistència de fotos: el `FileReader.readAsDataURL` genera strings base64 que, amb fotos d'iPhone, superen els ~5 MB de quota del `localStorage`. El segon àpat amb foto falla silenciosament al `save()`.

### C.1 Compressió via canvas

A `registrar.js:85-105`, abans d'assignar `state.photoDataUrl`, passar la imatge per un `<canvas>`:

- **Dimensions màximes:** 1024×1024, preservant aspect ratio.
- **Format:** `canvas.toDataURL('image/jpeg', 0.7)`.
- **Resultat esperat:** ~150-300 KB per foto (vs 3-5 MB abans).
- **Implementació:** funció helper `compressImageDataUrl(file, maxDim, quality)` → `Promise<string>`. Callers: l'`onload` del `FileReader` (substitueix l'assignació directa).

### C.2 Gestió d'error de quota

A `data.js`, `save()` actualment fa `catch { /* silent */ }`. Afegir un retorn booleà:

```js
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (err) { return false; }
}
```

A `addMeal()`, capturar aquest valor. Si és `false`, retornar `null` perquè el caller pugui notificar l'usuari. A `registrar.js`, si `addMeal()` retorna `null`, mostrar `shared.showToast('No hem pogut guardar la foto. Prova d\'eliminar un àpat antic.', 'error')` i no redirigir al dashboard.

### C.3 Transparent per a l'usuari

La compressió no mostra cap UI pròpia (barra de progrés, spinner). En iPhone 13 s'executa en <200ms. La previsualització a `#photo-preview` mostra la imatge comprimida, no l'original — la Laura no nota la diferència visual.

---

## 5. Criteris d'èxit (acceptance)

| # | Criteri | Com es verifica |
|---|---|---|
| AC1 | Lighthouse Accessibility ≥ 95 a `index.html`, `registrar.html`, `setmana.html`, `perfil.html`. | Chrome DevTools Lighthouse, captures com a prova. |
| AC2 | axe DevTools: 0 errors crítics i 0 serious a les 4 pantalles. | Extensió axe, exportar resultats. |
| AC3 | VoiceOver llegeix "Hidrats al punt" / "Una mica alts" als chips macro, mai "ok" / "warn" / "bad". | Prova manual amb VoiceOver a Safari. |
| AC4 | Focus visible 2px a tots els elements interactius: botons, chips, FAB, tabs, inputs, cel·les de check del mode compra, radios dels bottom-sheets. | Navegació amb Tab, captures. |
| AC5 | Registrar 3 àpats seguits amb fotos de càmera reals — tots visibles al dashboard després de tornar. | Prova manual en iPhone. |
| AC6 | Completar cicle setmana i reobrir la pàgina → es mostra el step `resum` amb el CTA "Planificar una setmana nova". | Prova manual. |
| AC7 | Clicar "Planificar una setmana nova" → porta a `pressupost` amb `menu-setmanal`, `llista-compra` i `productes-compra` nets. | Prova manual + inspecció DOM. |
| AC8 | "Compra feta" amb 0 ítems comprats mostra toast i no avança. | Prova manual. |
| AC9 | Els contrastos text/fons dels tints (ok, warn, bad) sobre surface i sobre tints passen 4.5:1. | WebAIM Contrast Checker, taula documentada. |
| AC10 | `prefers-reduced-motion` desactiva totes les animacions del prototip. | Safari amb Reduce Motion + inspecció visual. |

## 6. Ordre d'execució suggerit

El pla d'implementació (que escriurem a continuació) partirà d'aquest ordre, però la decisió final la pren el `writing-plans`:

1. **P0 primer**: A.2.1 (aria-labels chips), A.4.1 (progressbar compra), C.1 (compressió fotos), B.1 (detecció cicle complet). Són els que bloquegen el test.
2. **Global després**: §A.1 (bottom-sheet, toast, chip size, contrast audit).
3. **Per pantalla**: A.2 → A.3 → A.4 → A.5. A dins de cada pantalla, P1 abans de P2.
4. **§B (tancament cicle)** juntament amb A.4 — tot està a `setmana.js`/`setmana.html`, cal un sol touch coherent.
5. **§C** com a bloc independent (registrar.js + data.js).
6. **Validació final**: Lighthouse + axe + VoiceOver a les 4 pantalles. Actualitzar `P3/disseny/accessibilitat.md` amb resultats.

## 7. Commits

Un commit per grup coherent de fixes, en català, sense watermarks d'AI. Exemples:
- `Chip-macro aria-label en català + progressbar role a compra`
- `Tancament del cicle: detectar setmana completada i CTA de reinici`
- `Compressió d'imatge abans de persistir àpat`
- `Bottom-sheet: role=dialog + focus trap + aria-modal`

## 8. Fora d'abast

- WCAG 2.2 (mantenim 2.1 AA).
- Proves amb NVDA o TalkBack. Només VoiceOver (Safari + iOS).
- Test amb usuaris amb discapacitats reals — declarat com a limitació al doc d'accessibilitat.
- Canvis de copy, redisseny d'elements, o nous components.
- Migració del modal `shared.confirm` a bottom-sheet (pendent del HANDOFF, no entra).
- Tab-bar scroll-hide (pendent del HANDOFF, no entra).
- Actualització de `../P2/main-final.tex`. Es farà en una passada separada quan tot estigui validat.

## 9. Riscos

- **R1: axe i Lighthouse poden no ser equivalents.** Pot ser que Lighthouse doni 95 i axe trobi errors serious. Criteri d'acceptance AC1 i AC2 són **conjunts**, no alternatius.
- **R2: Compressió de foto degrada visualment.** 1024×1024 @ 0.7 és un compromís. Si Alex nota que la Laura perd detall visible al dashboard, pugem a 0.8 o màxim 1280×1280.
- **R3: `role="dialog"` + focus trap al bottom-sheet poden trencar la lògica actual.** Cal regressió de les captures Playwright del flow recepta + swap d'àpat + alternativa.
- **R4: El reset del cicle pot sorprendre a l'usuari que tingui el pla a mig fer.** Mitigació: el CTA "Planificar nova" només apareix al `resum` (setmana completada). Mai a `menu` o `llista`.

## 10. Decisions preses al brainstorming (traçabilitat)

- Escollim **verificació B** (code review + Lighthouse + axe) amb VoiceOver puntual, no exhaustiu.
- Escollim **cicle setmana opció B** (resum + CTA planificar nova), descartada opció A (clean slate automàtic) per pèrdua de context i opció C (banner pregunta) per fricció excessiva per a la Laura.
- Escollim **compressió canvas** per a les fotos, descartades IndexedDB (sobredimensionat) i no emmagatzemar la foto (perjudica el sentit del test).
- Pugem `.chip` a 44px per **preservar la reclamació AAA 2.5.5 Target Size** que el doc d'accessibilitat ja fa.
- Mantenim `alt=""` a `apat-card__foto` (decoratiu), no l'enriquim. El H3 adjacent ja porta el nom.
- Els emojis de categoria de compra (`🥬 🍗 🥛 🌾 🛒`) es conserven — són decoratius i funcionalment diferents dels emojis hero (`🥗 ✨`) que sí substituïm.
- `role="group"` al `<ul>` de perfil es treu perquè és redundant amb el `<section aria-labelledby>` i sobreescriu el `role="list"` implícit.
