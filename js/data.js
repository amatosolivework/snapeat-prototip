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

  // Format YYYY-MM-DD amb hora local — evita saltar un dia en dispositius UTC.
  function todayKey() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  function mealDateKey(meal) {
    if (meal && meal.fecha) return meal.fecha;
    if (meal && meal.createdAt) return String(meal.createdAt).slice(0, 10);
    return null;
  }

  // Retorna només els àpats registrats avui. Els àpats antics es conserven al
  // localStorage (podrien alimentar mètriques futures), però no embruten el
  // dashboard d'avui.
  function getMealsToday() {
    const key = todayKey();
    return getMeals().filter(function (m) {
      const mk = mealDateKey(m);
      // Fallback: si l'àpat és antic i no té data, el tractem com a d'avui
      // (prototip legacy) per no amagar-lo a usuàries que facin servir la demo.
      if (!mk) return true;
      return mk === key;
    });
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
      passos: [
        'Talla el pebrot, el carbassó i la ceba a daus petits.',
        'Posa una mica d\'oli en una paella i salteja les verdures 5 minuts.',
        'Afegeix l\'arròs cuit i remena 2 minuts més.',
        'Tira un rajolí de salsa de soja, remena i serveix.'
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
      passos: [
        'Talla les patates a rodanxes fines i fregeix-les a foc mig 10 minuts.',
        'Bat els ous en un bol i barreja\'ls amb les patates.',
        'Aboca la barreja a la paella i cuina 3 minuts per cada costat.',
        'Serveix amb tomàquet tallat a rodanxes al costat.'
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
      passos: [
        'Posa aigua amb sal a bullir i cuina la pasta segons el paquet.',
        'Mentre bull, talla el bròquil en floretes petites i afegeix-lo a l\'última meitat de cocció.',
        'Escorre la pasta i el bròquil junts.',
        'Amaneix amb oli, alls trinxats i una mica de sal.'
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
      passos: [
        'Preescalfa el forn a 200 °C.',
        'Posa el pit de pollastre i les patates tallades a una safata.',
        'Afegeix sal, herbes provençals, suc de llimona i un raig d\'oli.',
        'Forneja 30 minuts fins que estigui daurat.'
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
      passos: [
        'Talla la ceba ben petita i sofregeix-la en oli 3 minuts.',
        'Afegeix el tomàquet fregit i els cigrons escorreguts.',
        'Incorpora els espinacs i remena fins que es redueixin.',
        'Cuina 5 minuts més i serveix.'
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
      passos: [
        'Cuina el pit de pollastre a la planxa amb una mica de sal i oli.',
        'Mentre, neteja l\'enciam i talla el tomàquet cherry per la meitat.',
        'Talla el pollastre a tires i l\'alvocat a daus.',
        'Barreja-ho tot al bol i amaneix amb oli i sal al gust.'
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
      passos: [
        'Talla la ceba, la pastanaga i el pebrot a daus petits.',
        'Sofregeix-ho tot en una cassola amb oli 5 minuts.',
        'Afegeix les llenties i cobreix amb aigua fins que les tapi.',
        'Cuina a foc lent 30 minuts fins que siguin tendres.'
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
      passos: [
        'Preescalfa el forn a 190 °C i posa el salmó en una safata.',
        'Amaneix amb oli, sal i suc de llimona.',
        'Forneja 15 minuts.',
        'Mentrestant, bull la mongeta 8 minuts i serveix-la al costat.'
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
      passos: [
        'Talla la carbassa, la patata i la ceba a daus.',
        'Posa-ho tot a la cassola amb el brou i porta a ebullició.',
        'Cuina 20 minuts fins que tot estigui tou.',
        'Tritura amb una batedora fins que quedi crema.'
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
      passos: [
        'Sofregeix la ceba i l\'all trinxat en oli.',
        'Afegeix el tomàquet ratllat i cuina 5 minuts.',
        'Incorpora les mongetes i remena per barrejar.',
        'Cuina 5 minuts més i serveix.'
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
      passos: [
        'Posa els espinacs en una paella amb una mica d\'oli i cuina 3 minuts.',
        'Trasllada els espinacs a un plat.',
        'Fregeix els ous a la mateixa paella fins que la clara estigui feta.',
        'Serveix-ho tot amb pa torrat.'
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
      passos: [
        'Talla les verdures a daus grossos i posa-les en una safata de forn.',
        'Amaneix amb oli i sal, forneja a 200 °C 25 minuts.',
        'Mentre, cuina la quinoa en dos cops el seu volum d\'aigua 15 minuts.',
        'Barreja-ho tot al plat i serveix.'
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
      passos: [
        'Talla la pastanaga i la ceba a daus petits.',
        'Porta el brou a ebullició amb les verdures.',
        'Cuina 10 minuts i afegeix els fideus.',
        'Cuina 5 minuts més i serveix.'
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
      passos: [
        'Neteja l\'enciam i trosseja\'l a un bol gran.',
        'Talla el tomàquet i el cogombre a daus.',
        'Afegeix la tonyina escorreguda per sobre.',
        'Amaneix amb oli, sal i vinagre.'
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
      passos: [
        'Talla el pit de pollastre a tires fines.',
        'Salteja\'l a foc fort en una paella amb oli 5 minuts.',
        'Afegeix el pebrot, la pastanaga i la ceba tallats.',
        'Continua saltant 8 minuts més fins que estigui tou.'
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
      passos: [
        'Talla el tofu a taquets i bull el bròquil 5 minuts.',
        'Marca el tofu a la planxa amb oli fins que quedi daurat.',
        'Amaneix amb salsa de soja i sèsam per sobre.',
        'Serveix amb el bròquil al costat.'
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
      passos: [
        'Cuina els macarrons segons el paquet.',
        'Escalfa la salsa de tomàquet en una paella.',
        'Barreja els macarrons escorreguts amb la salsa.',
        'Serveix amb formatge ratllat per sobre.'
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
      passos: [
        'Preescalfa el forn a 180 °C.',
        'Disposa les patates, el pebrot i la ceba a una safata.',
        'Posa el lluç per sobre, amaneix amb oli i sal.',
        'Forneja 25 minuts i ja està.'
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
      passos: [
        'Posa els pebrots, l\'albergínia i la ceba al forn a 200 °C 40 min.',
        'Mentre, bull els ous 10 minuts i pela\'ls.',
        'Pela les verdures quan es refredin i talla-les a tires.',
        'Amaneix amb oli, sal i serveix amb els ous tallats.'
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
      passos: [
        'Escorre i aixafa els cigrons amb una forquilla.',
        'Barreja\'ls amb la ceba trinxada i forma 2 hamburgueses.',
        'Cuina-les a la paella 5 minuts per cada costat.',
        'Serveix-les al pa amb enciam.'
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
      passos: [
        'Posa el iogurt en un bol.',
        'Talla el plàtan a rodanxes.',
        'Afegeix el plàtan i els flocs de civada per sobre.',
        'Ja està llest per menjar.'
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
      passos: [
        'Amaneix els filets de gall dindi amb sal i oli.',
        'Cuina\'ls a la planxa 5 minuts per cada costat.',
        'Mentre, trosseja l\'enciam i el tomàquet cherry.',
        'Serveix el gall dindi sobre l\'amanida.'
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

  // Deriva metadades de cocció a partir del temps, ingredients i nom.
  // Laura té zero experiència cuinant; necessita saber "puc fer això?" d'una ullada.
  function getRecipeMeta(recipe) {
    if (!recipe) return { dificultat: '', utensili: '' };
    const nom = String(recipe.nom || '').toLowerCase();
    const temps = Number(recipe.temps_min) || 0;
    const numIngredients = (recipe.ingredients || []).length;

    let dificultat;
    if (temps <= 15 && numIngredients <= 4) dificultat = 'Fàcil';
    else if (temps <= 30) dificultat = 'Mitjà';
    else dificultat = 'Amb temps';

    let utensili;
    if (nom.indexOf('al forn') !== -1 || nom.indexOf('rostid') !== -1) utensili = 'Al forn';
    else if (nom.indexOf('a la planxa') !== -1) utensili = 'Planxa';
    else if (nom.indexOf('saltat') !== -1 || nom.indexOf('saltad') !== -1) utensili = 'Paella';
    else if (nom.indexOf('amanida') !== -1) utensili = 'Sense foc';
    else if (nom.indexOf('iogurt') !== -1) utensili = 'Sense foc';
    else if (nom.indexOf('sopa') !== -1 || nom.indexOf('crema') !== -1) utensili = 'Cassola';
    else if (nom.indexOf('estofad') !== -1) utensili = 'Cassola';
    else if (nom.indexOf('truita') !== -1 || nom.indexOf('ferrat') !== -1) utensili = 'Paella';
    else if (nom.indexOf('hamburguesa') !== -1) utensili = 'Paella';
    else utensili = 'Cassola';

    return { dificultat: dificultat, utensili: utensili };
  }

  // Retorna 3 receptes alternatives del mateix tipus i preu similar,
  // excloent la recepta actual i (opcionalment) una llista d'IDs a evitar.
  // S'usa per al canvi d'un sol àpat dins del menú setmanal.
  function getAlternativeRecipes(currentRecipe, mealType, prefs, excludeIds) {
    if (!currentRecipe) return [];
    const excluded = new Set(excludeIds || []);
    excluded.add(currentRecipe.id);

    let pool = filterRecipesByPrefs(getRecipes(), prefs || getPreferences());
    if (!pool.length) pool = getRecipes();

    // Filtrem per tipus d'àpat (dinar/sopar/ambdos).
    pool = pool.filter(function (r) {
      if (excluded.has(r.id)) return false;
      if (mealType === 'dinar') return r.categoria === 'dinar' || r.categoria === 'ambdos';
      if (mealType === 'sopar') return r.categoria === 'sopar' || r.categoria === 'ambdos';
      return true;
    });

    // Ordenem per proximitat al preu actual (més rellevant per al pressupost).
    const refPrice = Number(currentRecipe.preu_aprox) || 0;
    pool.sort(function (a, b) {
      return Math.abs(a.preu_aprox - refPrice) - Math.abs(b.preu_aprox - refPrice);
    });

    return pool.slice(0, 3);
  }

  // Retorna el balanç nutricional agregat d'un dia del pla (dinar + sopar).
  // Usat pel mini-semàfor al menú setmanal.
  function getDayBalance(day) {
    if (!day) return { hidrats: 'bad', verdures: 'bad', proteina: 'bad' };
    const meals = [];
    if (day.dinar && day.dinar.nom) {
      meals.push({ nom: day.dinar.nom, indicadors: analyzeMeal(day.dinar.nom) });
    }
    if (day.sopar && day.sopar.nom) {
      meals.push({ nom: day.sopar.nom, indicadors: analyzeMeal(day.sopar.nom) });
    }
    return aggregateIndicadors(meals);
  }

  // Substitueix un àpat dins el pla setmanal (day + mealType) per una nova recepta.
  // Retorna el pla actualitzat. No regenera la llista de compra — això es marcarà
  // com a "pendent de regenerar" a la UI.
  function replaceMealInPlan(dayIndex, mealType, newRecipe) {
    const plan = getWeekPlan();
    if (!plan || !plan.days || !plan.days[dayIndex]) return null;
    if (mealType !== 'dinar' && mealType !== 'sopar') return null;
    plan.days[dayIndex][mealType] = newRecipe;
    // Recalculem el total estimat.
    let total = 0;
    plan.days.forEach(function (day) {
      if (day.dinar) total += Number(day.dinar.preu_aprox) || 0;
      if (day.sopar) total += Number(day.sopar.preu_aprox) || 0;
    });
    plan.totalEstimat = Math.round(total * 100) / 100;
    setWeekPlan(plan);
    return plan;
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
        text: 'Comença el dia fent una foto del primer àpat. Nomes triga 10 segons.'
      };
    }

    if (aggregated.verdures === 'bad') {
      return {
        icon: '🥗',
        text: 'Una amanida o verdures al sopar i tens el dia rodó.'
      };
    }

    if (aggregated.proteina === 'bad') {
      return {
        icon: '🥚',
        text: 'Afegeix un ou, un iogurt o cigrons i tanques la proteïna del dia.'
      };
    }

    if (aggregated.hidrats === 'bad') {
      return {
        icon: '🌾',
        text: 'Un plat d\'arròs, pasta o pa integral al sopar et donarà energia.'
      };
    }

    if (aggregated.hidrats === 'warn') {
      return {
        icon: '💡',
        text: 'Al sopar, prova un plat lleuger: verdures amb proteïna i ja està.'
      };
    }

    if (aggregated.verdures === 'warn' || aggregated.proteina === 'warn') {
      return {
        icon: '🌿',
        text: 'Ja tens molt guanyat. Un toc més de verdures o proteïna i clausures.'
      };
    }

    return {
      icon: '✨',
      text: 'Dia equilibrat. Gran feina, Laura!'
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
    getMealsToday: getMealsToday,
    todayKey: todayKey,
    getMeal: getMeal,
    addMeal: addMeal,
    updateMeal: updateMeal,
    removeMeal: removeMeal,
    clearTodayMeals: clearTodayMeals,

    getBudget: getBudget,
    setBudget: setBudget,

    getWeekPlan: getWeekPlan,
    setWeekPlan: setWeekPlan,
    replaceMealInPlan: replaceMealInPlan,

    getShoppingList: getShoppingList,
    setShoppingList: setShoppingList,
    updateShoppingItem: updateShoppingItem,

    getPreferences: getPreferences,
    setPreferences: setPreferences,

    analyzeMeal: analyzeMeal,
    aggregateIndicadors: aggregateIndicadors,
    getDayBalance: getDayBalance,

    generateWeekPlan: generateWeekPlan,
    generateShoppingList: generateShoppingList,

    getDailySuggestion: getDailySuggestion,
    getAlternatives: getAlternatives,
    getAlternativeRecipes: getAlternativeRecipes,

    getRecipes: getRecipes,
    getRecipeMeta: getRecipeMeta,
    getMealPhoto: getMealPhoto,

    // Util de desenvolupament — neteja tot l'estat emmagatzemat.
    resetAll: function () {
      ['meals', 'budget', 'weekPlan', 'shoppingList', 'preferences'].forEach(function (k) {
        clear('snapeat:' + k);
      });
    }
  };
})();
