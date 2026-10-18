// lib/player-validation.js
// Validierung und Normalisierung der Spielerdaten (POST und PATCH).
// Liegt bewusst NICHT in einer route.js, weil Next.js dort nur HTTP-Handler exportieren darf.

const GROUPS = ['A', 'B', 'C', 'D'];
const FEET = ['R', 'L'];

function clean(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

export function normalizePlayer(body) {
  const data = {};

  if ('firstName' in body) data.firstName = clean(body.firstName);
  if ('lastName' in body) data.lastName = clean(body.lastName);

  if ('birthYear' in body) {
    const y = body.birthYear === '' || body.birthYear == null ? null : Number(body.birthYear);
    if (y !== null && (!Number.isInteger(y) || y < 2000 || y > 2030)) {
      throw new ValidationError('Ungültiger Jahrgang');
    }
    data.birthYear = y;
  }

  if ('strongFoot' in body) {
    const f = clean(body.strongFoot);
    if (f && !FEET.includes(f)) throw new ValidationError('Starker Fuß muss R oder L sein');
    data.strongFoot = f;
  }

  if ('performanceGroup' in body) {
    const g = clean(body.performanceGroup);
    if (g && !GROUPS.includes(g)) throw new ValidationError('Gruppe muss A, B, C oder D sein');
    data.performanceGroup = g;
  }

  if ('nationality' in body) data.nationality = clean(body.nationality);
  if ('parentName' in body) data.parentName = clean(body.parentName);
  if ('parentPhone' in body) data.parentPhone = clean(body.parentPhone);
  if ('parentWhatsapp' in body) data.parentWhatsapp = clean(body.parentWhatsapp);

  return data;
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
