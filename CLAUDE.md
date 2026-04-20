# SnapEat — Context durable per a Claude Code

> Llegeix primer això i després `HANDOFF.md`. Ets a dins d'un prototip actiu
> d'una app per a un projecte universitari. Treballar bé aquí requereix
> entendre la persona, les restriccions i les decisions ja preses.

## Qui i què

- **SnapEat** — prototip funcional d'app de registre nutricional + planificació setmanal per a estudiants universitaris.
- **Curs**: Factors Humans i Computació (FHiC), Universitat de Barcelona, Grau d'Enginyeria Informàtica, 2025-26.
- **Grup B3**: Alex Matos, Pol Durán, Kai Oliveros.
- **Pes P3**: 42% de la nota. Rúbrica valora: aspectes formals, arquitectura d'info, prototips conceptuals (25%), front-end (35%), planificació + realització + informe de test usabilitat.
- **Stack**: HTML + CSS + JavaScript **vanilla**. Zero dependències externes, zero CDNs.
- **Target device**: iPhone 13 (390×844), viewport-fit cover. PWA amb add-to-home-screen.

## Persona: Laura Torres

- 20 anys, estudiant de Dret a UB, primer any vivint sola.
- **Zero cooking skills**. Cuina pasta i microondes.
- **30-35 €/setmana** en menjar. Pressupost ajustat.
- Ha rebutjat MyFitnessPal i Yazio per **llenguatge deficit** (numèric, vermell, jutjador).
- Cites textuals clau (de les entrevistes a `P2/recerca/`):
  - "Necessito que sigui súper fàcil i que no hagi de decidir gaire."
  - "Les calories em posen nerviosa. Els colors són més fàcils."
  - "No necessito que una app m'ho recordi constantment que menjo malament. Ja ho sé!"
  - "Que algú em digui 'fes això' i ja està."
- **Requisits no negociables** derivats de la persona:
  1. Zero números de calories. Colors del semàfor sempre.
  2. Receptes <15 min, <5 ingredients, amb passos clars.
  3. Registrar un àpat en <30 segons.
  4. To propositiu: sempre proposar un gest, mai constatar un defecte.
  5. Pressupost visible sempre. Alertes en càlid, no en alarma.

## Restriccions no negociables

1. **Tot en català**: microcopy d'usuari, comentaris de codi, commits. Excepció: termes tècnics universals (CSS properties, APIs).
2. **No frameworks**: ni React, Vue, Tailwind, jQuery, ni cap lib JS/CSS externa. Tot vanilla.
3. **Mobile-first a 390×844**. Desktop és adaptació amb `max-width`.
4. **WCAG 2.1 AA**: contrast ≥4.5:1 (text), focus visible 2px, aria-labels, touch targets ≥44×44px, `prefers-reduced-motion` respectat, labels sempre per a inputs.
5. **Arquitectura d'informació de P2 preservada**: 3 tabs (Avui, La meva setmana, Perfil) + FAB. No afegir tabs, no eliminar seccions principals.
6. **No watermarks d'AI**: cap menció a Claude/Anthropic/IA a commits, comentaris o codi visible. Alex declara l'ús d'IA externament a la memòria acadèmica.

## Filosofia: Coach+Toolkit sobre base iOS-clean

**Coach+Toolkit** (decidit a P2): microcopy empàtica dins de components eficients. El to sempre proposa un gest concret, mai reporta un dèficit.

Exemples del llenguatge correcte:
- ✅ "Un plat verd i ho tens"
- ✅ "Afegeix un ou o iogurt"
- ✅ "Una mica més de verdures al sopar"
- ❌ "Et falten verdures" (deficit)
- ❌ "No has menjat prou proteïna" (jutjador)
- ❌ "Ja has gastat el 90% del pressupost" (alarmista)

**iOS-clean** (adoptat al llarg de les iteracions): patrons d'Apple HIG i iOS 17+ (Reminders, Health, Settings, Maps). Concretament:

- **Bottom-sheets** per a detall (mai modals centrats). Vegeu `shared.bottomSheet()`.
- **Sticky footer CTA** amb blur en lloc de barra completa (vegeu `.footer-cta`).
- **Tab-bar flotant càpsula** amb marge lateral i inferior, blur backdrop, shadow marcada.
- **Grouped-inset lists** estil Settings (vegeu `.grouped-list`).
- **Tints subtils** per a surfaces grans: `rgba(color, 0.08-0.12)` en lloc de pastels saturats. Els tokens `--color-*-tint` existeixen expressament per això.
- **Toasts estil Live Activity**: pill arrodonit top-center, un a la vegada (substitueix, no apila).
- **Topbar inline**: el brand "SnapEat" és part del scroll natural, NO una barra sencera amb blur.
- **Floating CTA, no barra blanca**: el contenidor de la CTA és transparent; només el botó flota amb la seva ombra pròpia.

