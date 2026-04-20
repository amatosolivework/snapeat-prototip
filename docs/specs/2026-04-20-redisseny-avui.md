# Redisseny del home screen "Avui" — neteja iOS-clean

**Data:** 2026-04-20
**Estat:** Spec acordat amb Alex al brainstorming del 2026-04-20
**Àmbit:** Només `index.html` (pantalla Avui). Sense tocar `registrar`, `setmana`, ni `perfil`.
**Sub-projecte relacionat:** Auditoria d'accessibilitat global — doc separat, posterior.

---

## 1. Problema

La pantalla Avui té dues àrees amb fricció visual:

1. **Semàfor "El teu dia"**: cada cel·la acumula 5-6 senyals de color (barra superior de color, emoji, label en color, status en color, hint en color, fons tintat). Dona sensació "cutre", poc iOS-native. A més, el contingut variable (unes cel·les tenen hint, altres no) provoca alçades desiguals.

2. **Chips H/V/P dels àpats d'avui**: les etiquetes completes ("Hidrats", "Verdures", "Proteïna") sumen més amplada de la que cap a 390px. El 3r chip (Proteïna) embolica a una segona fila.

Context persona (Laura Torres, P2): vol lectura ràpida, visual, sense soroll cromàtic ni to judici. Apps que la van fer sentir jutjada (MyFitnessPal) les va desinstal·lar.

## 2. Objectius

- Reduir soroll cromàtic del semàfor sense perdre llegibilitat d'estat.
- Alineació consistent entre les 3 cel·les del semàfor independentment del contingut.
- Chips H/V/P sempre en una sola fila a 390px.
- Estètica iOS-native professional (referència: Apple Health / Fitness).
- Mantenir WCAG 2.1 AA i to Coach.

## 3. Decisions preses al brainstorming

### 3.1 Direcció visual: "Apple Health" (variant A)
Cards blanques neutres, icona dins un cercle amb tint subtil (~10-12% opacitat), pill d'estat petita al peu. Els signals de color es redueixen a **dos**: icona tintada + pill. Text principal en negre/gris fosc.

### 3.2 Icones: SVG Lucide (no emojis)
- **Hidrats** → icona `wheat` (espiga)
- **Verdures** → icona `leaf` (fulla) — reforç amb el logo de marca
- **Proteïna** → icona `egg` (ou)
- **Banner Coach** → icona `lightbulb` (bombeta)

Preferència explícita del projecte: icones SVG sobre emojis per consistència cross-platform i neteja visual.

### 3.3 Pills d'estat — microcopy
- **OK** — al punt, no cal fer res
- **Atent** — una mica fora de lloc, petit gest ho arregla
- **Millora** — Coach: proposa millorar, no culpa (substitueix "Bad")

### 3.4 Eliminació dels hints individuals
Els *hints* sota cada cel·la ("Prova amanida al sopar") desapareixen del semàfor. El **banner Coach** ja porta el gest principal del dia. No volem duplicar guia a dos llocs.

### 3.5 Alineació de cel·les (crític)
Totes les cel·les del semàfor tenen contingut alineat a les mateixes Y:
- **Ring** (icona): al top, mateixa mida a totes.
- **Label** ("Hidrats" / "Verdures" / "Proteïna"): mateixa Y, ancorat a un `margin-top` fix sota el ring.
- **Status** (text propositiu): mateixa Y de començament, `margin-top` fix sota el label. Si té 2 línies creix cap avall.
- **Pill**: sempre al fons de la cel·la via `margin-top: auto` al pill — absorbeix l'espai restant.

**Conseqüència visual:** quan el status és curt (1 línia), l'espai buit queda **entre el status i la pill**, no entre el label i el status.

### 3.6 Chips dels àpats: variant II (lletra + etiqueta curta)
- Lletra (H/V/P) dins un cercle de 18×18 amb color d'estat.
- Etiqueta curta al costat: `Hidrats` / `Verd.` / `Prot.`
- Mida reduïda respecte de l'actual per garantir 1 fila a 390px.
- Background tintat (~10%) amb border mateix to.
- `aria-label` conserva la frase completa ("Hidrats: una mica alts").

## 4. Especificació tècnica

### 4.1 Fitxers afectats

| Fitxer | Canvi |
|---|---|
| `css/components.css` | Refactor `.semafor-cell*`, `.chip-macro*` |
| `css/screens.css` | Ajustaments `.semafor-section`, `.apat-card__chips` si cal |
| `js/dashboard.js` | `CATEGORY_ICON` passa d'emojis a cadenes SVG; `STATUS_HINT` deixa de renderitzar-se; afegir `STATUS_PILL_LABEL` = `{ ok:'OK', warn:'Atent', bad:'Millora' }`. `cellHtml()` incorpora la pill. |
| `js/data.js` | Sense canvis. |

