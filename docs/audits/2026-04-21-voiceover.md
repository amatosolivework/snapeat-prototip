# VoiceOver manual checkpoint — 2026-04-21

Validació puntual amb VoiceOver a Safari (macOS) als elements on el code review no pot garantir que sonin bé en veu. No és un test exhaustiu — cobrim els punts crítics identificats al brainstorming.

---

## Setup

1. Activa VoiceOver: `Cmd+F5` (o Settings → Accessibility → VoiceOver).
2. Obre Safari (VoiceOver s'integra millor amb Safari que amb Chrome).
3. Navega a `http://localhost:8080` amb dades sembrades (veure setup de `2026-04-21-lighthouse-axe.md`).

## Escenaris a validar

### E1: Semàfor del dashboard

A `index.html`. Navega amb `Ctrl+Alt+Right` fins a una cel·la del semàfor.

**Esperat:** "Hidrats: Una mica alts. Un petit ajust ho arregla. Article." (o similar segons estat).

**Prohibit:** la paraula "warn", "bad", "ok" al contingut llegit.

- [ ] Hidrats OK → llegeix "Hidrats al punt"?
- [ ] Verdures warn → llegeix "Afegeix-ne un toc més"?
- [ ] Proteïna bad → llegeix "Afegeix un ou o iogurt"?

### E2: Chips H/V/P dels àpats d'avui

Al mateix `index.html`, a un àpat registrat, navega fins al chip H.

**Esperat:** "Hidrats: Hidrats al punt" (frase Catalan completa, no "warn"/"bad").

- [ ] Chip Hidrats → frase català completa?
- [ ] Chip Verdures → frase català completa?
- [ ] Chip Proteïna → frase català completa?

### E3: Banner Coach

Navega fins al banner de suggeriment.

**Esperat:** El contingut del suggeriment es llegeix automàticament (via `aria-live="polite"`) quan canvia. Si navegues entre estats (p.ex. registres àpats nous), cada canvi ha de ser anunciat sense intervenció.

- [ ] Canvi de suggeriment → VoiceOver l'anuncia sol?

### E4: Toast

Dispara un toast (p.e. afegeix o elimina un àpat).

**Esperat:** VoiceOver llegeix el toast automàticament quan apareix. Si un segon toast substitueix el primer ràpidament, VoiceOver anuncia el segon.

- [ ] "Àpat registrat" → anunciat automàtic?
- [ ] "Àpat eliminat" → anunciat automàtic?
- [ ] Substitució ràpida de toasts → anuncia el nou?

### E5: Progressbar de compra

A `setmana.html`, entra al mode compra. Marca alguns ítems. Navega fins a la progressbar.

**Esperat:** "Progrés del pressupost de compra: 45 per cent. Indicador de progrés." o similar. El valor ha d'actualitzar-se quan marques nous ítems (via `aria-valuenow`).

- [ ] Progressbar inicial 0% → anunciada com a progressbar amb 0?
- [ ] Després de marcar ítems, navega de nou → anuncia el nou percentatge?

### E6: Bottom-sheet de recepta

Al menú, clica un àpat per obrir la recepta.

**Esperat:** VoiceOver anuncia "Diàleg, [nom de la recepta]". El focus queda dins del panell — Tab no el fa sortir. Esc tanca i el focus torna al botó de l'àpat.

- [ ] Obrir sheet → anuncia "diàleg"?
- [ ] Tab → no surt del panell?
- [ ] Shift+Tab des del primer element → va a l'últim?
- [ ] Esc → tanca i focus retorna?

### E7: Swap sheet (chain)

Dins de la recepta, clica "Canviar aquest àpat" per obrir el swap sheet.

**Esperat:** "Diàleg, Quin àpat et ve més bé?". Focus dins. Esc tanca i retorna al **botó de l'àpat al week plan** (no al botó "Canviar aquest àpat" que ha desaparegut).

- [ ] Anuncia diàleg?
- [ ] Esc tanca → focus va al week-day__meal-name button?

> **Nota sobre "Canviar" amb èxit:** Si l'usuari tria una alternativa i prem "Canviar", el pla setmanal es re-renderitza via `renderWeekPlan(newPlan)`, el qual destrueix el nodo `.week-day__meal-name` que havia obert el sheet. Quan el sheet es tanca, `opener.focus()` falla silenciosament (node detached) i el focus acaba al `<body>`. És un compromís acceptat per a P3; una solució robusta caldria re-querir el botó per selector després del render. Si VoiceOver es queda "sense lloc" després d'un swap reeixit, és aquest cas.

### E8: Confirm modal

Al dashboard, elimina un àpat.

**Esperat:** "Diàleg, Eliminar àpat?". Focus inicial al botó "No, tornar" (cancel). Esc resol com a cancel.

- [ ] Anuncia diàleg?
- [ ] Focus inicial a Cancel?
- [ ] Esc tanca com a cancel?

### E9: Skip link

A qualsevol pantalla, prem Tab com a primer keystroke.

**Esperat:** VoiceOver anuncia "Salta al contingut principal, enllaç". Premer Enter mou el focus al `<main>`.

- [ ] Skip link apareix al primer Tab?
- [ ] Enter mou el focus a main?

### E10: Navegació per landmarks

Usa el rotor de VoiceOver (`Ctrl+Alt+U`) i tria "Landmarks".

**Esperat:** Llista de landmarks ordenada: banner (header si existeix), navigation (tab bar, aria-label="Navegació principal"), main, complementary (si n'hi ha).

- [ ] Landmarks tenen jerarquia coherent a les 4 pantalles?

---

## Resultats globals

- [ ] E1-E10 marcats com a OK a totes les pantalles rellevants → AC3 complert.

Si trobes problemes, documenta'ls en una secció "Problemes detectats" al final i obre una tasca correctiva al pla.

## Temps estimat

~30 min per a totes les validacions. Fes-ho amb la pantalla en silenci i casc — VoiceOver llegeix ràpid i en veu alta.

## Limitacions conegudes

- **Focus restore fallback quan l'opener es destrueix:** Als chains recipe→swap, alt→item, el "Canviar" / "Triar alternativa" re-renderitza el DOM immediatament sota el sheet. El botó d'origen desapareix abans que el sheet tanqui. `opener.focus()` falla silenciosament i el focus acaba al `<body>`. Acceptat com a compromís P3; un robustiment possible: capturar opener com a CSS selector i re-querir.
