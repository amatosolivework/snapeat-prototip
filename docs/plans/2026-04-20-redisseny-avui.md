# Redisseny del home screen "Avui" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el redisseny iOS-clean del semàfor i els chips H/V/P de la pantalla "Avui" sense regressions a la resta del prototip.

**Architecture:** Canvi purament de front-end. Vanilla HTML/CSS/JS. Cap estructura nova a `data.js`; només canvis puntuals a `dashboard.js` (constants i plantilla HTML) i als fitxers CSS (`components.css` i, si cal, `screens.css`). Icones UI passen d'emojis a SVG Lucide inline. Verificació visual amb scripts Playwright a `/tmp/` i inspecció manual a 390×844.

**Tech Stack:** HTML5, CSS3 (custom properties), JavaScript ES5 vanilla, Playwright (per scripts de captura a `/tmp/`).

**Spec:** `docs/specs/2026-04-20-redisseny-avui.md`.

---

## Resum de fitxers afectats

| Fitxer | Abast del canvi |
|---|---|
| `js/dashboard.js` | `CATEGORY_ICON` (emojis → SVG), afegir `STATUS_PILL_LABEL`, eliminar ús de `STATUS_HINT` al render, `cellHtml()` emet ring + pill, `apatHtml()` etiquetes `Verd.` / `Prot.`, `renderSuggestion()` usa SVG lightbulb |
| `css/components.css` | Refactor complet de `.semafor-cell*` (estructura, ring, pill, alineació), compactació de `.chip-macro*` |
| `css/screens.css` | Pot requerir ajustament a `.apat-card__chips` (nowrap). Depèn de l'estat actual. |
| `/tmp/snapeat-*.png` | Regenerats per verificació visual |

Sense canvis: `data.js`, `registrar.js`, `setmana.js`, `perfil.js`, `variables.css`, `base.css`, `layout.css`, `index.html`, `registrar.html`, `setmana.html`, `perfil.html`.

---

## Task 1: Captura baseline (abans)

**Files:**
- Read: `/tmp/screenshot-with-data.js`
- Generate: `/tmp/snapeat-05-dashboard-ple.png` (baseline)

**Propòsit:** tenir una referència del "abans" per comparar quan acabem.

- [ ] **Step 1: Regenerar captures amb dades i guardar còpia baseline**

Run:
```bash
node /tmp/screenshot-with-data.js && \
cp /tmp/snapeat-05-dashboard-ple.png /tmp/snapeat-baseline-dashboard.png && \
cp /tmp/snapeat-01-dashboard.png /tmp/snapeat-baseline-dashboard-empty.png
```

Expected: dos fitxers a `/tmp/snapeat-baseline-*.png`. Obre'ls per confirmar que corresponen al dashboard actual (pre-canvi) amb el semàfor amb barra superior de color i chips en 2 files.

---

## Task 2: Substituir emojis per SVG a `dashboard.js` (semàfor + banner)

**Files:**
- Modify: `js/dashboard.js:32-36` (`CATEGORY_ICON`)
- Modify: `js/dashboard.js:107` (banner icon render)

**Propòsit:** les icones d'UI passen a SVG Lucide per consistència cross-platform.

- [ ] **Step 1: Substituir `CATEGORY_ICON` per strings SVG**

Localitza aquest bloc a `js/dashboard.js`:

```js
  // Icones (emoji) per a cada categoria del semàfor — reforç visual a l'anti-daltonisme.
  const CATEGORY_ICON = {
    hidrats: '🌾',
    verdures: '🥗',
    proteina: '🥚'
  };
```

Substitueix per:

```js
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
```

- [ ] **Step 2: Substituir l'emoji del banner per SVG lightbulb**

Localitza aquesta línia a `js/dashboard.js` dins `renderSuggestion()`:

```js
      '<span class="banner__icon" aria-hidden="true">' + escapeHtml(suggestion.icon || '💡') + '</span>' +
```