### 4.2 Tokens afectats (variables.css)

Els tokens actuals ja cobreixen els colors i espais necessaris. Una sola addició:

```css
--color-cell-surface: #FFFFFF;   /* redundant amb --color-surface, explícit per llegibilitat */
```

O bé reutilitzem `--color-surface` sense afegir token nou. Decidir al pla d'implementació.

### 4.3 Semàfor — estructura HTML final (per cel·la)

```html
<article class="semafor-cell" aria-label="Hidrats: una mica alts">
  <span class="semafor-cell__ring semafor-cell__ring--warn" aria-hidden="true">
    <svg ...><!-- wheat icon --></svg>
  </span>
  <h3 class="semafor-cell__label">Hidrats</h3>
  <p class="semafor-cell__status">Una mica alts</p>
  <span class="semafor-cell__pill semafor-cell__pill--warn">Atent</span>
</article>
```

**Canvi important**: el `<article>` ja no porta `semafor-cell--ok/warn/bad`. L'estat cromàtic viu només al ring i al pill. El modificador `semafor-cell--pulse` (animació post-registre) es conserva a la cel·la.

### 4.4 Semàfor — CSS clau

```css
.semafor { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2); }

.semafor-cell {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-3) var(--space-2);
  min-height: 138px;
  box-shadow: var(--shadow-sm);
}

.semafor-cell__ring {
  width: 30px; height: 30px;
  border-radius: var(--radius-full);
  display: inline-flex; align-items: center; justify-content: center;
}
.semafor-cell__ring svg { width: 16px; height: 16px; stroke-width: 2; }

.semafor-cell__ring--ok { background: rgba(5,150,105,0.12); color: var(--color-ok-accent); }
.semafor-cell__ring--warn { background: rgba(217,119,6,0.12); color: var(--color-warn-accent); }
.semafor-cell__ring--bad { background: rgba(220,38,38,0.10); color: var(--color-bad-accent); }

.semafor-cell__label {
  margin-top: var(--space-3);           /* ancorat sota ring */
  font-size: var(--font-size-small);    /* 14px */
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text);
}

.semafor-cell__status {
  margin-top: var(--space-1);           /* ancorat sota label */
  font-size: var(--font-size-micro);    /* 12px */
  color: var(--color-text-muted);
  line-height: var(--line-height-snug);
}

.semafor-cell__pill {
  margin-top: auto;                      /* absorbeix espai restant */
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.semafor-cell__pill::before {
  content: ""; width: 5px; height: 5px; border-radius: var(--radius-full);
}
.semafor-cell__pill--ok   { background: rgba(5,150,105,0.10);  color: var(--color-ok-fg); }
.semafor-cell__pill--ok::before   { background: var(--color-ok-accent); }
.semafor-cell__pill--warn { background: rgba(217,119,6,0.10);  color: var(--color-warn-fg); }
.semafor-cell__pill--warn::before { background: var(--color-warn-accent); }
.semafor-cell__pill--bad  { background: rgba(220,38,38,0.08);  color: var(--color-bad-fg); }
.semafor-cell__pill--bad::before  { background: var(--color-bad-accent); }
```

### 4.5 Chip H/V/P — CSS clau

```css
.apat-card__chips { display: flex; gap: var(--space-2); flex-wrap: nowrap; }

.chip-macro {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px var(--space-2) 3px 3px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  border: 1px solid transparent;
}
.chip-macro__initial {
  width: 18px; height: 18px;
  border-radius: var(--radius-full);
  color: #FFFFFF;
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  display: inline-flex; align-items: center; justify-content: center;
}
.chip-macro--ok   { background: rgba(5,150,105,0.10); color: var(--color-ok-fg); border-color: rgba(5,150,105,0.18); }
.chip-macro--ok   .chip-macro__initial { background: var(--color-ok-accent); }
.chip-macro--warn { background: rgba(217,119,6,0.10); color: var(--color-warn-fg); border-color: rgba(217,119,6,0.18); }
.chip-macro--warn .chip-macro__initial { background: var(--color-warn-accent); }
.chip-macro--bad  { background: rgba(220,38,38,0.08); color: var(--color-bad-fg); border-color: rgba(220,38,38,0.18); }
.chip-macro--bad  .chip-macro__initial { background: var(--color-bad-accent); }
```

Etiquetes dels chips: `Hidrats` / `Verd.` / `Prot.`

### 4.6 dashboard.js — canvis puntuals

