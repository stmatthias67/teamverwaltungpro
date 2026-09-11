# TeamManager - Professional Football Club Management Web App

Eine vollständige, produktionsreife Next.js-Webanwendung zur Verwaltung von Fußballvereinen mit modernem Tech Stack.

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Features

- ✅ **Dashboard** - Live-Übersicht mit Wetter, nächsten Spielen und Statistiken
- ✅ **Kaderverwaltung** - Spieler hinzufügen, bearbeiten, löschen mit Status-Tracking
- ✅ **Event-Kalender** - Training und Spiele mit iCal-Import
- ✅ **Check-In System** - Schnelle binäre Anwesenheitsverfolgung
- ✅ **Taktik-Board** - Multi-Field Visualisierung mit verschiedenen Formationen
- ✅ **Material-Verwaltung** - Trikotwäsche-Tracking und Inventar
- ✅ **Live Theme Engine** - Dynamische Farbpicker mit Datenbankpersistenz
- ✅ **Responsive Design** - Desktop, Tablet und Mobile optimiert

---

## 🏗️ Architektur

### Tech Stack

```
Frontend:
├── Next.js 14 (React, TypeScript)
├── TailwindCSS
├── React Hooks & State Management
└── date-fns (Datum/Uhrzeit)

Backend:
├── Next.js API Routes
├── Prisma ORM
├── PostgreSQL
└── Node.js Runtime

Deployment:
├── Vercel (Hosting)
├── Vercel Postgres / Supabase / Neon (Datenbank)
└── GitHub (Version Control)
```

### Projekt-Struktur

```
teammanager/
├── app/
│   ├── api/
│   │   ├── players/
│   │   │   ├── route.ts          # GET/POST players
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET/PATCH/DELETE single player
│   │   ├── events/
│   │   ├── attendance/
│   │   ├── laundry/
│   │   ├── settings/
│   │   └── ical-import/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── squad/
│   │   └── page.tsx
│   ├── events/
│   ├── check-in/
│   ├── tactics/
│   ├── material/
│   ├── settings/
│   ├── layout.tsx               # Root Layout mit Navigation
│   └── globals.css              # Global Styles
├── prisma/
│   ├── schema.prisma            # Datenbankschema
│   └── seed.js                  # Test-Daten
├── lib/
│   └── types.ts                 # TypeScript Typen
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🗄️ Datenbankschema

### Tabellen-Übersicht

#### Players
```
id: UUID
jerseyNumber: INT (UNIQUE)
name: STRING
status: ENUM (ACTIVE | SICK | INJURED)
parentPhone: STRING (optional)
parentWhatsapp: STRING (optional)
createdAt: DATETIME
updatedAt: DATETIME
```

#### Events
```
id: UUID
title: STRING
type: ENUM (MATCH | TRAINING | TOURNAMENT)
date: DATETIME
meetTime: DATETIME (optional)
location: STRING
distanceInfo: STRING (optional)
isAway: BOOLEAN
createdAt: DATETIME
updatedAt: DATETIME
```

#### Attendance
```
id: UUID
eventId: STRING (FK -> Events)
playerId: STRING (FK -> Players)
status: ENUM (PRESENT | ABSENT)
updatedAt: DATETIME
UNIQUE(eventId, playerId)
```

#### LaundryLog
```
id: UUID
playerId: STRING (FK -> Players, UNIQUE)
count: INT (Default 0)
lastWashedAt: DATETIME (optional)
createdAt: DATETIME
updatedAt: DATETIME
```

#### UserSettings
```
id: UUID
themePrimary: STRING (Hex-Farbe)
themeBgMain: STRING
themeBgCard: STRING
themeSecondary: STRING
createdAt: DATETIME
updatedAt: DATETIME
```

---

## 🚀 Installation & Setup

### 1. Repository klonen

```bash
git clone <repository-url>
cd teammanager
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Environment Variablen konfigurieren

```bash
cp .env.example .env.local
```

Bearbeiten Sie `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/teammanager_db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Datenbankschema initialisieren

```bash
# Prisma Client generieren
npm run db:generate

# Schema zur Datenbank pushen
npm run db:push

