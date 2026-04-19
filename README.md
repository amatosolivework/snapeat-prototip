# SnapEat — Prototip funcional

Prototip funcional d'alta fidelitat de SnapEat, una app de registre nutricional per a estudiants universitaris amb enfocament visual (semàfor de colors, no calories) i to no jutjador.

## Context acadèmic

- **Assignatura:** Factors Humans i Computació (FHiC), 25-26
- **Universitat:** Universitat de Barcelona, Enginyeria Informàtica
- **Pràctica:** P3 — Prototip funcional i avaluació
- **Grup B3:** Alex Matos Olivé, Pol Durán Valdivia, Kai Oliveros Gonzalez

## Demo

Accessible via GitHub Pages: https://amatosolivework.github.io/snapeat-prototip/

## Estructura

```
prototip/
├── index.html          # Dashboard "Avui" — tasca 1
├── registrar.html      # Flux de registre d'àpat
├── setmana.html        # Planificació setmanal — tasca 2
├── perfil.html         # Configuració personal
├── css/                # Variables, components, layout, pantalles
├── js/                 # Lògica de les tasques i dades simulades
└── assets/             # Icones SVG i imatges
```

## Tecnologies

HTML5 + CSS3 (custom properties, flex, grid) + JavaScript vanilla ES6+. Sense frameworks ni dependències externes. Dades simulades en localStorage.

## Persona objectiu

Laura Torres, 20 anys, estudiant de Dret a la UB. Pressupost 30-35€/setmana, zero habilitats culinàries, alta competència tecnològica. Vol menjar millor sense ansietat ni números.

## Accessibilitat

Disseny conforme a WCAG 2.1 AA. Contrast mínim 4.5:1, navegació per teclat completa, etiquetes textuals als indicadors de colors, suport per a `prefers-reduced-motion`.
