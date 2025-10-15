# 🏛️ Application TAG - Gestion des Interventions Juridiques

> Application web pour la gestion mutualisée des interventions juridiques des communes du Groenland

## 📋 À Propos

**TAG** (Tekniske Agentur Grønland) est une agence juridique qui apporte une aide juridique aux 64 communes du Groenland. Cette application modernise leur système en remplaçant les échanges par email par une plateforme centralisée et sécurisée.

## 🛠 Stack Technique

### Backend (Actuel)

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM base de données
- **PostgreSQL** - Base de données

### Frontend (À venir)

- **React** - Interface utilisateur
- **Tailwind CSS** - Styling

## 🚀 Installation

### Prérequis

- Node.js 18+
- PostgreSQL 15+

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

### 2. Base de données

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 📁 Structure Actuelle

```text
TAG/
├── backend/
│ ├── prisma/
│ │ └── schema.prisma
│ ├── server.js
│ └── package.json
└── README.md
```
