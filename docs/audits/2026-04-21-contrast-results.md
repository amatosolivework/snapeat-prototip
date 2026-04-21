# Validació de contrast WCAG 2.1 AA — 2026-04-21

Validació de totes les combinacions text/fons dels components que usen tints o colors amb tint mixing. Criteri: ≥ 4.5:1 per a text body (≥ 14px regular), ≥ 3:1 per a text gran (≥ 18px bold) i per a components no-text (borders, icones, focus outlines).

## Mètode

- Composites dels tints sobre `--color-surface` (#FFFFFF) calculats mitjançant la fórmula `composite_c = round(c_fg * α + c_bg * (1 − α))` per canal, sobre sRGB.
- Ratios de contrast calculats amb la fórmula WCAG 2.1 (gamma-corrected relative luminance).
- Per a cada canal normalitzat `c ∈ [0, 1]`: si `c ≤ 0.03928` → `c_lin = c / 12.92`; sinó → `c_lin = ((c + 0.055) / 1.055) ^ 2.4`. Lluminositat: `L = 0.2126·R + 0.7152·G + 0.0722·B`.
- Ràtio: `(L_clara + 0.05) / (L_fosca + 0.05)`.
- Referència: https://www.w3.org/TR/WCAG21/#contrast-minimum

## Colors composites calculats

| Token | Tint original | Compost sobre #FFFFFF |
|---|---|---|
| `--color-ok-tint` | rgba(5, 150, 105, 0.10) | **#E6F4F0** |
| `--color-warn-tint` | rgba(217, 119, 6, 0.10) | **#FBF1E6** |
| `--color-bad-tint` | rgba(220, 38, 38, 0.08) | **#FCEEEE** |
| `.toast--success` bg | rgba(209, 250, 229, 0.95) | **#D3FAE6** |
| `.toast--error` bg | rgba(254, 226, 226, 0.95) | **#FEE3E3** |

## Resultats

| # | Parell | Fons (hex) | Text (hex) | Ratio | AA (≥4.5:1) | AAA (≥7:1) | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Pill OK | #E6F4F0 | #065F46 | 6.79:1 | ✓ | ✗ | `.semafor-cell__pill--ok`; text 10px bold |
| 2 | Pill Warn | #FBF1E6 | #92400E | 6.36:1 | ✓ | ✗ | `.semafor-cell__pill--warn`; text 10px bold |
| 3 | Pill Bad | #FCEEEE | #991B1B | 7.36:1 | ✓ | ✓ | `.semafor-cell__pill--bad`; text 10px bold |
| 4 | Chip-macro OK | #D1FAE5 | #065F46 | 6.78:1 | ✓ | ✗ | `.chip-macro--ok`; text 11px semibold |
| 5 | Chip-macro Warn | #FEF3C7 | #92400E | 6.37:1 | ✓ | ✗ | `.chip-macro--warn`; text 11px semibold |
| 6 | Chip-macro Bad | #FEE2E2 | #991B1B | 6.80:1 | ✓ | ✗ | `.chip-macro--bad`; text 11px semibold |
| 7 | Chip mini OK | #D1FAE5 | #065F46 | 6.78:1 | ✓ | ✗ | `.chip--ok`; text 12px semibold |
| 8 | Chip mini Warn | #FEF3C7 | #92400E | 6.37:1 | ✓ | ✗ | `.chip--warn`; text 12px semibold |
| 9 | Chip mini Bad | #FEE2E2 | #991B1B | 6.80:1 | ✓ | ✗ | `.chip--bad`; text 12px semibold |
| 10 | Toast success | #D3FAE6 | #065F46 | 6.80:1 | ✓ | ✗ | `.toast--success`; text 14px medium |
| 11 | Toast error | #FEE3E3 | #991B1B | 6.85:1 | ✓ | ✗ | `.toast--error`; text 14px medium |
| 12 | Banner (extrem fosc) | #D1FAE5 | #1C1917 | 15.42:1 | ✓ | ✓ | `.banner`; gradient-fresh start; text 16px regular |
| 13 | Banner (extrem clar) | #A7F3D0 | #1C1917 | 13.64:1 | ✓ | ✓ | `.banner`; gradient-fresh end; text 16px regular |
| 14 | Text muted / surface | #FFFFFF | #44403C | 10.27:1 | ✓ | ✓ | `--color-text-muted`; text body 16px |
| 15 | Text subtle / surface | #FFFFFF | #78716C | 4.80:1 | ✓ | ✗ | `--color-text-subtle`; text 14px |
| 16 | Focus outline / surface | #FFFFFF | #2563EB | 5.17:1 | ✓ | ✗ | `--color-focus`; criteri no-text ≥3:1 |

## Conclusió

**Totes les 16 combinacions validades passen WCAG 2.1 AA.** Cap combinació falla el criteri mínim aplicable.

- **16 de 16** passen AA (ràtio ≥ 4.5:1 per a text; ≥ 3:1 per al focus outline no-text).
- **4 de 16** passen AAA (ràtio ≥ 7:1): Pill Bad (#3), Banner extrem fosc (#12), Banner extrem clar (#13), Text muted/surface (#14).
- Cap combinació requereix ajust als tokens.

### Observació sobre les pills (text 10px bold)

Les pills del semàfor usen font-size 10px amb font-weight bold. Tècnicament, WCAG 2.1 considera text "gran" a ≥ 18px regular o ≥ 14px bold; la mida 10px queda per sota del llindar "gran" i per tant el criteri aplicable és ≥ 4.5:1 (text normal). Els tres casos (6.36:1, 6.79:1, 7.36:1) superen aquest criteri amb marge. Cap acció requerida.

### Observació sobre text subtle (#78716C)

`--color-text-subtle` amb ràtio 4.80:1 sobre blanc i 4.59:1 sobre `--color-bg` passa AA per poc marge (llindar 4.5:1). S'usa exclusivament per a hints i labels secundaris. Si en el futur es vol assolir AAA caldria moure el valor cap a ≈ #6B6560 (ràtio ~5.5:1 sobre blanc). No és bloquejant per a l'entrega de P3.