# (Optional) Seed-Daten laden
npm run db:seed
```

### 5. Development-Server starten

```bash
npm run dev
```

Öffnen Sie http://localhost:3000 im Browser.

---

## 📡 API-Endpoints Übersicht

### Players
```
GET    /api/players              # List alle Spieler
POST   /api/players              # Neuen Spieler erstellen
GET    /api/players/[id]         # Einzelnen Spieler abrufen
PATCH  /api/players/[id]         # Spieler aktualisieren
DELETE /api/players/[id]         # Spieler löschen
```

### Events
```
GET    /api/events               # List alle Events
POST   /api/events               # Neues Event erstellen
GET    /api/events/[id]          # Einzelnes Event abrufen
PATCH  /api/events/[id]          # Event aktualisieren
DELETE /api/events/[id]          # Event löschen
```

### Attendance
```
GET    /api/attendance           # Anwesenheitsrekorde abrufen
POST   /api/attendance           # Anwesenheit erfassen/aktualisieren
DELETE /api/attendance           # Anwesenheit löschen
```

### Laundry
```
GET    /api/laundry              # Wäsche-Logs abrufen
PATCH  /api/laundry              # Wäschezähler erhöhen (+1)
```

### Settings
```
GET    /api/settings             # Einstellungen abrufen
PATCH  /api/settings             # Einstellungen aktualisieren
```

### iCal Import
```
POST   /api/ical-import          # iCal-Datei hochladen & parsen
```

---

## 🔑 Key Features - Code-Beispiele

### 1. Spieler hinzufügen

```typescript
// Beispiel: POST /api/players
const response = await fetch('/api/players', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jerseyNumber: 7,
    name: 'Anna Schmidt',
    status: 'ACTIVE',
    parentPhone: '+491234567891',
    parentWhatsapp: '491234567891',
  }),
});
```

### 2. Anwesenheit erfassen

```typescript
// Beispiel: POST /api/attendance
const response = await fetch('/api/attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: 'event-123',
    playerId: 'player-456',
    status: 'PRESENT',
  }),
});
```

### 3. Wäsche eintragen

```typescript
// Beispiel: PATCH /api/laundry
const response = await fetch('/api/laundry', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerId: 'player-456',
  }),
});
// Inkrementiert count um 1 und setzt lastWashedAt = NOW()
```

### 4. Theme aktualisieren

```typescript
// Beispiel: PATCH /api/settings
const response = await fetch('/api/settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    themePrimary: '#2ea043',
    themeBgMain: '#0d1117',
    themeBgCard: '#161b22',
    themeSecondary: '#1f6feb',
  }),
});
```

---

## 🚢 Vercel Deployment

Siehe [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) für vollständige Deployment-Anleitung.

### Quick Deploy

```bash
# Vercel CLI installieren
npm i -g vercel

# Deployen
vercel --prod
```

---

## 🔒 Sicherheit

- ✅ Umgebungsvariablen für sensitive Daten
- ✅ SQL-Injection-Schutz durch Prisma ORM
- ✅ CORS-Konfiguration in next.config.js
- ✅ Input-Validierung in API-Routes
- ✅ Automatische HTTPS auf Vercel

**Zukunftsschritte:**
- JWT-basierte Authentifizierung
- Role-Based Access Control (RBAC)
- Audit-Logging
- API-Rate-Limiting

---

## 📊 Performance

- ⚡ Next.js 14 mit React Server Components
- 🗄️ Optimierte Prisma Queries mit Indexing
- 📦 Automatic Code Splitting
- 🎯 Image Optimization
- 💾 ISR (Incremental Static Regeneration)

---

## 🧪 Testing

```bash
# Unit Tests (mit Jest)
npm run test

# E2E Tests (mit Playwright)
npm run test:e2e

# Type Checking
npm run type-check
```

---

## 📱 Zukünftige Features

- [ ] Native Mobile App (React Native / Flutter)
- [ ] Push-Benachrichtigungen
- [ ] Team-Chat & Messaging
- [ ] Statistiken & Analytics Dashboard
- [ ] Fotoalbum & Archiv
- [ ] Payment-Integration (Beiträge)
- [ ] Video-Highlights

---

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

---

## 📄 Lizenz

MIT License - siehe [LICENSE](./LICENSE) für Details.

---

## 👥 Support

- **Dokumentation:** https://docs.teammanager.dev
- **Issues:** https://github.com/teammanager/issues
- **Discord:** https://discord.gg/teammanager

---

## 🎉 Credits

Entwickelt für **SV Schloßberg** mit ⚽ Love

**Version:** 1.0.0  
**Last Updated:** September 2026

---

**Viel Erfolg mit TeamManager! 🚀**
