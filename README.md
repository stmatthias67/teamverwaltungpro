<div align="center">

# ⚽ TeamManager Pro – SV Schloßberg

**Die moderne, leistungsstarke All-in-One Plattform zur professionellen Verwaltung von Fußballteams.**

[![Status](https://img.shields.io/badge/Status-Live%20&%20Production-2ea44f?style=for-the-badge&logo=vercel&logoColor=white)](https://teamverwaltungpro.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon.tech-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[🛈 Demo Ansehen](https://teamverwaltungpro.vercel.app) • [🐛 Fehler Melden](https://github.com/stmatthias67/teamverwaltungpro/issues)

</div>

---

## 📌 Über das Projekt

**TeamManager Pro** vereinfacht den Alltag von Trainern und Betreuern. Anstatt viele verschiedene Tabellen und Nachrichten-Gruppen zu nutzen, bündelt diese Web-App alle wichtigen Vereinsfunktionen in einer zentralen, übersichtlichen Benutzeroberfläche.

---

## ✨ Key Features

| Modul | Beschreibung |
| :--- | :--- |
| 📊 **Interactive Dashboard** | Live-Wetteranzeige (Stephanskirchen), schnelle Statistiken & Übersicht der nächsten Trainingseinheiten |
| 👥 **Kaderverwaltung** | Spielerprofile erstellen, Spielernummern verwalten & Status-Tracking (Aktiv, Krank, Verletzungsstatus) |
| 📅 **Event-Kalender** | Terminplanung für Spiele, Training & Turniere |
| ✅ **Digitaler Check-In** | Schnelle Erfassung von Anwesenheiten & Fehlzeiten der Spieler |
| 📋 **Taktik-Board** | Visuelle Spielfeld-Aufstellung und Formationsplanung |
| 🧺 **Material & Trikotwäsche** | Waschtaschen-Tracking mit automatischer Zähler-Logik & Erinnerungssystem |
| ⚙️ **Custom Settings** | Dynamisches Design & Anpassen der Vereinsfarben |

---

## 🛠️ Tech Stack & Architektur

```text
teammanager/
├── 🌐 Frontend:       Next.js 14 (App Router) & React
├── 🎨 Styling:        Tailwind CSS & Autoprefixer
├── 🗄️ ORM:            Prisma (v5.22)
├── 🐘 Datenbank:      PostgreSQL (Serverless via Neon.tech)
└── 🚀 Hosting:        Vercel (CI/CD Automated Deployment)

📂 Projekt-Struktur
teamverwaltungpro/
├── app/
│   ├── api/                     # Backend API Routes
│   │   ├── attendance/          # Anwesenheits-Endpunkt
│   │   ├── events/              # Event-Management
│   │   ├── laundry/             # Trikotwäsche-Logik
│   │   └── players/             # Spieler-Verwaltung
│   ├── globals.css              # Globale Styles & Tailwind Directives
│   ├── layout.js                # Root Layout mit Navigation
│   └── page.js                  # Haupt-Dashboard & Module (SPA Router)
├── lib/
│   └── prisma.js                # Singleton Prisma Client Instanz
├── prisma/
│   └── schema.prisma            # PostgreSQL Datenbankschema
├── jsconfig.json                # Pfad-Aliases (@/lib/prisma)
├── next.config.js               # Next.js Konfiguration
├── tailwind.config.js           # Tailwind Theme Konfiguration
└── package.json                 # Project Dependencies & Scripts

```

<div align="center">
Made with ❤️ for SV Schloßberg
</div>

