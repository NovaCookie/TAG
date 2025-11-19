# 🏛️ Application TAG - Gestion des Interventions Juridiques

> Application web complète pour la gestion mutualisée des interventions juridiques des 64 communes du Groenland

## 📋 Contexte

**TAG** (Tekniske Agentur Grønland) est l'agence technique qui apporte une aide juridique aux communes groenlandaises. Cette application modernise leur système historique basé sur les emails en offrant une plateforme centralisée, sécurisée et conforme RGPD.

## 🎯 Fonctionnalités principales

### Pour les communes

- Création de questions juridiques avec pièces jointes
- Suivi en temps réel du statut des interventions
- Notation des réponses (1 à 5 étoiles)
- Consultation de l'historique

### Pour les juristes TAG

- Gestion centralisée des questions
- Système de suggestions de questions similaires
- Réponses enrichies avec pièces jointes
- Publication en FAQ

### Pour les administrateurs

- Gestion complète des utilisateurs et communes
- Tableaux de bord statistiques avancés
- Archivage automatique RGPD
- Politiques de rétention paramétrables

## 🛠 Stack Technique

### Frontend

- **React** - Interface utilisateur moderne
- **Tailwind CSS** - Système de design responsive
- **Context API** - Gestion d'état globale
- **Axios** - Client HTTP

### Backend

- **Node.js** - Runtime JavaScript
- **Express** - Framework web RESTful
- **Prisma** - ORM type-safe
- **PostgreSQL** - Base de données relationnelle

### Sécurité & Conformité

- **JWT** - Authentification sécurisée
- **bcrypt** - Hashage des mots de passe
- **Multer** - Gestion sécurisée des uploads
- **Cron** - Archivage automatique RGPD

## 🚀 Déploiement

### Environnements

- **Frontend** : Vercel
- **Backend** : Render
- **Base de données** : Neon Tech (PostgreSQL)

### Accès démo

- Application : [lien-vers-l-application]
- Documentation : [lien-vers-la-doc]
- Code source : [lien-vers-github]

## 📊 Architecture

### Modèle de données

7 entités principales : Utilisateurs, Communes, Interventions, Thèmes, Pièces jointes, Archives, Politiques de rétention

### API REST

45+ endpoints organisés par domaine métier avec gestion fine des permissions

### Services métier

10 services spécialisés : Archive, Stats, Suggestion, Email, Upload, etc.

## 🔒 Conformité RGPD

- Archivage automatique basé sur politiques de rétention
- Journalisation complète des actions sensibles
- Blocage des accès aux données archivées
- Durées de conservation paramétrables par thème

## 📈 Roadmap

### V1.1 (Prochaine)

- Mode sombre activé
- Recherche plein texte optimisée
- Exports PDF améliorés

### V1.2 (Future)

- Notifications temps réel
- API publique
- Consentement renforcé

## 👥 Équipe

Moi même :)

Développé dans le cadre du titre CDA (Concepteur Développeur d'Applications)
