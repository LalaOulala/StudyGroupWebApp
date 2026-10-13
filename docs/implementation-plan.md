# Study Group Implementation Plan

> Execution inline using executing-plans. Spec: design.md.

**Goal:** livrer un site autonome utilisable à plusieurs, prévisualisable localement, préparé pour Discord.
**Architecture:** React/TypeScript consomme une API Express même origine et SSE. SQLite conserve les identités, sessions, tâches et récompenses.
**Constraints:** Node >=22.13, français, aucun faux utilisateur, pas de bot ni déploiement automatique, points idempotents.

## Review focus

Horloge d'échéance serveur ; accès via invitation ; modifications par non-propriétaire ; double bilan ; perte de connexion.

## Task 1 — Domaine et persistance

Fichiers server/store.js, tests/store.test.js. Interface createStore({filename, now}) et méthodes profile/createSession/join/task/review/finish/extend/snapshot/bootstrap. Écrire les tests d'autorisation, persistance et bilan avant le domaine, constater les échecs, implémenter, repasser la suite.

## Task 2 — API et synchronisation

Fichiers server/app.js, server/index.js, tests/api.test.js. Cookie HttpOnly opaque, POST/PATCH validation et origine, GET sessions avec aperçu protégé, SSE réservé aux participants. Tests HTTP réels sur serveur éphémère : deux clients, entrée malformée, mutation interdite, cookie invalide.

## Task 3 — Interface complète

Fichiers src/{App,main,types,api,styles}, src/components, src/pages. Accueil, création et invitation, session/tâches/bilan, progression, expédition. Fonctionnalités métier couvertes par les tests serveur ; interaction vérifiée ensuite dans le navigateur.

## Task 4 — Vérification et livraison

Build TypeScript/Vite, tests serveur, Playwright desktop/mobile à deux contextes, comparaison visuelle de la référence et du rendu. Relecture indépendante du code, corrections nécessaires, README démarrage et limites, commit et livraison dans le dépôt fourni.
