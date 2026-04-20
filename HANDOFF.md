# HANDOFF — Estat actual de SnapEat

> Document viu. Actualitza'l quan canvies l'estat de l'app.

**Última sessió**: 2026-04-20
**Últim commit**: `ca15875` — "Flow horitzontal setmana + àpat hero + mini-semàfor H/V/P + scroll hide CTA"

## Què funciona (verificat amb captures a `/tmp/snapeat-*.png`)

### Dashboard (`index.html`)
- Topbar brand inline (no sticky bar amb blur).
- Semàfor de 3 cèl·lules amb **tints subtils** (rgba 8-10%) i microcopy forward-looking.
- Hints propositius sota cada cèl·la quan no està en OK ("Un bol d'arròs o pasta", "Un grapat d'enciam o bròquil").
- Banner Coach amb suggeriment dinàmic.
- **Àpat hero card**: foto 16:10 full-width al top, hora overlay blur top-right, nom H3 bold, extras amb separador ·, chips macro H/V/P amb cercle de color + etiqueta (`chip-macro--ok/warn/bad`).
- Empty state amb CTA directe "Fer foto" enllaçant a registrar.
- FAB visible sempre (excepte amb teclat obert).
- Tab-bar flotant càpsula a baix.

### Registrar (`registrar.html`)
- Topbar amb botó "Cancel·lar" + títol "Nou àpat".
- Photo-area amb **solid 1px border soft** (no dashed) sobre `surface-subtle`.
- Input de nom amb detecció automàtica mock quan es fa la foto.
- Chips d'extres + input lliure per escriure'n.
- **Sticky CTA "Registrar àpat"** amagat fins que hi ha foto + nom. Apareix amb transició suau quan es compleixen les dues condicions.

### La meva setmana (`setmana.html`)
- **Flow horitzontal de 5 steps**: pressupost → menú → llista → mode compra → resum.
- Botó back (chevron-left iOS) al topbar, apareix a partir del step 2.
- H1 i subtitle es renoven per step (veure `STEP_META` a `setmana.js`).
- **Sticky CTA únic** que canvia de label per step: "Generar menú setmanal" → "Perfecte! Generar llista de compra" → "Vaig al súper" → "Compra feta".
- Transició spring de 420ms entre steps. Respecta `prefers-reduced-motion`.
- **Menú**: mini-semàfor per dia amb cercles 22×22 i lletres H/V/P en blanc, budget pill amb tints segons estat (brand-soft, warn, bad), meal cards amb 2 badges (temps + preu).
- **Recepta** (bottom-sheet): chips de meta (temps · utensili · dificultat · preu), grouped-list d'ingredients amb quantitats alineades, passos numerats amb cercles brand-soft, botó "Canviar aquest àpat".
- **Swap d'àpat** (bottom-sheet): 3 alternatives amb radio, preview subline de meta.
- **Llista de compra**: grouped-list per categoria amb emoji + nom + quantitat + preu.
- **Mode compra**: compra-status amb progress bar de pressupost (verda → ambar → vermell segons %), items tàctils amb check circular iOS 44×44, alternatives bottom-sheet per cada ingredient.
- **Resum**: barra de progrés + banner d'èxit + link tornar al dashboard.

### Perfil (`perfil.html`)
- Identity card plana (sense gradient).
- Preferències en **grouped-list** estil Settings amb dividers prims.
- Feedback toast al guardar preferències i pressupost.
- "Sobre SnapEat" també en grouped-list.

