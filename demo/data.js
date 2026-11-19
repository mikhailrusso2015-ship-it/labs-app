/* LABS demo · datos de EJEMPLO (nada de esto es real) */
(function () {
  // Generador repetible, para que el demo se vea igual cada vez
  function rng(seed) { let s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const rand = rng(20261119);

  const TODAY = new Date(); TODAY.setHours(12, 0, 0, 0);
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

  // Tasas de EJEMPLO. En producción se leen de una fuente con respaldo y se guarda la hora.
  const RATES = {
    bcv: { label: 'Bs por dólar (BCV)', value: 868.40, note: 'Tasa de ejemplo' },
    usdt: { label: 'Bs por USDT', value: 1012.50, note: 'Tasa de ejemplo' },
    manual: { label: 'Bs por dólar (tasa propia)', value: 940.00, note: 'La escribe el laboratorio' }
  };

  // Catálogo: precio y costo en dólares. Margen normal lo pone el laboratorio.
  const CATALOG = [
    { id: 'glu', name: 'Glucosa en ayunas', unit: 'mg/dL', price: 4, cost: 0.9, lo: 70, hi: 99, kind: 'range' },
    { id: 'col', name: 'Colesterol total', unit: 'mg/dL', price: 5, cost: 1.2, hi: 200, kind: 'max' },
    { id: 'hdl', name: 'Colesterol HDL', unit: 'mg/dL', price: 6, cost: 1.5, lo: 40, kind: 'min' },
    { id: 'ldl', name: 'Colesterol LDL', unit: 'mg/dL', price: 6, cost: 1.5, hi: 130, kind: 'max' },
    { id: 'tri', name: 'Triglicéridos', unit: 'mg/dL', price: 5, cost: 1.2, hi: 150, kind: 'max' },
    { id: 'ure', name: 'Urea', unit: 'mg/dL', price: 4, cost: 0.9, lo: 15, hi: 45, kind: 'range' },
    { id: 'cre', name: 'Creatinina', unit: 'mg/dL', price: 4, cost: 0.9, lo: 0.6, hi: 1.3, kind: 'range' },
    { id: 'hem', name: 'Hemoglobina', unit: 'g/dL', price: 3, cost: 0.7, lo: 12, hi: 16, kind: 'range' },
    { id: 'tsh', name: 'TSH (tiroides)', unit: 'mUI/L', price: 12, cost: 4.2, lo: 0.4, hi: 4.0, kind: 'range' },
    { id: 'hemog', name: 'Hematología completa', unit: '', price: 7, cost: 2, kind: 'none' },
    { id: 'ori', name: 'Examen de orina', unit: '', price: 3, cost: 0.6, kind: 'none' },
    { id: 'hec', name: 'Examen de heces', unit: '', price: 3, cost: 0.6, kind: 'none' }
  ];
  const BY_ID = {}; CATALOG.forEach(function (c) { BY_ID[c.id] = c; });

  const AGE_GROUPS = ['0–17', '18–23', '24–39', '40–59', '60+'];
  // Qué piden más en cada edad (pesos). Esto es lo que "descubre" el reporte.
  const WEIGHTS = {
    '0–17': { hemog: 6, ori: 5, hec: 5, hem: 3, glu: 1, col: 0.3, ure: 1, cre: 1 },
    '18–23': { ure: 7, cre: 7, hemog: 4, ori: 3, glu: 2, hem: 2, tsh: 1 },
    '24–39': { hemog: 4, glu: 3, col: 3, tri: 3, tsh: 3, hem: 4, ori: 2, ure: 1.5, cre: 1.5 },
    '40–59': { glu: 6, col: 5, tri: 5, hdl: 3, ldl: 3, cre: 2, ure: 2, tsh: 2, hem: 1.5 },
    '60+': { glu: 9, col: 6, tri: 5, hdl: 4, ldl: 4, cre: 4, ure: 3, hem: 2 }
  };
  const AGE_SHARE = [0.1, 0.2, 0.28, 0.24, 0.18];
  const MONTH_FACTOR = [0.85, 0.8, 1.15, 1.0, 0.95, 0.9, 0.75, 0.8, 1.2, 1.25, 1.1, 0.7];

  function pick(weights) {
    const keys = Object.keys(weights); let tot = 0; keys.forEach(function (k) { tot += weights[k]; });
    let r = rand() * tot; for (let i = 0; i < keys.length; i++) { r -= weights[keys[i]]; if (r <= 0) return keys[i]; }
    return keys[0];
  }
  function pickAge() { let r = rand(), acc = 0; for (let i = 0; i < AGE_SHARE.length; i++) { acc += AGE_SHARE[i]; if (r <= acc) return AGE_GROUPS[i]; } return AGE_GROUPS[2]; }

  // Tasa BCV "congelada" de ejemplo para cada día (sube con el tiempo)
  function bcvOn(d) { const days = Math.round((TODAY - d) / 864e5); return Math.max(300, RATES.bcv.value * Math.pow(0.9985, days)); }

  // Órdenes del último año para el Laboratorio Ejemplo
  const ORDERS = [];
  for (let back = 364; back >= 0; back--) {
    const d = addDays(TODAY, -back);
    const dow = d.getDay(); if (dow === 0) continue;
    const base = (dow === 6 ? 9 : 18) * MONTH_FACTOR[d.getMonth()] * (0.85 + 0.3 * (1 - back / 400));
    const n = Math.max(2, Math.round(base * (0.8 + rand() * 0.4)));
    for (let i = 0; i < n; i++) {
      const age = pickAge();
      const ex = pick(WEIGHTS[age]);
      const c = BY_ID[ex];
      ORDERS.push({ date: d, exam: ex, age: age, sex: rand() < 0.56 ? 'F' : 'M', usd: c.price, cost: c.cost, rate: bcvOn(d), paid: back < 3 ? rand() < 0.8 : true });
    }
  }

  const LABS = [
    { id: 'l1', name: 'Laboratorio Ejemplo', city: 'Valencia', state: 'Carabobo', plan: 'Pro', price: 120, status: 'Al día', due: 12, orders30: 0, since: 'ene 2026' },
    { id: 'l2', name: 'Laboratorio Norte', city: 'Maracay', state: 'Aragua', plan: 'Básico', price: 60, status: 'Al día', due: 20, orders30: 612, since: 'feb 2026' },
    { id: 'l3', name: 'Bioanálisis Valencia Sur', city: 'Valencia', state: 'Carabobo', plan: 'Pro', price: 120, status: 'Vence pronto', due: 3, orders30: 1480, since: 'mar 2026' },
    { id: 'l4', name: 'Clínica Santa Lucía', city: 'Barquisimeto', state: 'Lara', plan: 'Red', price: 260, status: 'Al día', due: 25, orders30: 2310, since: 'abr 2026' },
    { id: 'l5', name: 'Bioanálisis La Paz', city: 'Maracaibo', state: 'Zulia', plan: 'Básico', price: 60, status: 'Atrasado', due: -9, orders30: 205, since: 'jun 2026' },
    { id: 'l6', name: 'Laboratorio Andino', city: 'Mérida', state: 'Mérida', plan: 'Básico', price: 60, status: 'Prueba gratis', due: 14, orders30: 96, since: 'nov 2026' },
    { id: 'l7', name: 'Lab San Diego', city: 'San Diego', state: 'Carabobo', plan: 'Básico', price: 60, status: 'Al día', due: 8, orders30: 340, since: 'may 2026' },
    { id: 'l8', name: 'Maracay Plus', city: 'Maracay', state: 'Aragua', plan: 'Pro', price: 120, status: 'Al día', due: 17, orders30: 720, since: 'may 2026' },
    { id: 'l9', name: 'Lab La Victoria', city: 'La Victoria', state: 'Aragua', plan: 'Básico', price: 60, status: 'Al día', due: 22, orders30: 280, since: 'jul 2026' },
    { id: 'l10', name: 'Centro Médico Lara', city: 'Cabudare', state: 'Lara', plan: 'Pro', price: 120, status: 'Al día', due: 5, orders30: 810, since: 'jun 2026' },
    { id: 'l11', name: 'Lab Iribarren', city: 'Barquisimeto', state: 'Lara', plan: 'Básico', price: 60, status: 'Vence pronto', due: 2, orders30: 430, since: 'ago 2026' },
    { id: 'l12', name: 'Lab Zulia Norte', city: 'Maracaibo', state: 'Zulia', plan: 'Básico', price: 60, status: 'Al día', due: 11, orders30: 260, since: 'ago 2026' }
  ];


  const PLANS = [
    { name: 'Básico', price: 60, text: 'Resultados, firma y sello, 1 sede' },
    { name: 'Pro', price: 120, text: 'Todo lo anterior, reportes y precios, 3 sedes' },
    { name: 'Red', price: 260, text: 'Todo lo anterior, informes de la red, sedes ilimitadas' }
  ];

  const AUDIT_SEED = [
    { when: 'Hoy 08:14', who: 'Superadministrador', what: 'Aprobó alerta de la red #A-031 (zona Carabobo)' },
    { when: 'Ayer 17:02', who: 'Superadministrador', what: 'Envió enlace de reinicio de clave a Laboratorio Norte (recepción)' },
    { when: 'Ayer 11:40', who: 'Sistema', what: 'Pago registrado: Clínica Santa Lucía, 260 USD' }
  ];

  // Resultados de ejemplo del paciente (mismos valores del diseño)
  const PATIENT_RESULTS = [
    {
      id: 'LAB-0142', title: 'Azúcar y grasas en la sangre', lab: 'Laboratorio Ejemplo', date: '14 de noviembre de 2026', patient: '[NOMBRE DEL PACIENTE]', ci: 'V-••.•••.•45', age: 41, sex: 'F',
      values: [
        { id: 'glu', v: 108 }, { id: 'col', v: 212 }, { id: 'hdl', v: 52 }, { id: 'tri', v: 148 }, { id: 'ldl', v: 134 }
      ],
      history: { id: 'glu', points: [{ m: 'Feb', v: 92 }, { m: 'May', v: 97 }, { m: 'Ago', v: 103 }, { m: 'Nov', v: 108 }] }
    },
    {
      id: 'LAB-0117', title: 'Hematología completa', lab: 'Laboratorio Ejemplo', date: '2 de agosto de 2026', patient: '[NOMBRE DEL PACIENTE]', ci: 'V-••.•••.•45', age: 41, sex: 'F',
      values: [{ id: 'hem', v: 13.1 }, { id: 'cre', v: 0.9 }, { id: 'ure', v: 28 }], history: null
    },
    {
      id: 'LAB-0098', title: 'Función del riñón', lab: 'Laboratorio Ejemplo', date: '19 de mayo de 2026', patient: '[NOMBRE DEL PACIENTE]', ci: 'V-••.•••.•45', age: 41, sex: 'F',
      values: [{ id: 'cre', v: 1.7 }, { id: 'ure', v: 62 }], history: null
    }
  ];

  const DOCTOR_PATIENTS = [
    { name: 'Paciente A. R.', ci: 'V-••.•••.•45', exam: 'Azúcar y grasas', date: '14 nov', alerts: 2, until: '14 feb 2027', scope: 'Todos los resultados', flag: 'Glucosa en ascenso' },
    { name: 'Paciente M. G.', ci: 'V-••.•••.•18', exam: 'Hematología', date: '12 nov', alerts: 1, until: '30 ene 2027', scope: 'Solo hematología', flag: 'Hemoglobina baja' },
    { name: 'Paciente L. P.', ci: 'V-••.•••.•07', exam: 'Orina', date: '9 nov', alerts: 0, until: '02 mar 2027', scope: 'Todos los resultados', flag: '' },
    { name: 'Paciente J. T.', ci: 'V-••.•••.•92', exam: 'Función del riñón', date: '2 nov', alerts: 1, until: '15 dic 2026', scope: 'Solo función del riñón', flag: 'Creatinina alta' }
  ];

  // Red: conteos semanales por zona de un marcador de ejemplo (ya agregados, sin nombres)
  const NETWORK = {
    marker: 'Marcador de ejemplo: IgM positiva por dengue',
    weeks: ['S38', 'S39', 'S40', 'S41', 'S42', 'S43', 'S44', 'S45', 'S46', 'S47'],
    zones: [
      { zone: 'Carabobo', labs: 4, counts: [6, 5, 7, 6, 8, 11, 17, 26, 38, 49] },
      { zone: 'Aragua', labs: 3, counts: [4, 4, 5, 3, 5, 6, 6, 8, 9, 11] },
      { zone: 'Zulia', labs: 2, counts: [9, 8, 10, 9, 9, 10, 8, 9, 10, 9] },
      { zone: 'Mérida', labs: 1, counts: [1, 0, 2, 1, 0, 1, 2, 4, 5, 6] },
      { zone: 'Lara', labs: 3, counts: [5, 6, 5, 7, 6, 5, 7, 6, 8, 7] }
    ]
  };

  NETWORK.zones.forEach(function (z) { z.labs = LABS.filter(function (l) { return l.state === z.zone; }).length; });

  window.LABSDATA = { TODAY: TODAY, RATES: RATES, CATALOG: CATALOG, BY_ID: BY_ID, AGE_GROUPS: AGE_GROUPS, ORDERS: ORDERS, LABS: LABS, PLANS: PLANS, AUDIT_SEED: AUDIT_SEED, PATIENT_RESULTS: PATIENT_RESULTS, DOCTOR_PATIENTS: DOCTOR_PATIENTS, NETWORK: NETWORK };
})();
