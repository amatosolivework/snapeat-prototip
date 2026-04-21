# Audit de prefers-reduced-motion — 2026-04-21

Verificació de totes les animacions i transicions del prototip per garantir
compliment de WCAG 2.3.3 (Animation from Interactions) i WCAG 1.4.3.

---

## Reset global

`css/base.css:217-226` — reset universal amb `!important` que aplica a `*`,
`*::before` i `*::after`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Enfocament conservador i ampli. Redueix durades a 0.01ms (essencialment
instantani) sense eliminar del tot les animacions, la qual cosa evita
problemes de layout que pot causar `animation: none` en alguns patrons
de toggle de visibilitat (opacity 0↔1, transform).

---

## Animacions i transicions detectades

### CSS — `@keyframes` i `animation:`

| Ubicació | Selector | Durada | Coberta pel reset global? | Override específic? |
|---|---|---|---|---|
| `components.css:284` | `@keyframes fab-pulse` (`.fab--pulse::before`) | 2s infinit | Sí — `animation-iteration-count: 1` fa que s'executi un sol cop; `animation-duration: 0.01ms` fa el cicle instantani | No (el reset global és suficient) |
| `components.css:681` | `@keyframes semafor-pulse` (`.semafor-cell--pulse`) | `--duration-slow` (320ms), 1 cop | Sí | **Sí** — `components.css:687-689`: `animation: none` explícit |

La cel·la de semàfor té un override explícit addicional (`animation: none`) que
és fins i tot més fort que el reset global: elimina completament l'animació en
lloc de reduir-ne la durada.

### CSS — `transition:` (interaccions hover/focus/active/estat)

Totes les transicions CSS usades al prototip depenen de la propietat
`transition-duration`. El reset global amb `!important` les cobreix totes.

| Ubicació | Selector | Propietats animades | Durada | Coberta? |
|---|---|---|---|---|
| `base.css:140` | `a` | `color` | 150ms | Sí |
| `components.css:21` | `.skip-link` | `transform` | 220ms | Sí |
| `components.css:100-105` | `.btn` | `background-color`, `border-color`, `color`, `transform`, `box-shadow`, `opacity` | 150ms | Sí |
| `components.css:248-250` | `.fab` | `transform`, `box-shadow`, `filter` | 150ms | Sí |
| `components.css:338-339` | `.tab` | `color`, `background-color` | 150ms | Sí |
| `components.css:348` | `.tab__icon` | `transform` | 220ms | Sí |
| `components.css:412` | `.input-field` | `border-color` | 150ms | Sí |
| `components.css:466` | `.input-with-suffix` | `border-color` | 150ms | Sí |
| `components.css:522-523` | `.checkbox-label` | `border-color`, `background-color` | 150ms | Sí |
| `components.css:576-577` | `.semafor-cell` | `transform`, `box-shadow` | 320ms / 150ms | Sí |
| `components.css:716-719` | `.chip` | `background-color`, `border-color`, `color`, `transform` | 150ms | Sí |
| `components.css:858-859` | `.apat-card` | `transform`, `box-shadow` | 150ms | Sí |
| `components.css:1062-1063` | `.apat-card__menu` | `background-color`, `color` | 150ms | Sí |
| `components.css:1122-1123` | `.toast` | `opacity`, `transform` | 220ms | Sí |
| `components.css:1179-1181` | `.toast` (reduced-motion) | `transition-duration` | 0.01ms | — Override explícit addicional |
| `components.css:1206` | `.bottom-sheet__backdrop` | `opacity` | 220ms | Sí |
| `components.css:1222` | `.bottom-sheet__panel` | `transform` | 320ms | Sí |
| `components.css:1272-1273` | `.bottom-sheet__close` | `background-color`, `color` | 150ms | Sí |
| `components.css:1311-1315` | `.bottom-sheet__panel`, `.bottom-sheet__backdrop` (reduced-motion) | `transition-duration` | 0.01ms | Sí — Override explícit addicional |
| `components.css:1336-1337` | `.footer-cta` | `opacity`, `transform` | 220ms | Sí |
| `components.css:1411` | `.grouped-list__item` | `background-color` | 150ms | Sí |
| `components.css:1477-1478` | `.modal` | `opacity`, `visibility` | 220ms | Sí |
| `components.css:1499` | `.modal__dialog` | `transform` | 220ms | Sí |
| `components.css:1602-1603` | `.progress-bar__fill` | `width`, `background` | 320ms / 150ms | Sí |
| `screens.css:207-209` | `.foto-area` | `border-color`, `background-color`, `transform` | 150ms | Sí |
| `screens.css:294` | `.foto-area--filled .foto-area__trigger` | `opacity` | 150ms | Sí |
| `screens.css:333` | `.flow-track` | `transform` | 420ms | Sí |
| `screens.css:344-347` | `.flow-track` (reduced-motion) | `transition-duration` | 0.01ms | Sí — Override explícit addicional |
| `screens.css:365-366` | `.step-back` | `background-color`, `transform` | 150ms | Sí |
| `screens.css:483-484` | `.budget-pill` | `background-color`, `color` | 150ms | Sí |
| `screens.css:537-538` | `.week-day` | `transform`, `box-shadow` | 150ms | Sí |
| `screens.css:818-819` | `.swap-option`, `.alt-option` | `border-color`, `background-color` | 150ms | Sí |
| `screens.css:980-981` | `.compra-item` | `background-color`, `border-color` | 150ms | Sí |
| `screens.css:1003-1005` | `.compra-item__check` | `background-color`, `border-color`, `transform` | 150ms | Sí |