### Global
- **Toasts pill top-center** amb blur + tint. Un actiu alhora (substitueix en lloc d'apilar). Variants success (verd), error (vermell pastís), info (blanc).
- **PWA**: icones + manifest + fix navegació standalone a iOS (`shared.handleStandaloneNavigation`). "Afegir a pantalla d'inici" funciona i els tabs no obren Safari.
- **CTA scroll behaviour**: s'amaga en scroll-down, apareix en scroll-up o al fons. Threshold 8px anti-flicker.

## Algoritme del menú (verificat)

- Budget 30 € → menú típic **27-29 €** (dins pressupost).
- Ordena receptes per proximitat a `budget/14` i reparteix pressupost restant per dies.
- PORTION_FACTOR 0.65 aplicat a preus de receptes al `getRecipes()`.

## Pendents oberts (no bloquejants)

- [ ] **`shared.confirm`** (eliminar àpat al dashboard) encara és modal centrat amb inline styles. Podria migrar-se a bottom-sheet per consistència.
- [ ] **Tab-bar scroll-hide**: actualment només el CTA s'amaga en scroll. Podria aplicar-se també al tab-bar (pattern tipus Safari), però cal pensar què passa amb el FAB. Alex no ho ha demanat encara.
- [ ] **Bottom-sheet drag-to-dismiss**: el handle és visual. Afegir gesture drag-down-to-close seria un nice-to-have iOS-native.
- [ ] **Haptic feedback**: no disponible al web (vibration API limitada). Deixar per a futur native.
- [ ] **Test d'usabilitat amb ≥4 usuaris**: requeriment P3. Els instruments estan a `../test/`. Cal recopilar dades i escriure l'informe.
- [ ] **LaTeX de la memòria** (`../../P2/main-final.tex`): cal afegir secció P3 descrivint les iteracions del prototip i les decisions. Comprova que compila abans de cada commit que toqui el LaTeX.

## Possibles millores futures (idees flotants)

- **Dashboard**: fer la greeting dinàmica segons hora del dia ("Bon dia, Laura", "Com va, Laura?", "Bona tarda"...). Ara és estàtic "Com vas".
- **Setmana menú**: arrossegar dies per reordenar. Complex, baixa prioritat.
- **Mode compra**: ordenar automàticament per ruta típica del súper (Mercadona, Bonpreu) — requereix dades extra.
- **Perfil**: afegir estats "Com vols cuinar avui?" (ràpid, sense forn, etc.) que influeixin en el menú.
- **Historial**: pantalla de consulta d'àpats passats. Ja tenim la data `fecha` a cada àpat.

## Arbre d'iteracions recents

| # | Iteració | Canvi | Commit |
|---|---|---|---|
| 1 | audit-v3 | Microcopy forward-looking, metadata cocció, swap àpat, filtre avui, badges temps+utensili+dificultat+preu | `77ea9b4` |
| 2 | audit-v4 iOS | Bottom-sheets, grouped-list, sticky CTA, passos recepta, perfil grouped, dashboard tints | `16aac04` |
| 3 | fixes | Floating CTA (sense barra blanca), brand inline, budget fix (PORTION_FACTOR + algoritme greedy) | `c754d8b` |
| 4 | PWA + tab-bar | Tab-bar càpsula flotant, icones PWA + manifest, CTA condicional registrar, jerarquia CTA secundari | `7d35b31` |
| 5 | PWA nav | Interceptor de links en mode standalone iOS | `f808a75` |
| 6 | Toasts | Pill top-center Live Activity, no apilats | `a1b45a8` |
| 7 | Flow horitzontal | Slide entre 5 steps setmana, hero àpat, H/V/P labels, scroll hide CTA | `ca15875` |

## Captures de referència

- `../captures/audit-despres/` — versió pre-iteracions (per comparar)
- `../captures/audit-v3/` — primera iteració
- `../captures/audit-v4/` — segona iteració (pre-iOS polish)
- `/tmp/snapeat-*.png` — últimes captures. Regenera amb:
  ```bash
  node /tmp/screenshot-snapeat.js && node /tmp/screenshot-with-data.js
  ```

## Com continuar en una sessió nova

1. Obre Claude Code a `/Users/amatosolive/Uni/FHiC/P3/prototip/`.
2. Digues: **"Llegeix CLAUDE.md i HANDOFF.md i continua treballant"**.
3. El Claude nou carregarà persona, restriccions, arquitectura i estat actual.
4. Plugin `frontend-design` disponible per a millores de UI — invocable amb menció explícita.

## Plugins actius útils

- `frontend-design`: crea components UI polits, evita aesthetic genèric d'IA.
- `superpowers:brainstorming`: per explorar requisits amb Alex abans de codificar.
- `superpowers:writing-plans`: si cal escriure un pla previ a canvis grans.
- `pr-review-toolkit:review-pr`: revisió completa d'un PR.

---

**Última verificació**: `main-final.pdf` compila net (34 pàgines). Deploy GitHub Pages OK a `amatosolivework.github.io/snapeat-prototip/`.