Substitueix per:

```js
      '<span class="banner__icon" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>' +
          '<path d="M9 18h6"/>' +
          '<path d="M10 22h4"/>' +
        '</svg>' +
      '</span>' +
```

**Nota:** `suggestion.icon` de `data.js` deixa de consumir-se però no l'esborrem (és una dada, no causa problema si està). Si en el futur es vol reciclar per variants d'icona, ja està disponible.

- [ ] **Step 3: Verificar al navegador**

Obre `file:///Users/amatosolive/Uni/FHiC/P3/prototip/index.html` a Chrome amb DevTools (iPhone 13, 390×844). Verifica que:
- Les 3 cel·les del semàfor mostren icones SVG de contorn (espiga, fulla, ou) en lloc d'emojis.
- El banner Coach mostra una bombeta SVG en lloc del 💡.
- Cap error a la consola.

- [ ] **Step 4: Commit**

```bash
cd /Users/amatosolive/Uni/FHiC/P3/prototip
git add js/dashboard.js
git commit -m "Icones SVG Lucide al semàfor i banner Coach

Substituïm els emojis (🌾 🥗 🥚 💡) per SVG Lucide inline
per consistència cross-platform i estètica iOS-native."
```

---

## Task 3: Reestructurar `cellHtml()`: eliminar hint, afegir pill

**Files:**
- Modify: `js/dashboard.js:17-36` (afegir `STATUS_PILL_LABEL`)
- Modify: `js/dashboard.js:77-93` (`cellHtml()`)

**Propòsit:** la cel·la emet `ring` + `label` + `status` + `pill` en aquest ordre. Ja no emet `hint`. La pill comunica l'estat en una paraula (OK / Atent / Millora).

- [ ] **Step 1: Afegir la constant `STATUS_PILL_LABEL`**

Localitza la zona on tenim `STATUS_TEXT` i `STATUS_HINT` (línies 17-29). Just després (abans de `CATEGORY_ICON`), afegeix:

```js
  // Etiqueta curta de la pill d'estat. To Coach: "Millora" és proactiu, no punitiu.
  const STATUS_PILL_LABEL = {
    ok: 'OK',
    warn: 'Atent',
    bad: 'Millora'
  };
```

- [ ] **Step 2: Reescriure `cellHtml()`**

Localitza la funció `cellHtml(cell, state)` a `js/dashboard.js`. Substitueix-la sencera per:

```js
  function cellHtml(cell, state) {
    const safeState = (state === 'ok' || state === 'warn' || state === 'bad') ? state : 'bad';
    const statusText = STATUS_TEXT[cell.key][safeState];
    const iconHtml = CATEGORY_ICON[cell.key] || '';
    const pillLabel = STATUS_PILL_LABEL[safeState];
    const ariaLabel = cell.label + ': ' + statusText;
    return '' +
      '<article class="semafor-cell" aria-label="' + shared.escapeAttr(ariaLabel) + '">' +
        '<span class="semafor-cell__ring semafor-cell__ring--' + safeState + '" aria-hidden="true">' + iconHtml + '</span>' +
        '<h3 class="semafor-cell__label">' + escapeHtml(cell.label) + '</h3>' +
        '<p class="semafor-cell__status">' + escapeHtml(statusText) + '</p>' +
        '<span class="semafor-cell__pill semafor-cell__pill--' + safeState + '">' + escapeHtml(pillLabel) + '</span>' +
      '</article>';
  }
```

**Canvis clau:**
- `<article class="semafor-cell">` **sense** `semafor-cell--ok/warn/bad`. L'estat viu al ring i al pill.
- `<span class="semafor-cell__ring semafor-cell__ring--{state}">` amb la SVG a dins.
- Eliminem `hintHtml`.
- Afegim `<span class="semafor-cell__pill semafor-cell__pill--{state}">` amb l'etiqueta.