## Arquitectura del codi

### Estructura de fitxers

```
prototip/
├── index.html          Dashboard "Avui" (semàfor + àpats)
├── registrar.html      Nou àpat (foto + nom + extras)
├── setmana.html        Flow de 5 passos amb slide horitzontal
├── perfil.html         Preferències + pressupost
├── manifest.webmanifest PWA manifest
├── assets/
│   ├── icons/          Icones SnapEat (SVG + PNG 180/192/512)
│   └── photos/         Fotografies per a receptes
├── css/
│   ├── variables.css   Tokens (colors, tipo, espaiat, motion)
│   ├── base.css        Reset + utilitats (.visually-hidden, .hidden)
│   ├── components.css  Botons, cards, FAB, tab-bar, bottom-sheet, etc.
│   ├── layout.css      Container, retícula, safe-area
│   └── screens.css     Estils per pantalla + flow horitzontal
└── js/
    ├── data.js         Capa de dades (localStorage, receptes, menús)
    ├── shared.js       Utilitats (toast, confirm, bottom-sheet, PWA fixes)
    ├── dashboard.js    Lògica Dashboard
    ├── registrar.js    Lògica Registrar (inclou CTA condicional)
    ├── setmana.js      Lògica Setmana (flow horitzontal entre 5 steps)
    └── perfil.js       Lògica Perfil
```

### Mòduls JS exposats

- `window.SnapEat.data` — accessor de localStorage, generació de menús, alternatives, analyzeMeal, `getRecipes()` (aplica PORTION_FACTOR).
- `window.SnapEat.shared` — `showToast`, `confirm`, **`bottomSheet`**, `formatPrice`, `formatTime`, `icon`, `escapeHtml`, etc.

### Sistemes reutilitzables

- **Bottom-sheet** (`shared.bottomSheet`): panell lliscant des de baix amb backdrop blur, drag handle, safe-area, focus trap. API: `{ title, bodyHtml, actions: [{ label, variant, onClick, closeOnClick }] }`. Totes les modals van per aquí (recepta, swap d'àpat, alternativa d'ingredient).
- **Sticky footer CTA** (`.footer-cta`, `.footer-cta--above-tabs`): contenidor transparent, només el botó flota. La variant `--above-tabs` el posa sobre el tab-bar flotant. `.footer-cta--hidden` l'oculta (registrar incomplet). `.footer-cta--hidden-scroll` l'oculta en scroll-down.
- **Grouped-inset list** (`.grouped-list`, `.grouped-list__item`, `.grouped-list-heading`): patró Settings iOS. Dividers prims entre ítems.
- **Flow horitzontal** (`.flow-container`, `.flow-track`, `.flow-step`): slide entre passos. JS fa `translateX(-N×100%)` al track. Setmana l'usa.
- **Toast system** (`.toast`, `.toast--success/info/error`): pill top-center amb blur. Un actiu alhora.

## Decisions clau (context que el codi no revela)

### PORTION_FACTOR = 0.65

Els preus del catàleg `RECIPES` a `data.js` estan dimensionats per 2 porcions (hàbit casolà). `getRecipes()` aplica un factor 0.65 al `preu_aprox` perquè representi 1 porció. Els preus d'ingredients **no** s'escalen: al súper compres el pack sencer. Conseqüència: recepta mostra "2,55 €" (porció), shopping list mostra preu real de compra.

### Algoritme de generació de menú

1. `targetPerMeal = budget / 14` (7 dinars + 7 sopars).
2. Receptes ordenades per `|preu - target|`.
3. Greedy per dies: per cada dia calculem `dayBudget = remaining / daysLeft`.
4. Dinar ~55% de `dayBudget`, sopar la resta.
5. Si cap cap dins del límit, agafem la més barata disponible.

Resultat típic: budget 30 € → menú 27-29 €. Sempre dins o molt a prop.

### Registrar: CTA condicional