```js
const CATEGORY_ICON = {
  hidrats:  '<svg viewBox="0 0 24 24">...wheat path...</svg>',
  verdures: '<svg viewBox="0 0 24 24">...leaf path...</svg>',
  proteina: '<svg viewBox="0 0 24 24">...egg path...</svg>'
};

const STATUS_PILL_LABEL = {
  ok: 'OK', warn: 'Atent', bad: 'Millora'
};

// STATUS_HINT: conservat al codi però `cellHtml()` deixa de renderitzar-lo.
// Motiu: podria tornar en el futur; esborrar-ho ens faria perdre les frases ja escrites.
// (NOTA: si la decisió final és "no el tornarem", el pla d'implementació pot
//  proposar l'eliminació.)
```

`cellHtml(cell, state)` passa de renderitzar `hintHtml` a renderitzar la pill.

## 5. Accessibilitat (integrada, no auditoria global)

Ha de complir **tots** aquests criteris — són mínim d'entrada:

- **Contrast**: tots els combos fons/text del semàfor i chips verifiquen ≥ 4.5:1 per a text petit. `--color-*-fg` ja està calibrat per això. Verificació amb WebAIM Contrast Checker abans de tancar.
- **No només color**: cada cel·la té text d'estat + pill textual + icona. Cada chip té lletra H/V/P + etiqueta + `aria-label` amb la frase completa.
- **Touch targets**: els chips i les cel·les no són botons tàctils (no tenen `onClick`), per tant no apliquen els 44×44. Si més endavant es tornen tàctils, caldrà garantir 44×44.
- **Focus visible**: si una cel·la es torna focusable (futura funcionalitat), l'outline 2px del token `--color-focus` es conserva.
- **`prefers-reduced-motion`**: l'animació `semafor-pulse` actual es manté, amb el mitjà existent de respectar la preferència (ja present al CSS base).

Auditoria global WCAG 2.1 AA de tot l'app: **fora d'aquest spec**, sub-projecte separat.

## 6. Criteris d'èxit (acceptance)

| # | Criteri | Verificació |
|---|---|---|
| 1 | Els labels "Hidrats", "Verdures", "Proteïna" estan a la mateixa Y a totes les cel·les, independentment del contingut del status | Captura a 390×844 amb 3 estats diferents, inspecció visual |
| 2 | Els status comencen a la mateixa Y a totes les cel·les | Idem |
| 3 | Les pills estan al fons, també a la mateixa Y | Idem |
| 4 | Els chips H/V/P caben en 1 sola fila a 390px, tant en estats OK/OK/OK com OK/warn/bad | Captura amb dades reals |
| 5 | Les icones són SVG Lucide (no emojis) al semàfor i banner | Revisió de `dashboard.js` i render |
| 6 | Contrast AA verificat per cada combinació de tints | WebAIM Contrast Checker |
| 7 | `aria-label` complet a cada cel·la i chip | Inspecció DOM |
| 8 | Sense regressions visibles a `registrar`, `setmana`, `perfil` | Captures de totes les pantalles |
| 9 | `STATUS_HINT` deixa de renderitzar-se (banner Coach assumeix el rol de guia) | Inspecció visual |

## 7. Fora d'abast

- Auditoria d'accessibilitat global de tot l'app (WCAG 2.1 AA sistemàtic a totes les pantalles). **Spec separat**, posterior.
- Canvis d'algoritme a `data.aggregateIndicadors()` o `analyzeMeal()`. Només és un canvi visual.
- Canvis a `registrar.html`, `setmana.html`, `perfil.html`.
- Canvis al banner Coach (contingut i disseny). Només canvia la seva icona 💡 → SVG `lightbulb`.
- Canvis a l'empty state de "Àpats d'avui". Es manté tal com està.
- Nous tokens de color o de tipografia. Treballem amb els que ja hi ha a `variables.css`.

## 8. Riscos

- **Risc baix**: canviar `CATEGORY_ICON` d'emoji a SVG pot rompre l'ús d'aquesta constant en altres llocs (p.ex. setmana mini-semàfor). Cal verificar usos abans de tocar-ho.
- **Risc baix**: si `aggregateIndicadors()` retorna un estat no esperat, la pill podria no renderitzar-se. Conservar fallback a `'bad'` com ja fa el codi.
- **Risc de regressió a 320px**: el media query actual `@media (max-width: 359px)` col·loca la 3a cel·la en una 2a fila. Cal validar que l'alineació nova aguanta aquesta situació.

## 9. Decisions del brainstorming (per traçabilitat)

- Direcció visual A (Apple Health) triada sobre B (Weather) i C (Reminders).
- Chips variant II (lletra + etiqueta curta) triada sobre I (només lletres) i III (barra segmentada).
- "Millor" descartat, reemplaçat per "Millora".
- Status anclat per dalt (inici a la mateixa Y), no per baix.
- Emojis dels icones UI descartats en favor de SVG Lucide. Preferència durable per al projecte.
