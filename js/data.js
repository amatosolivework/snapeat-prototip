/*
  data.js — Capa de dades del prototip SnapEat.
  Tot l'emmagatzematge va per localStorage amb wrappers amb fallback segur.
  Inclou també mocks per analitzar àpats, generar menús i alternatives.
*/

window.SnapEat = window.SnapEat || {};

window.SnapEat.data = (function () {
  'use strict';

  // ------------------------------
  //  Wrappers de localStorage
  // ------------------------------

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      // Si el JSON està corrupte o localStorage no disponible, retornem el fallback.
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // localStorage ple o bloquejat — ignorem silenciosament (prototip).
    }
  }

  function clear(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      // Ignorem.
    }
  }

  // ------------------------------
  //  Àpats d'avui
  // ------------------------------

  function getMeals() {
    const meals = load('snapeat:meals', []);
    return Array.isArray(meals) ? meals : [];
  }

  function addMeal(meal) {
    const meals = getMeals();
    meals.push(meal);
    save('snapeat:meals', meals);
    return meal;
  }

  function updateMeal(id, updates) {
    const meals = getMeals();
    const idx = meals.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    meals[idx] = Object.assign({}, meals[idx], updates);
    save('snapeat:meals', meals);
    return meals[idx];
  }

  function removeMeal(id) {
    const meals = getMeals().filter((m) => m.id !== id);
    save('snapeat:meals', meals);
  }

  function getMeal(id) {
    return getMeals().find((m) => m.id === id) || null;
  }

  function clearTodayMeals() {
    save('snapeat:meals', []);
  }

  // ------------------------------
  //  Pressupost
  // ------------------------------

  function getBudget() {
    const n = load('snapeat:budget', 30);
    return typeof n === 'number' && !isNaN(n) ? n : 30;
  }

  function setBudget(n) {
    save('snapeat:budget', Number(n));
  }

  // ------------------------------
  //  Pla setmanal
  // ------------------------------

  function getWeekPlan() {
    return load('snapeat:weekPlan', null);
  }

  function setWeekPlan(p) {
    save('snapeat:weekPlan', p);
  }

  // ------------------------------
  //  Llista de compra
  // ------------------------------

  function getShoppingList() {
    const l = load('snapeat:shoppingList', []);
    return Array.isArray(l) ? l : [];
  }

  function setShoppingList(l) {
    save('snapeat:shoppingList', l);
  }

  function updateShoppingItem(id, updates) {
    const list = getShoppingList();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], updates);
    setShoppingList(list);
    return list[idx];
  }

  // ------------------------------
  //  Preferències
  // ------------------------------

  function getPreferences() {
    const p = load('snapeat:preferences', null);
    const defaults = { vegetaria: false, senseGluten: false, senseLactosa: false };
    if (!p || typeof p !== 'object') return defaults;
    return Object.assign({}, defaults, p);
  }

  function setPreferences(p) {
    save('snapeat:preferences', p);
  }

  // ------------------------------
  //  Anàlisi d'àpats (mock per paraules clau)
  // ------------------------------

  // Mots clau organitzats per categoria nutricional.
  const KEYWORDS = {
    hidrats: [
      'pasta', 'pastes', 'espagueti', 'macarrons', 'tallarines', 'fideus',
      'arròs', 'arros', 'risotto', 'paella',
      'patates', 'patata', 'patatas',
      'pa ', 'entrepà', 'entrepa', 'pizza', 'quinoa', 'cuscús', 'cuscus',
      'sopa de fideus', 'crema'
    ],
    verdures: [
      'amanida', 'ensalada', 'verdur', 'verdura',
      'bròquil', 'broquil', 'espinacs', 'tomàquet', 'tomaquet', 'tomate',
      'enciam', 'lletuga', 'pebrot', 'carbassó', 'carbasso', 'carbassa',
      'albergínia', 'alberginia', 'ceba', 'pastanaga', 'cogombre',
      'mongeta tendra', 'bledes', 'col', 'coliflor', 'xampinyons', 'bolets',
      'crema de verdures', 'sopa de verdures', 'escalivada', 'samfaina'
    ],
    proteina: [
      'pollastre', 'pit de pollastre', 'gall', 'gall dindi',
      'carn', 'vedella', 'xai', 'porc', 'hamburguesa', 'llom', 'bistec',
      'ou', 'ous', 'truita', 'truita de',
      'peix', 'salmó', 'salmo', 'tonyina', 'bacallà', 'bacalla', 'lluç', 'lluc',
      'gambes', 'calamars', 'musclos',
      'llenties', 'cigrons', 'mongetes', 'llegum', 'llegums', 'fesols',
      'tofu', 'seità', 'seita', 'tempeh',
      'formatge', 'iogurt', 'cottage'
    ]
  };

  function containsAny(text, list) {
    const t = ' ' + text.toLowerCase() + ' ';
    return list.some((kw) => t.indexOf(kw) !== -1);
  }

  // Retorna { hidrats, verdures, proteina } per a un àpat individual,
  // amb valors 'ok' | 'warn' | 'bad'. Aquest és un mock heurístic per al prototip.
  function analyzeMeal(nom) {
    const text = String(nom || '').toLowerCase();
    const result = { hidrats: 'bad', verdures: 'bad', proteina: 'bad' };

    const hasHidrats = containsAny(text, KEYWORDS.hidrats);
    const hasVerdures = containsAny(text, KEYWORDS.verdures);
    const hasProteina = containsAny(text, KEYWORDS.proteina);

    // Per defecte: si hi és, ok; si no hi és, bad.
    if (hasHidrats) result.hidrats = 'ok';
    if (hasVerdures) result.verdures = 'ok';
    if (hasProteina) result.proteina = 'ok';

    // Casos especials que activen "warn":
    // - "carbonara" o "nata" o "crema de llet" marca hidrats com a warn (massa greix).
    if (text.indexOf('carbonara') !== -1 || text.indexOf('nata') !== -1 || text.indexOf('crema de llet') !== -1) {
      result.hidrats = 'warn';
    }
    // - "fregit" o "fregits" marca la proteïna com a warn.
    if (text.indexOf('fregit') !== -1 || text.indexOf('arrebossat') !== -1) {
      if (hasProteina) result.proteina = 'warn';
    }
    // - Patates fregides: warn als hidrats.
    if (text.indexOf('patates fregides') !== -1 || text.indexOf('xips') !== -1) {
      result.hidrats = 'warn';
    }
    // - Pizza: warn per defecte (hidrats alts i greix).
    if (text.indexOf('pizza') !== -1) {
      result.hidrats = 'warn';
    }

    return result;
  }

  // Agrega els indicadors de tots els àpats d'un dia a un únic semàfor.
  //  - Si cap àpat aporta 'ok' en una categoria → 'bad' per aquella categoria.
  //  - Si només 1 àpat aporta 'ok' → 'warn' (encara és poc).
  //  - Si 2 o més àpats aporten 'ok' → 'ok'.
  //  Els 'warn' individuals es conten com a parcialment positius.
  function aggregateIndicadors(meals) {
    const agg = { hidrats: 'bad', verdures: 'bad', proteina: 'bad' };
    if (!meals || !meals.length) return agg;

    const counts = { hidrats: 0, verdures: 0, proteina: 0 };
    const warnCounts = { hidrats: 0, verdures: 0, proteina: 0 };

    meals.forEach((m) => {
      const ind = m.indicadors || analyzeMeal(m.nom || '');
      ['hidrats', 'verdures', 'proteina'].forEach((k) => {
        if (ind[k] === 'ok') counts[k] += 1;
        else if (ind[k] === 'warn') warnCounts[k] += 1;
      });
    });

    ['hidrats', 'verdures', 'proteina'].forEach((k) => {
      if (counts[k] >= 2) agg[k] = 'ok';
      else if (counts[k] === 1) agg[k] = 'warn';
      else if (warnCounts[k] > 0) agg[k] = 'warn';
      else agg[k] = 'bad';
    });

    // Cas especial: si un únic àpat té ja 'warn' per excés (hidrats excessius),
    // el propaguem a l'agregat per donar-ho a conèixer.
    meals.forEach((m) => {
      const ind = m.indicadors || analyzeMeal(m.nom || '');
      if (ind.hidrats === 'warn' && agg.hidrats === 'ok') agg.hidrats = 'warn';
    });

    return agg;
  }

  // ------------------------------
  //  Catàleg de receptes
  // ------------------------------

  // Cada recepta: { id, nom, ingredients, temps_min, preu_aprox, categoria, etiquetes }
  // ingredients: [{ nom, quantitat, categoria, preuAprox }]
  // categoria de recepta: 'dinar' | 'sopar' | 'ambdos'
  // etiquetes: subset de ['vegetaria','senseGluten','senseLactosa','rapid','economic']
  const RECIPES = [
    {
      id: 'r-01',
      nom: 'Arròs amb verdures saltat',
      ingredients: [
        { nom: 'Arròs', quantitat: '200g', categoria: 'Bàsics', preuAprox: 0.40 },
        { nom: 'Pebrot', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.80 },
        { nom: 'Carbassó', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.90 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Salsa de soja', quantitat: '2 cullerades', categoria: 'Bàsics', preuAprox: 0.15 }
      ],
      temps_min: 15,
      preu_aprox: 2.55,
      categoria: 'ambdos',
      etiquetes: ['vegetaria', 'senseLactosa', 'rapid', 'economic']
    },
    {
      id: 'r-02',
      nom: 'Truita de patates amb tomàquet',
      ingredients: [
        { nom: 'Ous', quantitat: '3 unitats', categoria: 'Proteïna', preuAprox: 0.60 },
        { nom: 'Patates', quantitat: '300g', categoria: 'Verdures', preuAprox: 0.50 },
        { nom: 'Tomàquet', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.50 },
        { nom: 'Oli d\'oliva', quantitat: 'al gust', categoria: 'Bàsics', preuAprox: 0.20 }
      ],
      temps_min: 20,
      preu_aprox: 1.80,
      categoria: 'ambdos',
      etiquetes: ['vegetaria', 'senseGluten', 'senseLactosa', 'economic']
    },
    {
      id: 'r-03',
      nom: 'Pasta amb bròquil i oli',
      ingredients: [
        { nom: 'Pasta', quantitat: '200g', categoria: 'Bàsics', preuAprox: 0.50 },
        { nom: 'Bròquil', quantitat: '300g', categoria: 'Verdures', preuAprox: 1.20 },
        { nom: 'All', quantitat: '2 grans', categoria: 'Bàsics', preuAprox: 0.10 },
        { nom: 'Oli d\'oliva', quantitat: '3 cullerades', categoria: 'Bàsics', preuAprox: 0.20 }
      ],
      temps_min: 12,
      preu_aprox: 2.00,
      categoria: 'ambdos',
      etiquetes: ['vegetaria', 'senseLactosa', 'rapid', 'economic']
    },
    {
      id: 'r-04',
      nom: 'Pollastre al forn amb patates',
      ingredients: [
        { nom: 'Pit de pollastre', quantitat: '400g', categoria: 'Proteïna', preuAprox: 4.50 },
        { nom: 'Patates', quantitat: '400g', categoria: 'Verdures', preuAprox: 0.70 },
        { nom: 'Llimona', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Herbes provençals', quantitat: 'al gust', categoria: 'Bàsics', preuAprox: 0.10 }
      ],
      temps_min: 35,
      preu_aprox: 5.60,
      categoria: 'dinar',
      etiquetes: ['senseGluten', 'senseLactosa']
    },
    {
      id: 'r-05',
      nom: 'Cigrons amb espinacs',
      ingredients: [
        { nom: 'Cigrons cuits', quantitat: '400g', categoria: 'Proteïna', preuAprox: 1.20 },
        { nom: 'Espinacs', quantitat: '200g', categoria: 'Verdures', preuAprox: 1.50 },
        { nom: 'Tomàquet fregit', quantitat: '100g', categoria: 'Bàsics', preuAprox: 0.70 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 }
      ],
      temps_min: 18,
      preu_aprox: 3.70,
      categoria: 'ambdos',
      etiquetes: ['vegetaria', 'senseGluten', 'senseLactosa', 'economic']
    },
    {
      id: 'r-06',
      nom: 'Amanida de pollastre i alvocat',
      ingredients: [
        { nom: 'Pit de pollastre', quantitat: '200g', categoria: 'Proteïna', preuAprox: 2.30 },
        { nom: 'Enciam', quantitat: '1 bossa', categoria: 'Verdures', preuAprox: 1.20 },
        { nom: 'Alvocat', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 1.50 },
        { nom: 'Tomàquet cherry', quantitat: '150g', categoria: 'Verdures', preuAprox: 1.20 }
      ],
      temps_min: 15,
      preu_aprox: 6.20,
      categoria: 'ambdos',
      etiquetes: ['senseGluten', 'senseLactosa', 'rapid']
    },
    {
      id: 'r-07',
      nom: 'Llenties estofades amb verdures',
      ingredients: [
        { nom: 'Llenties', quantitat: '250g', categoria: 'Proteïna', preuAprox: 0.90 },
        { nom: 'Pastanaga', quantitat: '2 unitats', categoria: 'Verdures', preuAprox: 0.50 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Pebrot', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.80 }
      ],
      temps_min: 40,
      preu_aprox: 2.50,
      categoria: 'dinar',
      etiquetes: ['vegetaria', 'senseGluten', 'senseLactosa', 'economic']
    },
    {
      id: 'r-08',
      nom: 'Salmó al forn amb mongeta tendra',
      ingredients: [
        { nom: 'Salmó', quantitat: '300g', categoria: 'Proteïna', preuAprox: 7.50 },
        { nom: 'Mongeta tendra', quantitat: '300g', categoria: 'Verdures', preuAprox: 1.80 },
        { nom: 'Llimona', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Oli d\'oliva', quantitat: 'al gust', categoria: 'Bàsics', preuAprox: 0.20 }
      ],
      temps_min: 25,
      preu_aprox: 9.80,
      categoria: 'dinar',
      etiquetes: ['senseGluten', 'senseLactosa']
    },
    {
      id: 'r-09',
      nom: 'Crema de carbassa',
      ingredients: [
        { nom: 'Carbassa', quantitat: '500g', categoria: 'Verdures', preuAprox: 1.50 },
        { nom: 'Patata', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.20 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Brou de verdures', quantitat: '500ml', categoria: 'Bàsics', preuAprox: 0.80 }
      ],
      temps_min: 25,
      preu_aprox: 2.80,
      categoria: 'sopar',
      etiquetes: ['vegetaria', 'senseGluten', 'senseLactosa', 'economic']
    },
    {
      id: 'r-10',
      nom: 'Mongetes amb ceba i tomàquet',
      ingredients: [
        { nom: 'Mongetes cuites', quantitat: '400g', categoria: 'Proteïna', preuAprox: 1.30 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Tomàquet', quantitat: '2 unitats', categoria: 'Verdures', preuAprox: 1.00 },
        { nom: 'All', quantitat: '2 grans', categoria: 'Bàsics', preuAprox: 0.10 }
      ],
      temps_min: 20,
      preu_aprox: 2.70,
      categoria: 'dinar',
      etiquetes: ['vegetaria', 'senseGluten', 'senseLactosa', 'economic']
    },
    {
      id: 'r-11',
      nom: 'Ous ferrats amb espinacs',
      ingredients: [
        { nom: 'Ous', quantitat: '2 unitats', categoria: 'Proteïna', preuAprox: 0.40 },
        { nom: 'Espinacs', quantitat: '150g', categoria: 'Verdures', preuAprox: 1.20 },
        { nom: 'Pa integral', quantitat: '2 llesques', categoria: 'Bàsics', preuAprox: 0.40 }
      ],
      temps_min: 10,
      preu_aprox: 2.00,
      categoria: 'sopar',
      etiquetes: ['vegetaria', 'rapid', 'economic']
    },
    {
      id: 'r-12',
      nom: 'Quinoa amb verdures rostides',
      ingredients: [
        { nom: 'Quinoa', quantitat: '150g', categoria: 'Bàsics', preuAprox: 1.20 },
        { nom: 'Pebrot', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.80 },
        { nom: 'Carbassó', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.90 },
        { nom: 'Albergínia', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 1.00 }
      ],
      temps_min: 30,
      preu_aprox: 3.90,
      categoria: 'sopar',
      etiquetes: ['vegetaria', 'senseGluten', 'senseLactosa']
    },
    {
      id: 'r-13',
      nom: 'Sopa de verdures amb fideus',
      ingredients: [
        { nom: 'Fideus', quantitat: '100g', categoria: 'Bàsics', preuAprox: 0.30 },
        { nom: 'Pastanaga', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.25 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Brou de verdures', quantitat: '700ml', categoria: 'Bàsics', preuAprox: 1.00 }
      ],
      temps_min: 20,
      preu_aprox: 1.85,
      categoria: 'sopar',
      etiquetes: ['vegetaria', 'senseLactosa', 'economic']
    },
    {
      id: 'r-14',
      nom: 'Tonyina amb amanida',
      ingredients: [
        { nom: 'Tonyina en conserva', quantitat: '1 llauna', categoria: 'Proteïna', preuAprox: 1.20 },
        { nom: 'Enciam', quantitat: '1 bossa', categoria: 'Verdures', preuAprox: 1.20 },
        { nom: 'Tomàquet', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.50 },
        { nom: 'Cogombre', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.60 }
      ],
      temps_min: 8,
      preu_aprox: 3.50,
      categoria: 'sopar',
      etiquetes: ['senseGluten', 'senseLactosa', 'rapid', 'economic']
    },
    {
      id: 'r-15',
      nom: 'Pollastre saltat amb verdures',
      ingredients: [
        { nom: 'Pit de pollastre', quantitat: '300g', categoria: 'Proteïna', preuAprox: 3.40 },
        { nom: 'Pebrot', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.80 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Pastanaga', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.25 }
      ],
      temps_min: 18,
      preu_aprox: 4.75,
      categoria: 'dinar',
      etiquetes: ['senseGluten', 'senseLactosa', 'rapid']
    },
    {
      id: 'r-16',
      nom: 'Tofu a la planxa amb bròquil',
      ingredients: [
        { nom: 'Tofu', quantitat: '250g', categoria: 'Proteïna', preuAprox: 2.20 },
        { nom: 'Bròquil', quantitat: '300g', categoria: 'Verdures', preuAprox: 1.20 },
        { nom: 'Salsa de soja', quantitat: '2 cullerades', categoria: 'Bàsics', preuAprox: 0.15 },
        { nom: 'Sèsam', quantitat: '1 cullerada', categoria: 'Bàsics', preuAprox: 0.20 }
      ],
      temps_min: 15,
      preu_aprox: 3.75,
      categoria: 'ambdos',
      etiquetes: ['vegetaria', 'senseLactosa', 'rapid']
    },
    {
      id: 'r-17',
      nom: 'Macarrons amb tomàquet i formatge',
      ingredients: [
        { nom: 'Macarrons', quantitat: '200g', categoria: 'Bàsics', preuAprox: 0.50 },
        { nom: 'Salsa de tomàquet', quantitat: '300g', categoria: 'Bàsics', preuAprox: 1.00 },
        { nom: 'Formatge ratllat', quantitat: '50g', categoria: 'Llet i derivats', preuAprox: 0.80 }
      ],
      temps_min: 15,
      preu_aprox: 2.30,
      categoria: 'ambdos',
      etiquetes: ['vegetaria', 'rapid', 'economic']
    },
    {
      id: 'r-18',
      nom: 'Lluç al forn amb verdures',
      ingredients: [
        { nom: 'Lluç', quantitat: '300g', categoria: 'Proteïna', preuAprox: 4.80 },
        { nom: 'Patata', quantitat: '2 unitats', categoria: 'Verdures', preuAprox: 0.40 },
        { nom: 'Pebrot', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.80 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 }
      ],
      temps_min: 30,
      preu_aprox: 6.30,
      categoria: 'dinar',
      etiquetes: ['senseGluten', 'senseLactosa']
    },
    {
      id: 'r-19',
      nom: 'Escalivada amb ou dur',
      ingredients: [
        { nom: 'Pebrot', quantitat: '2 unitats', categoria: 'Verdures', preuAprox: 1.60 },
        { nom: 'Albergínia', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 1.00 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Ous', quantitat: '2 unitats', categoria: 'Proteïna', preuAprox: 0.40 }
      ],
      temps_min: 45,
      preu_aprox: 3.30,
      categoria: 'sopar',
      etiquetes: ['vegetaria', 'senseGluten', 'senseLactosa']
    },
    {
      id: 'r-20',
      nom: 'Hamburguesa de cigrons amb amanida',
      ingredients: [
        { nom: 'Cigrons cuits', quantitat: '300g', categoria: 'Proteïna', preuAprox: 0.90 },
        { nom: 'Ceba', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Enciam', quantitat: '1 bossa', categoria: 'Verdures', preuAprox: 1.20 },
        { nom: 'Pa d\'hamburguesa', quantitat: '2 unitats', categoria: 'Bàsics', preuAprox: 0.60 }
      ],
      temps_min: 25,
      preu_aprox: 3.00,
      categoria: 'sopar',
      etiquetes: ['vegetaria', 'senseLactosa', 'economic']
    },
    {
      id: 'r-21',
      nom: 'Iogurt amb fruita i civada',
      ingredients: [
        { nom: 'Iogurt natural', quantitat: '2 unitats', categoria: 'Llet i derivats', preuAprox: 0.70 },
        { nom: 'Plàtan', quantitat: '1 unitat', categoria: 'Verdures', preuAprox: 0.30 },
        { nom: 'Flocs de civada', quantitat: '40g', categoria: 'Bàsics', preuAprox: 0.20 }
      ],
      temps_min: 5,
      preu_aprox: 1.20,
      categoria: 'sopar',
      etiquetes: ['vegetaria', 'rapid', 'economic']
    },
    {
      id: 'r-22',
      nom: 'Gall dindi a la planxa amb enciam',
      ingredients: [
        { nom: 'Filet de gall dindi', quantitat: '300g', categoria: 'Proteïna', preuAprox: 3.80 },
        { nom: 'Enciam', quantitat: '1 bossa', categoria: 'Verdures', preuAprox: 1.20 },
        { nom: 'Tomàquet cherry', quantitat: '150g', categoria: 'Verdures', preuAprox: 1.20 },
        { nom: 'Oli d\'oliva', quantitat: 'al gust', categoria: 'Bàsics', preuAprox: 0.20 }
      ],
      temps_min: 15,
      preu_aprox: 6.40,
      categoria: 'ambdos',
      etiquetes: ['senseGluten', 'senseLactosa', 'rapid']
    }
  ];

  function getRecipes() {
    return RECIPES.slice();
  }

  // Filtra receptes segons preferències de l'usuari.
  function filterRecipesByPrefs(recipes, prefs) {
    return recipes.filter((r) => {
      if (prefs.vegetaria && r.etiquetes.indexOf('vegetaria') === -1) return false;
      if (prefs.senseGluten && r.etiquetes.indexOf('senseGluten') === -1) return false;
      if (prefs.senseLactosa && r.etiquetes.indexOf('senseLactosa') === -1) return false;
      return true;
    });
  }

  // ------------------------------
  //  Generació de menú setmanal
  // ------------------------------

  const DAYS_CA = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

  function generateWeekPlan(budget, preferences) {
    const prefs = preferences || getPreferences();
    const budgetNum = Number(budget) || 30;

    // Filtrem segons preferències i determinem la franja de pressupost.
    let pool = filterRecipesByPrefs(getRecipes(), prefs);
    if (!pool.length) pool = getRecipes(); // fallback

    let bracket;
    if (budgetNum < 25) bracket = 'baix';
    else if (budgetNum <= 40) bracket = 'mitja';
    else bracket = 'alt';

    // Per pressupost baix, prioritzem receptes etiquetades 'economic'.
    if (bracket === 'baix') {
      const cheap = pool.filter((r) => r.etiquetes.indexOf('economic') !== -1);
      if (cheap.length >= 4) pool = cheap;
    } else if (bracket === 'alt') {
      // Per pressupost alt, afegim receptes amb peix si hi caben.
      // Ja estan al pool per defecte — no cal filtrar.
    }

    const dinars = pool.filter((r) => r.categoria === 'dinar' || r.categoria === 'ambdos');
    const sopars = pool.filter((r) => r.categoria === 'sopar' || r.categoria === 'ambdos');

    const days = [];
    let totalEstimat = 0;

    for (let i = 0; i < 7; i++) {
      const dinar = pickWithRotation(dinars, i, 'dinar');
      const sopar = pickWithRotation(sopars, i + 3, 'sopar'); // offset perquè no coincideixi sempre
      days.push({
        name: DAYS_CA[i],
        dinar: dinar,
        sopar: sopar
      });
      totalEstimat += (dinar ? dinar.preu_aprox : 0) + (sopar ? sopar.preu_aprox : 0);
    }

    // Escalem el total al voltant del pressupost (4 persones no, una persona).
    // Per simplicitat, retornem el total directe.
    return {
      budget: budgetNum,
      bracket: bracket,
      totalEstimat: Math.round(totalEstimat * 100) / 100,
      days: days,
      preferences: prefs
    };
  }

  // Tria una recepta del pool rotant per índex, evitant repeticions consecutives.
  function pickWithRotation(pool, i, tipus) {
    if (!pool.length) return null;
    return pool[i % pool.length];
  }

  // ------------------------------
  //  Generació de llista de compra
  // ------------------------------

  function generateShoppingList(weekPlan) {
    if (!weekPlan || !weekPlan.days) return [];

    // Agrupem ingredients acumulant per nom.
    const bag = new Map();

    weekPlan.days.forEach((day) => {
      [day.dinar, day.sopar].forEach((rec) => {
        if (!rec || !rec.ingredients) return;
        rec.ingredients.forEach((ing) => {
          const key = ing.nom.toLowerCase();
          if (!bag.has(key)) {
            bag.set(key, {
              id: 'sh-' + key.replace(/\s+/g, '-'),
              nom: ing.nom,
              quantitat: ing.quantitat,
              preuAprox: ing.preuAprox,
              categoria: ing.categoria,
              comprat: false,
              vegades: 1
            });
          } else {
            const existing = bag.get(key);
            existing.vegades += 1;
            existing.preuAprox = Math.round((existing.preuAprox + ing.preuAprox * 0.5) * 100) / 100;
          }
        });
      });
    });

    // Retornem com a array ordenat per categoria.
    const orderCat = ['Verdures', 'Proteïna', 'Llet i derivats', 'Bàsics', 'Altres'];
    return Array.from(bag.values()).sort((a, b) => {
      const ia = orderCat.indexOf(a.categoria);
      const ib = orderCat.indexOf(b.categoria);
      if (ia !== ib) return ia - ib;
      return a.nom.localeCompare(b.nom, 'ca');
    });
  }

  // ------------------------------
  //  Suggeriment diari (to Coach)
  // ------------------------------

  function getDailySuggestion(aggregated, mealCount) {
    if (!mealCount || mealCount === 0) {
      return {
        icon: '🌱',
        text: 'Comença el dia registrant el primer àpat. Nomes caldrà una foto!'
      };
    }

    if (aggregated.verdures === 'bad') {
      return {
        icon: '🥗',
        text: 'Et falten verdures avui. Afegeix amanida o verdures al sopar.'
      };
    }

    if (aggregated.proteina === 'bad') {
      return {
        icon: '🥚',
        text: 'Falta una mica de proteïna. Un ou, iogurt o cigrons seran un bon complement.'
      };
    }

    if (aggregated.hidrats === 'bad') {
      return {
        icon: '🌾',
        text: 'Bé! Podries afegir una mica d\'hidrats (arròs, pa o quinoa) per tenir més energia.'
      };
    }

    if (aggregated.hidrats === 'warn') {
      return {
        icon: '💡',
        text: 'Hidrats una mica alts. Al sopar prova amb verdures i proteïna lleugera.'
      };
    }

    if (aggregated.verdures === 'warn' || aggregated.proteina === 'warn') {
      return {
        icon: '🌿',
        text: 'Vas bé! Un toc més de verdures i proteïna acabarà d\'equilibrar el dia.'
      };
    }

    return {
      icon: '✨',
      text: 'Avui vas equilibrada. Continua així, sense pressió!'
    };
  }

  // ------------------------------
  //  Mapping de fotos d'àpats
  //  Atribueix una foto de /assets/photos/ segons paraules clau al nom.
  //  Retorna null si no hi ha cap coincidència (el renderer mostrarà un placeholder
  //  amb la inicial a sobre d'un gradient).
  // ------------------------------

  // NOTA: l'ordre importa — les regles més específiques van primer.
  // Ex: "amanida de pollastre" ha de triar "amanida" abans que "pollastre".
  const PHOTO_MAPPING = [
    { keywords: ['amanida', 'ensalada', 'enciam'], file: 'amanida.jpg' },
    { keywords: ['pasta', 'carbonara', 'macarrons', 'espagueti', 'tallarines'], file: 'pasta-carbonara.jpg' },
    { keywords: ['arròs', 'arros', 'risotto', 'paella'], file: 'arros-verdures.jpg' },
    { keywords: ['truita', 'tortilla'], file: 'truita-patates.jpg' },
    { keywords: ['pollastre', 'chicken', 'gall dindi'], file: 'pollastre-patates.jpg' },
    { keywords: ['vedella', 'carn', 'steak', 'filet', 'hamburguesa', 'llom', 'bistec'], file: 'vedella-pure.jpg' }
  ];

  function getMealPhoto(nom) {
    if (!nom) return null;
    const t = String(nom).toLowerCase();
    for (let i = 0; i < PHOTO_MAPPING.length; i++) {
      const entry = PHOTO_MAPPING[i];
      for (let j = 0; j < entry.keywords.length; j++) {
        if (t.indexOf(entry.keywords[j]) !== -1) {
          return 'assets/photos/' + entry.file;
        }
      }
    }
    return null;
  }

  // ------------------------------
  //  Alternatives de productes
  // ------------------------------

  const ALTERNATIVES = {
    'pit de pollastre': [
      { nom: 'Cigrons cuits', preuAprox: 1.20, context: 'Pots fer cigrons amb espinacs dimecres.' },
      { nom: 'Ous', preuAprox: 2.00, context: 'Una truita o ous ferrats substitueixen bé la proteïna.' },
      { nom: 'Tonyina en conserva', preuAprox: 1.20, context: 'Ràpid i també va bé amb amanida.' }
    ],
    'pollastre': [
      { nom: 'Cigrons cuits', preuAprox: 1.20, context: 'Pots fer cigrons amb espinacs dimecres.' },
      { nom: 'Ous', preuAprox: 2.00, context: 'Bona proteïna i molt ràpid de preparar.' },
      { nom: 'Tofu', preuAprox: 2.20, context: 'Alternativa vegetal, es cuina a la planxa.' }
    ],
    'salmó': [
      { nom: 'Sardines en conserva', preuAprox: 1.80, context: 'Conserven els omega-3 i són molt més barates.' },
      { nom: 'Ous', preuAprox: 2.00, context: 'Proteïna fàcil si no trobes peix assequible.' }
    ],
    'lluç': [
      { nom: 'Calamars', preuAprox: 4.50, context: 'Similar preu i es prepara igual al forn.' },
      { nom: 'Tonyina en conserva', preuAprox: 1.20, context: 'Opció més econòmica si cal.' }
    ],
    'formatge ratllat': [
      { nom: 'Llevat nutricional', preuAprox: 1.80, context: 'Sense lactosa i amb gust intens.' },
      { nom: 'Formatge fresc', preuAprox: 1.50, context: 'Alternativa més lleugera.' }
    ],
    'quinoa': [
      { nom: 'Arròs integral', preuAprox: 0.80, context: 'Més barat i també nutritiu.' },
      { nom: 'Cuscús', preuAprox: 0.90, context: 'Es cuina en 5 minuts.' }
    ],
    'bròquil': [
      { nom: 'Coliflor', preuAprox: 1.00, context: 'Mateixa família, es prepara igual.' },
      { nom: 'Mongeta tendra', preuAprox: 1.20, context: 'També es saltega molt bé.' }
    ]
  };

  // Alternatives genèriques si no hi ha match específic.
  const ALTERNATIVES_DEFAULT = [
    { nom: 'Ous', preuAprox: 2.00, context: 'Bona font de proteïna i molt versàtils.' },
    { nom: 'Cigrons en conserva', preuAprox: 1.20, context: 'Proteïna vegetal lista per usar.' },
    { nom: 'Tonyina en conserva', preuAprox: 1.20, context: 'Ràpid i barat.' }
  ];

  function getAlternatives(productName) {
    const key = String(productName || '').toLowerCase();
    // Busquem match exacte primer.
    if (ALTERNATIVES[key]) return ALTERNATIVES[key];
    // Busquem match parcial.
    const keys = Object.keys(ALTERNATIVES);
    for (let i = 0; i < keys.length; i++) {
      if (key.indexOf(keys[i]) !== -1 || keys[i].indexOf(key) !== -1) {
        return ALTERNATIVES[keys[i]];
      }
    }
    return ALTERNATIVES_DEFAULT.slice();
  }

  // ------------------------------
  //  API pública
  // ------------------------------

  return {
    getMeals: getMeals,
    getMeal: getMeal,
    addMeal: addMeal,
    updateMeal: updateMeal,
    removeMeal: removeMeal,
    clearTodayMeals: clearTodayMeals,

    getBudget: getBudget,
    setBudget: setBudget,

    getWeekPlan: getWeekPlan,
    setWeekPlan: setWeekPlan,

    getShoppingList: getShoppingList,
    setShoppingList: setShoppingList,
    updateShoppingItem: updateShoppingItem,

    getPreferences: getPreferences,
    setPreferences: setPreferences,

    analyzeMeal: analyzeMeal,
    aggregateIndicadors: aggregateIndicadors,

    generateWeekPlan: generateWeekPlan,
    generateShoppingList: generateShoppingList,

    getDailySuggestion: getDailySuggestion,
    getAlternatives: getAlternatives,

    getRecipes: getRecipes,
    getMealPhoto: getMealPhoto,

    // Util de desenvolupament — neteja tot l'estat emmagatzemat.
    resetAll: function () {
      ['meals', 'budget', 'weekPlan', 'shoppingList', 'preferences'].forEach(function (k) {
        clear('snapeat:' + k);
      });
    }
  };
})();