El botó "Registrar àpat" està amagat (`footer-cta--hidden`) fins que **foto + nom** són presents. La detecció automàtica (mock) posa un nom al fer la foto, així el CTA apareix amb una sola acció. Veure `updateCtaVisibility()` a `registrar.js`.

### Dashboard: filtre d'àpats d'avui

`data.getMealsToday()` filtra per camp `fecha` (YYYY-MM-DD local, no UTC). Els àpats antics persisteixen al localStorage (podríem alimentar mètriques futures) però no embruten "El teu dia". Fallback: àpats sense `fecha` es tracten com d'avui (compatibilitat retroactiva amb mocks).

### Jerarquia visual tab-bar vs sticky CTA

- **Tab-bar càpsula**: prominent, alçada `var(--tab-bar-height)` (72px), shadow marcada. És la navegació permanent.
- **Sticky CTA** (amb `--above-tabs`): 44px alçada, padding lateral extra (`var(--space-7)`), shadow suau. Secundari visualment — l'acció del moment no competeix amb la navegació.
- **Sticky CTA a registrar** (sense tab-bar): torna a ser primari. 52px, shadow forta. És l'acció única de la pantalla.

### Scroll hide CTA

`shared.wireFooterCtaScroll()`: scroll-down amaga el CTA, scroll-up el mostra. Threshold 8px (anti-flicker), `requestAnimationFrame` per rendiment, sempre visible prop del top (<80px) o al fons de la pàgina. Pattern iOS Mail.

### PWA navegació standalone a iOS

Per defecte iOS obre `<a href>` interns d'una PWA standalone en una pestanya de Safari. `shared.handleStandaloneNavigation()` detecta mode standalone i intercepta els clics per forçar `location.href` i mantenir el context app.

## Com treballar amb Alex

### Estil d'interacció

- **Directe**: diu el que pensa sense cerimonial. Prefereix resposta breu amb recomanació concreta.
- **Crític**: espera opinió honesta, també del seu propi codi/decisions. Si creus que una idea seva no és bona, explica per què amb evidència (entrevista, heurística, captura). No siguis servil.
- **Velocitat**: quan diu "fes-ho tot" vol tirar endavant. Quan diu "què en penses?" vol la teva opinió abans d'actuar.
- **Llengua**: català sempre. Codi i commits també en català.
- **Iteratiu**: li agrada veure captures entre canvis. Usa els scripts `/tmp/screenshot-*.js` per validar.
- **Compromís amb "iOS-clean"**: si un element no sembla d'una app iOS nativa, no està acabat.

### Decisions d'abast

- **Canvis petits**: fes-los directament, amb commit descriptiu.
- **Refactors o decisions amb tradeoffs**: proposa 2-3 opcions amb pros/cons abans de codificar.
- **Canvis globals d'arquitectura**: sempre pregunta primer. Alex té visió del conjunt.

### Commits

- Missatges clars en català, 1-4 punts explicant el "per què" (no el "què" — el diff ho mostra).
- **Sense watermarks d'AI**: prohibit incloure "Co-Authored-By Claude" o similars.
- Branca `main` directament. GitHub Pages fa auto-deploy.

## Scripts útils

- `node /tmp/screenshot-snapeat.js` — captures de les 4 pantalles base (localStorage buit).
- `node /tmp/screenshot-with-data.js` — captures amb dades sembrades (dashboard amb àpats, flow setmana sencer, bottom-sheet de recepta).
- `node /tmp/generate-icons.js` — regenera icones PNG a 180/192/512 des del SVG.

## Git + deploy

- Repo: `github.com/amatosolivework/snapeat-prototip`, branca `main`.
- Auto-deploy a GitHub Pages: `https://amatosolivework.github.io/snapeat-prototip/` (~1 min després del push).
- La carpeta `prototip/` és un repo git independent dins de `FHiC/`.

## Context acadèmic addicional

- La memòria LaTeX viu a `../P2/main-final.tex` (consolidada). Cap canvi al prototip ha de trencar-la. Si cal afegir una secció P3, fes-ho allà.
- Els instruments de test d'usabilitat ja estan finalitzats a `../test/`. **No tocar**.
- Cal realitzar test amb ≥4 usuaris (rúbrica P3). Dades i informe a produir abans de l'entrega.
- Captures versionades per iteració a `../captures/` (audit-despres, audit-v3, audit-v4).

---

**Per continuar**: llegeix `HANDOFF.md` a continuació per veure l'estat actual i els pendents oberts.
