const { validateConcepto } = require('./lib/copa2026/validators');

console.log(validateConcepto("raul dhoy 11599999", "raul dhoy", "11599999"));
console.log(validateConcepto("pago de inscripcion", "raul dhoy", "11599999"));