- [ ] **Step 3: Eliminar `STATUS_HINT` (opcional però recomanat)**

Com que `STATUS_HINT` ja no s'usa, eliminem-lo per no deixar codi mort:

Localitza el bloc:

```js
  // Pista breu sota cada cèl·lula: un gest concret per tancar la bretxa.
  // Només es mostra quan l'estat no és 'ok'.
  const STATUS_HINT = {
    hidrats: { warn: 'Prova amanida al sopar', bad: 'Un bol d\'arròs o pasta' },
    verdures: { warn: 'Una amanida al sopar', bad: 'Un grapat d\'enciam o bròquil' },
    proteina: { warn: 'Un iogurt al matí', bad: 'Ou, tonyina o cigrons' }
  };
```

Elimina'l completament. Les frases viuen ara al banner Coach (`getDailySuggestion()` a `data.js`).

- [ ] **Step 4: Verificar al navegador**

Recarrega `index.html`. Verifica que:
- Cada cel·la mostra ring + label + status + pill ("OK" / "Atent" / "Millora").
- Ja no apareix cap línia de hint sota el status.
- No hi ha errors a la consola.
- L'aria-label de cada cel·la es llegeix correctament a DevTools (inspecciona `<article>`).

- [ ] **Step 5: Commit**

```bash
git add js/dashboard.js
git commit -m "Semàfor emet ring + pill (OK/Atent/Millora), elimina hints

- Nova constant STATUS_PILL_LABEL amb les tres etiquetes.
- cellHtml() emet estructura: ring (classe d'estat), label, status, pill.
- L'estat cromàtic viu al ring i al pill, no a l'article de la cel·la.
- STATUS_HINT eliminat: la guia del dia viu al banner Coach, no es duplica."
```

---

## Task 4: Reescriure CSS del semàfor

**Files:**
- Modify: `css/components.css:545-715` (tota la secció `SEMÀFOR NUTRICIONAL`)

**Propòsit:** nova estructura visual (cards neutres, ring tintat, alineació per dalt, pill al fons).

- [ ] **Step 1: Obrir `css/components.css` i localitzar la secció del semàfor**

La secció comença amb `/* SEMÀFOR NUTRICIONAL — component crític */` (~línia 545) i acaba abans de `/* CHIPS — selecció ràpida */` (~línia 717). Aquesta és la zona que reemplacem.

- [ ] **Step 2: Reemplaçar la secció sencera pel CSS nou**

Substitueix tot el bloc entre els dos comentaris de capçalera per:

```css
/* ============================================================
   SEMÀFOR NUTRICIONAL — component crític
   Cards neutres, ring tintat, pill d'estat al fons
   Alineació: labels i inicis de status a la mateixa Y
   ============================================================ */

.semafor {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

@media (max-width: 359px) {
  .semafor {
    grid-template-columns: repeat(2, 1fr);
  }
  .semafor > :nth-child(3) {
    grid-column: 1 / -1;
  }
}

.semafor-cell {
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-3) var(--space-2);
  min-height: 138px;
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-slow) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-in-out);
}

/* Ring: cercle amb tint d'estat i SVG al centre */
.semafor-cell__ring {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.semafor-cell__ring svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  fill: none;
}

.semafor-cell__ring--ok {
  background-color: rgba(5, 150, 105, 0.12);
  color: var(--color-ok-accent);
}

.semafor-cell__ring--warn {
  background-color: rgba(217, 119, 6, 0.12);
  color: var(--color-warn-accent);
}

.semafor-cell__ring--bad {
  background-color: rgba(220, 38, 38, 0.10);
  color: var(--color-bad-accent);
}

/* Label: ancorat sota el ring amb un margin fix — mateixa Y a totes les cel·les */
.semafor-cell__label {
  margin-top: var(--space-3);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
}

/* Status: ancorat sota el label amb un margin fix — mateixa Y a totes les cel·les.
   Si té 2 línies creix cap avall; l'espai buit (si n'hi ha) queda entre status i pill
   perquè la pill té margin-top: auto. */
.semafor-cell__status {
  margin-top: var(--space-1);
  font-size: var(--font-size-micro);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  color: var(--color-text-muted);
}

/* Pill: sempre al fons (margin-top:auto absorbeix l'espai restant) */
.semafor-cell__pill {
  margin-top: auto;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.semafor-cell__pill::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.semafor-cell__pill--ok {
  background-color: rgba(5, 150, 105, 0.10);
  color: var(--color-ok-fg);
}
.semafor-cell__pill--ok::before { background-color: var(--color-ok-accent); }

.semafor-cell__pill--warn {
  background-color: rgba(217, 119, 6, 0.10);
  color: var(--color-warn-fg);
}
.semafor-cell__pill--warn::before { background-color: var(--color-warn-accent); }

.semafor-cell__pill--bad {
  background-color: rgba(220, 38, 38, 0.08);
  color: var(--color-bad-fg);
}
.semafor-cell__pill--bad::before { background-color: var(--color-bad-accent); }

/* Animació d'atenció en primer render post-registre — es manté */
.semafor-cell--pulse {
  animation: semafor-pulse var(--duration-slow) var(--ease-out);
}

@keyframes semafor-pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.03); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .semafor-cell--pulse { animation: none; }
}
```

