# Auditoria Lighthouse + axe DevTools — 2026-04-21

Validació final de compliment WCAG AA a les 4 pantalles del prototip SnapEat, executada amb Chrome DevTools Lighthouse i l'extensió axe DevTools. Criteris d'èxit definits a l'spec `2026-04-21-auditoria-wcag-aa.md` §5 (AC1 i AC2).

---

## Criteris d'acceptance

- **AC1:** Lighthouse Accessibility score ≥ **95** a cada pantalla (mode mobile, viewport iPhone 13).
- **AC2:** axe DevTools: **0 errors critical** i **0 errors serious** a cada pantalla.

Si algun criteri no es compleix, documenta els problemes a la secció corresponent i obre una tasca correctiva al pla abans de tancar T20.

---

## Setup previ

1. Executa el prototip localment:
   ```bash
   cd /Users/amatosolive/Uni/FHiC/P3/prototip
   python3 -m http.server 8080
   ```
   O similar. No pots auditar amb protocol `file://` directament — Chrome bloqueja alguns checks d'accessibilitat.

2. Obre Chrome i navega a `http://localhost:8080`.

3. Activa el mode responsive (DevTools → Toggle device toolbar) i tria **iPhone 13** (390×844). Si no està a la llista, afegeix-lo manualment: 390×844, DPR 3, iOS user agent.

4. Sembra localStorage amb dades per a una auditoria més realista:
   - A la pestanya Console de DevTools, executa:
     ```js
     // Sembrar pressupost, preferències, pla i alguns àpats
     localStorage.setItem('snapeat:budget', '30');
     localStorage.setItem('snapeat:meals', JSON.stringify([
       { id: 'meal-1', nom: 'Amanida de pollastre i alvocat', extras: [], indicadors: { hidrats: 'ok', verdures: 'ok', proteina: 'ok' }, hora: '13:30', fecha: (new Date()).toISOString().slice(0,10), createdAt: (new Date()).toISOString() }
     ]));
     location.reload();
     ```
   - Això fa que el dashboard tingui un àpat visible per al check.
   - Per a `setmana.html` amb dades: genera un menú manualment al flow.

---

## Resultats Lighthouse

Executar per cada pantalla: DevTools → Lighthouse → Accessibility only → Mobile → "Analyze page load".

| Pantalla | Data/hora | Score | Notes |
|---|---|---|---|
| `index.html` (empty) | | __ / 100 | |
| `index.html` (with data) | | __ / 100 | |
| `registrar.html` | | __ / 100 | |
| `setmana.html` (empty) | | __ / 100 | |
| `setmana.html` (menu step) | | __ / 100 | |
| `setmana.html` (compra step) | | __ / 100 | |
| `perfil.html` | | __ / 100 | |

**AC1 complert:** ☐ (tots ≥ 95)

### Problemes trobats

[Per a cada pantalla que tingui score < 100, anotar aquí els audits marcats en vermell o ambre i la seva causa.]

---

## Resultats axe DevTools

Extensió necessària: [axe DevTools de Deque](https://www.deque.com/axe/devtools/).

Executar per cada pantalla: obrir DevTools → pestanya axe DevTools → "Scan all of my page".

| Pantalla | Critical | Serious | Moderate | Minor |
|---|---|---|---|---|
| `index.html` (empty) | __ | __ | __ | __ |
| `index.html` (with data) | __ | __ | __ | __ |
| `registrar.html` | __ | __ | __ | __ |
| `setmana.html` (empty) | __ | __ | __ | __ |
| `setmana.html` (menu) | __ | __ | __ | __ |
| `setmana.html` (compra) | __ | __ | __ | __ |
| `perfil.html` | __ | __ | __ | __ |

**AC2 complert:** ☐ (0 critical + 0 serious a totes)

### Problemes trobats

[Per a cada error critical o serious, anotar: regla violada, element afectat, how to fix. Si apareixen moderate/minor, anotar-los també per traçabilitat però no bloquegen AC2.]

---

## Conclusió

[Un cop omplerts els resultats: confirmar que AC1 i AC2 es compleixen. Si no, obrir tasques correctives al pla abans de tancar T20.]

## Captures

Desar captures de Lighthouse i axe (final score visible) a `docs/audits/img/` i enllaçar-les aquí.