### JavaScript — animacions dirigides per codi

| Ubicació | Mecanisme | Descripció | Coberta? |
|---|---|---|---|
| `js/setmana.js:90` | `element.style.transform = 'translateX(-N%)'` | Canvi de step al flow horitzontal. Activa la `transition` de `.flow-track` (screens.css:333). | Sí — la transició CSS que activa és `transition: transform 420ms`, coberta pel reset global i per l'override explícit de `screens.css:344-347` |
| `js/shared.js:134` | `requestAnimationFrame` + `classList.add('toast--visible')` | Retarda un frame l'afegit de classe per permetre que el navegador pinti l'estat inicial i dispari la transició CSS. No és un rAF en loop: s'executa un sol cop. | Sí — la transició CSS que activa és la de `.toast`, coberta pel reset global i per `components.css:1179-1181` |
| `js/shared.js:469` | `requestAnimationFrame` (en loop per throttle) | Scroll-hide del footer CTA. El rAF s'usa com a throttle d'events de scroll, no per animar cap propietat: llegeix `scrollY` i afegeix/elimina classe CSS. | Sí — les transicions CSS que activen (`footer-cta opacity/transform`) estan cobertes pel reset global |
| `js/setmana.js:104` | `window.scrollTo({ behavior: 'smooth' })` | Scroll vertical al top en canviar de step. | Sí — `scroll-behavior: auto !important` del reset global anul·la `smooth` |
| `js/dashboard.js:248-250` | `classList.add/remove('fab--pulse')` | Afegeix/elimina animació pulse al FAB. | Sí — el reset global clamp a 0.01ms + 1 iteració |

---

## Anàlisi de riscos específics

### `flow-track` (risc identificat a la tasca)

`.flow-track` té `transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1)`
definit a `screens.css:333`. Quan `setmana.js:90` aplica
`element.style.transform = 'translateX(-N%)'`, el navegador activa aquesta
transició CSS. El reset global clamp la `transition-duration` a `0.01ms`, de
manera que el canvi és instantani. A més, hi ha un override explícit a
`screens.css:344-347` que ho confirma:

```css
@media (prefers-reduced-motion: reduce) {
  .flow-track { transition-duration: 0.01ms; }
}
```

**Conclusió**: cobert per doble via (reset global + override explícit). Cap gap.

### Toast amb `requestAnimationFrame`

El rAF de `shared.js:134` s'usa per forçar un repaint entre inserció al DOM i
afegit de classe, de manera que la transició CSS (opacity + transform) s'activi
correctament. El rAF en si no anima res: simplement difereix una operació de
DOM un frame. La transició que en resulta és `transition-duration: 220ms`,
coberta pel reset global. Override explícit addicional a `components.css:1179`.

### Scroll suau de JS (`window.scrollTo`)

`setmana.js:104` crida `window.scrollTo({ top: 0, behavior: 'smooth' })`.
El reset global inclou `scroll-behavior: auto !important`, que s'aplica a
l'element `html` (el scroll container arrel). Quan `prefers-reduced-motion`
és actiu, el scroll és instantani.

---

## Gaps identificats

Cap. Totes les animacions i transicions del prototip estan cobertes per:

1. **Reset global** a `base.css:217-226` — cobreix tots els selectos CSS i JS
   que activin `animation-duration` o `transition-duration` estàndards, i
   `scroll-behavior`.

2. **Overrides específics** addicionals (redundants però explícits):
   - `components.css:687-689` — `.semafor-cell--pulse`: `animation: none`
   - `components.css:1179-1181` — `.toast`: `transition-duration: 0.01ms`
   - `components.css:1311-1315` — `.bottom-sheet__panel` + `__backdrop`: `transition-duration: 0.01ms`
   - `screens.css:344-347` — `.flow-track`: `transition-duration: 0.01ms`

---

## Conclusió

El prototip compleix WCAG 2.3.3. El reset global de `base.css` és suficient per
cobrir tots els casos. Les 4 overrides explícites existents als components més
crítics (semàfor, toast, bottom-sheet, flow-track) proporcionen seguretat
addicional per a aquells components on la transició té un impacte visual
notable.

No s'han afegit noves overrides: no eren necessàries.