**Notes clau del nou CSS:**
- Desapareix `.semafor-cell::before` (la barra de color superior).
- Desapareixen `.semafor-cell--ok/warn/bad` (l'estat viu al ring i pill).
- Desapareixen `.semafor-cell__icon` i `.semafor-cell__hint` (substituïts o eliminats).
- Desapareix `.semafor-cell__dot` i les seves variants (era una alternativa no usada).
- Es conserva `.semafor-cell--pulse` i el `@keyframes`, amb override per a `prefers-reduced-motion`.

- [ ] **Step 3: Verificar al navegador**

Recarrega `index.html` a 390×844. Hauries de veure:
- Cards blanques amb borde suau (1px color-border), no tintades.
- Ring circular amb tint subtil (verd/ambre/vermell) i SVG al centre.
- Labels "Hidrats / Verdures / Proteïna" alineades a la mateixa Y a les 3 cel·les.
- Status començant a la mateixa Y a les 3 cel·les.
- Pill d'estat al fons, amb un punt de color i text "OK" / "ATENT" / "MILLORA" en majúscules.
- Cap cel·la té barra de color superior.

Simula els 3 estats a la consola de DevTools:

```js
// Estat tot OK
localStorage.setItem('snapeat:meals', JSON.stringify([{
  id:'t1', hora:'13:00', nom:'Test', fecha:new Date().toISOString().slice(0,10),
  indicadors:{ hidrats:'ok', verdures:'ok', proteina:'ok' }
}]));
location.reload();
```

```js
// Estat mixt
localStorage.setItem('snapeat:meals', JSON.stringify([{
  id:'t1', hora:'13:00', nom:'Test', fecha:new Date().toISOString().slice(0,10),
  indicadors:{ hidrats:'warn', verdures:'bad', proteina:'ok' }
}]));
location.reload();
```

Comprova que l'alineació aguanta en tots dos.

- [ ] **Step 4: Commit**

```bash
git add css/components.css
git commit -m "Reescriu CSS del semàfor: cards neutres + ring + pill

- Elimina la barra superior de color i els backgrounds tintats de la cel·la.
- Ring circular (30×30) amb tint d'estat i SVG al centre.
- Labels i status amb margin-top fix: mateixa Y a totes les cel·les.
- Pill al fons via margin-top:auto, ocupa l'espai restant.
- Conservat semafor-cell--pulse i respecta prefers-reduced-motion.
- Eliminats estils obsolets (icon, hint, dot, cell-state classes)."
```

---

## Task 5: Compactar chips H/V/P + forçar 1 fila

**Files:**
- Modify: `js/dashboard.js:~160` (`chipDefs` dins `apatHtml()`)
- Modify: `css/components.css:~1016-1075` (secció `CHIP MACRO`)
- Modify: `css/components.css:~981` (`.apat-card__chips`)

**Propòsit:** chips més compactes que caben en una fila a 390px.

- [ ] **Step 1: Actualitzar etiquetes dels chips a `apatHtml()`**

Localitza a `js/dashboard.js` el bloc:

```js
    const chipDefs = [
      { key: 'hidrats', initial: 'H', label: 'Hidrats' },
      { key: 'verdures', initial: 'V', label: 'Verdures' },
      { key: 'proteina', initial: 'P', label: 'Proteïna' }
    ];
```

Substitueix per:

```js
    const chipDefs = [
      { key: 'hidrats', initial: 'H', label: 'Hidrats', shortLabel: 'Hidrats' },
      { key: 'verdures', initial: 'V', label: 'Verdures', shortLabel: 'Verd.' },
      { key: 'proteina', initial: 'P', label: 'Proteïna', shortLabel: 'Prot.' }
    ];
```

I localitza el `.map` que segueix:

```js
    const chips = chipDefs.map(function (c) {
      const st = ind[c.key] || 'bad';
      return '<span class="chip-macro chip-macro--' + st + '" aria-label="' + shared.escapeAttr(c.label + ': ' + st) + '">' +
        '<span class="chip-macro__initial" aria-hidden="true">' + c.initial + '</span>' +
        '<span class="chip-macro__label">' + escapeHtml(c.label) + '</span>' +
      '</span>';
    }).join('');
```

Substitueix per:

```js
    const chips = chipDefs.map(function (c) {
      const st = ind[c.key] || 'bad';
      return '<span class="chip-macro chip-macro--' + st + '" aria-label="' + shared.escapeAttr(c.label + ': ' + st) + '">' +
        '<span class="chip-macro__initial" aria-hidden="true">' + c.initial + '</span>' +
        '<span class="chip-macro__label">' + escapeHtml(c.shortLabel) + '</span>' +
      '</span>';
    }).join('');
```

**Canvi mínim:** només `c.label` → `c.shortLabel` al render. L'aria-label conserva el nom complet per a lectors de pantalla.

- [ ] **Step 2: Compactar CSS dels chips**

Localitza la secció CHIP MACRO a `css/components.css` (~línia 1011-1075). Substitueix les regles `.chip-macro`, `.chip-macro__initial`, `.chip-macro__label` per aquestes (només mides, els selectors d'estat --ok/warn/bad es mantenen tal com són):

```css
.chip-macro {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px var(--space-2) 3px 3px;
  background-color: var(--color-surface-subtle);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  border: 1px solid var(--color-border);
}

.chip-macro__initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  color: #FFFFFF;
  line-height: 1;
  flex-shrink: 0;
}

.chip-macro__label {
  padding-right: 2px;
}
```

Les regles d'estat (`.chip-macro--ok`, `.chip-macro--warn`, `.chip-macro--bad` amb els seus `__initial` fills) es conserven tal com estan — no les toquem.

**Canvis clau:**
- `gap` 6px → 5px.
- `padding` `4px var(--space-2) 4px 4px` → `3px var(--space-2) 3px 3px`.
- `font-size` 14px → 11px (chip).
- `chip-macro__initial`: 22×22 → 18×18, `font-size` 11px → 10px.

- [ ] **Step 3: Forçar 1 fila a `.apat-card__chips`**

Localitza a `css/components.css` (~línia 981):

```css
.apat-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--space-1);
}
```

Substitueix per:

```css
.apat-card__chips {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-2);
  margin-top: var(--space-1);
}
```

**Canvi:** `flex-wrap: wrap` → `flex-wrap: nowrap`. Gap ajustat a `--space-2` (8px) per coherència amb tokens.

- [ ] **Step 4: Verificar al navegador a 390×844**

Recarrega `index.html` amb Chrome DevTools (device iPhone 13).

Si no hi ha àpats, seed un de prova a la consola:

```js
localStorage.setItem('snapeat:meals', JSON.stringify([{
  id:'t1', hora:'13:15', nom:'Pasta carbonara amb nata', fecha:new Date().toISOString().slice(0,10),
  extras:['Coca-Cola','Pa'],
  indicadors:{ hidrats:'warn', verdures:'bad', proteina:'ok' }
}]));
location.reload();
```

Verifica:
- Els 3 chips H/V/P estan a la mateixa fila.
- Inspecció del DOM: cada chip té `aria-label` amb el nom complet ("Hidrats: warn").
- Els chips es llegeixen: "H Hidrats", "V Verd.", "P Prot.".
- Cap overflow horitzontal.

- [ ] **Step 5: Commit**

```bash
git add js/dashboard.js css/components.css
git commit -m "Chips H/V/P compactes i en una sola fila

- Afegeix shortLabel a chipDefs (Hidrats, Verd., Prot.) — aria-label conserva
  el nom complet per a lectors de pantalla.
- Redueix padding, font-size i mida del cercle d'inicial.
- apat-card__chips: flex-wrap nowrap per forçar una única fila a 390px."
```

---

## Task 6: Verificació visual amb captures

**Files:**
- Run: `/tmp/screenshot-with-data.js`
- Compare: `/tmp/snapeat-baseline-*.png` vs `/tmp/snapeat-*.png`

**Propòsit:** confirmar abans/després amb imatges, no només amb inspecció manual.

- [ ] **Step 1: Regenerar captures amb dades reals**

Run:
```bash
cd /Users/amatosolive/Uni/FHiC/P3/prototip
node /tmp/screenshot-with-data.js
```

Expected: es regeneren `/tmp/snapeat-*.png` amb el nou disseny.

- [ ] **Step 2: Inspeccionar les captures clau**

Obre i verifica visualment:
- `/tmp/snapeat-05-dashboard-ple.png` vs `/tmp/snapeat-baseline-dashboard.png`
  - Semàfor: cards blanques amb ring i pill, no barra superior de color.
  - Labels "Hidrats / Verdures / Proteïna" a la mateixa Y horitzontal.
  - Chips H/V/P en 1 fila a cada àpat.
- `/tmp/snapeat-01-dashboard.png` vs `/tmp/snapeat-baseline-dashboard-empty.png`
  - Dashboard buit: semàfor "tot OK" o "tot bad" segons comportament de `aggregateIndicadors` quan no hi ha àpats. Cal que la cel·la renderitzi correctament sense hints.

- [ ] **Step 3: Capturar l'stress test d'alineació**

A la consola del browser, seed dades que forcin un status de 2 línies i dos d'1:

```js
localStorage.setItem('snapeat:meals', JSON.stringify([{
  id:'t1', hora:'13:15', nom:'Test', fecha:new Date().toISOString().slice(0,10),
  indicadors:{ hidrats:'bad', verdures:'ok', proteina:'ok' }
}]));
location.reload();
```

Fes una captura manual (CMD+Shift+4 al Mac) del semàfor i verifica que:
- Els labels dels 3 (Hidrats, Verdures, Proteïna) estan a la mateixa Y.
- Les pills dels 3 estan a la mateixa Y al fons.
- El status de "Hidrats" pot ser 2 línies ("Encara hi caben hidrats") mentre els altres ("Al punt") es queden 1 línia — i tot queda alineat.

Si no, és que el `min-height: 138px` o algun padding necessita un ajustament. Pla de contingència: augmenta `min-height` a 144px i re-verifica.

---

## Task 7: Auditoria d'accessibilitat (dels canvis)

**Files:**
- Read: `index.html` i `css/components.css` (inspecció manual)

**Propòsit:** verificar que els canvis específics d'aquesta iteració compleixen WCAG 2.1 AA. **No** és l'auditoria global de tot l'app (aquesta és un altre spec).

- [ ] **Step 1: Verificar contrast text/fons dels chips i pills**

Usa https://webaim.org/resources/contrastchecker/ per comprovar cada combinació:

| Element | Foreground | Background | Mínim AA |
|---|---|---|---|
| Pill OK text | `#065F46` (`--color-ok-fg`) | `rgba(5,150,105,0.10)` sobre `#FAFAF9` | 4.5:1 |
| Pill warn text | `#92400E` | `rgba(217,119,6,0.10)` sobre `#FAFAF9` | 4.5:1 |
| Pill bad text | `#991B1B` | `rgba(220,38,38,0.08)` sobre `#FAFAF9` | 4.5:1 |
| Chip OK text | `#065F46` | `rgba(5,150,105,0.10)` sobre `#FFFFFF` | 4.5:1 |
| Chip warn text | `#92400E` | `rgba(217,119,6,0.10)` sobre `#FFFFFF` | 4.5:1 |
| Chip bad text | `#991B1B` | `rgba(220,38,38,0.08)` sobre `#FFFFFF` | 4.5:1 |
| Label cel·la | `#1C1917` | `#FFFFFF` | 4.5:1 |
| Status cel·la | `#44403C` (`--color-text-muted`) | `#FFFFFF` | 4.5:1 |

Nota: les pills tenen text petit (10px) i són elements informatius; igualment apliquem 4.5:1 perquè la norma no penalitza tipografia petita en aquesta categoria.

Si algun combo no passa AA, ajusta `--color-*-fg` (són tokens del projecte) o l'opacitat del background. Document el canvi aplicat.

- [ ] **Step 2: Verificar aria-labels**

Obre DevTools → Accessibility tree. Inspecciona:
- `<article class="semafor-cell">` → aria-label amb format "Hidrats: Una mica alts" (NO buit).
- `<span class="chip-macro">` → aria-label amb format "Hidrats: warn" (NO buit).
- `<span class="semafor-cell__ring">` i `<span class="chip-macro__initial">` → aria-hidden="true".

- [ ] **Step 3: Executar Lighthouse accessibility**

A Chrome DevTools, pestanya Lighthouse. Selecciona només "Accessibility", Mode: Navigation, Device: Mobile. Run audit sobre `index.html`.

Objectiu: score ≥95. Qualsevol error/warning nou (no present a `baseline`) és bloquejant.

Si apareix un error sobre `<h3>` dins de `<article>` sense wrapper de `<h2>`, és normal — ja hi ha `#semafor-title` (h2) de la secció, i els H3 dins són cel·les (component). No cal canviar.

- [ ] **Step 4: Commit si hi ha correccions**

Si has hagut d'ajustar colors o markup, commit amb un missatge que descrigui exactament què has canviat i per què. Exemple si cal pujar contrast del text d'una pill:

```bash
git add css/components.css
git commit -m "Puja contrast del text de la pill warn a AA

Color del text passa de #92400E a #78350F per garantir
contrast 4.6:1 sobre el fons rgba(217,119,6,0.10)/surface."
```

Si no cal cap canvi, salta aquest step — no facis un commit buit.

---

## Task 8: Verificació de regressió a la resta del prototip

**Files:**
- Read/verify visualment: `registrar.html`, `setmana.html`, `perfil.html`

**Propòsit:** cap altra pantalla ha de canviar visualment. Especial atenció al mini-semàfor de `setmana.html` (fa servir classes similars però independents).

- [ ] **Step 1: Comprovar `setmana.html`**

Obre `file:///Users/amatosolive/Uni/FHiC/P3/prototip/setmana.html` a 390×844. Clica "Generar menú setmanal" per arribar al step del menú setmanal. Verifica:
- El **mini-semàfor per dia** (cercles 22×22 amb lletres H/V/P en blanc) **no s'ha tocat** — són components independents del semàfor del dashboard. Ha de continuar igual que abans.
- No hi ha errors a la consola.

Si visualment hi ha un canvi no desitjat, el CSS modificat està afectant més del que tocava — revisa que els selectors de la Task 4 siguin `.semafor-cell*` (no més genèrics).

- [ ] **Step 2: Comprovar `registrar.html`**

Obre a 390×844. Verifica:
- Sense canvis visuals (no fem servir `.semafor-cell*` aquí).
- Funcionalitat de registrar àpat intacta.

- [ ] **Step 3: Comprovar `perfil.html`**

Obre a 390×844. Verifica:
- Sense canvis visuals.

- [ ] **Step 4: Regenerar captures globals i confirmar**

```bash
node /tmp/screenshot-snapeat.js && node /tmp/screenshot-with-data.js
```

Obre totes les captures de `/tmp/snapeat-*.png` i confirma:
- `snapeat-02-registrar.png` = igual que baseline.
- `snapeat-03-setmana*.png`, `snapeat-06-setmana-menu.png` = mini-semàfor per dia igual que baseline.
- `snapeat-04-perfil.png` = igual que baseline.

---

## Task 9: Net i push

**Files:**
- Review: `git log`, `git status`

**Propòsit:** deixar la feina publicada a GitHub Pages perquè Alex la pugui veure al mòbil.

- [ ] **Step 1: Revisar commits**

```bash
cd /Users/amatosolive/Uni/FHiC/P3/prototip
git log --oneline -10
```

Hauríem de veure 4-5 commits nous (depenent d'ajustos a l'accessibilitat):
1. Icones SVG al semàfor i banner
2. Semàfor emet ring + pill, elimina hints
3. Reescriu CSS del semàfor
4. Chips compactes en una fila
5. (Opcional) Ajustos d'accessibilitat

- [ ] **Step 2: Push a `main`**

```bash
git push origin main
```

Expected: push OK. GitHub Pages auto-deploya a `https://amatosolivework.github.io/snapeat-prototip/` en ~1 min.

- [ ] **Step 3: Verificar en producció**

Espera 1-2 minuts i obre la URL a mòbil real (Alex) o a Chrome DevTools amb user-agent iPhone. Verifica:
- Home screen "Avui" mostra el nou disseny (semàfor + chips).
- No hi ha errors a la consola.

- [ ] **Step 4: Actualitzar `HANDOFF.md`**

Primer, captura el hash del commit més recent:

```bash
LAST_HASH=$(git log -1 --format=%h)
echo "$LAST_HASH"
```

Afegeix a `HANDOFF.md` una entrada a la taula "Arbre d'iteracions recents" usant aquest hash:

```markdown
| 8 | Redisseny Avui | Semàfor Apple Health (cards + ring + pill), chips H/V/P en 1 fila, icones SVG Lucide, alineació per dalt | `<LAST_HASH>` |
```

I actualitza la secció "Què funciona" del Dashboard amb el nou estat (reemplaça les descripcions obsoletes).

```bash
git add HANDOFF.md
git commit -m "Actualitza HANDOFF amb la iteració del redisseny Avui"
git push origin main
```

---

## Self-review checklist (per al desenvolupador abans de donar per tancat)

- [ ] Els 9 criteris d'èxit del spec (§6) estan coberts?
- [ ] `git log --oneline` mostra la història neta amb missatges en català i sense watermarks d'AI?
- [ ] L'URL de GitHub Pages reflecteix els canvis en mòbil real?
- [ ] Les captures a `/tmp/snapeat-*.png` reflecteixen el nou disseny?
- [ ] Lighthouse accessibility score ≥95 a `index.html`?
- [ ] Cap regressió a `registrar`, `setmana`, `perfil`?
