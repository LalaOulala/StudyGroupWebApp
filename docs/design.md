# Study Group — Première version

## Intention et périmètre

Petit groupe d'étude Discord, douze personnes au départ. Application autonome : créer une session, rejoindre par invitation, poser des objectifs, suivre les avancées, faire un bilan, contribuer à une expédition collective. Aucune autorisation Discord requise. La demande explicite de commencer la réalisation suit le cadrage approuvé dans la conversation.

## Parcours

- Accueil sans faux membres ni sessions inventées. Profil invité persistant sur cet appareil (cookie HttpOnly) demandé lors de la première action.
- Création : titre, salon (Study Room 1, Study Room 2, Autre), 15 à 240 minutes, intention facultative. Identifiant aléatoire servant d'invitation.
- Un utilisateur doit rejoindre explicitement avant de lire les objectifs. Aperçu d'invitation limité au titre, salon, durée et nombre de participants.
- Chaque participant possède jusqu'à 8 objectifs, états à faire/en cours/avancé/terminé/bloqué. Seul le propriétaire les modifie. La session se synchronise en SSE.
- Échéance serveur ; seul l'organisateur peut terminer/prolonger. Le départ personnel se fait en envoyant le bilan. Fin collective quand tous ont fait leur bilan. Un rechargement ou onglet fermé n'est pas un départ.
- Bilan personnel enregistré une fois, tâches verrouillées ensuite. Historique persistant SQLite. Aucune récompense sans bilan.
- Récompense : après au moins 5 min et un objectif, 10 points de participation plus 0 à 10 points selon l'avancement moyen (avancé=0,5, terminé=1). Maximum 3 sessions récompensées par personne par jour UTC ; ne pas récompenser les microtâches ou une présence prolongée.
- Expédition : seuils 0/60/160/300/500 points pour premier pas/camp de base/forêt des idées/col des possibles/citadelle du savoir. Le visuel représente l'ambiance cible ; les lieux débloqués sont indiqués explicitement.

## Identité et données

Un compte invité fonctionne uniquement avec son cookie sur ce navigateur ; il ne promet pas de récupération ni d'authentification Discord. Identifiants internes stables et discord_id nullable pour une future liaison. Pas de contenu réel du serveur importé. Accès aux objectifs réservé aux participants munis d'une invitation. Projet à usage privé pilote ; hébergement public à préparer séparément.

## Architecture

React + TypeScript + Vite, Express, SQLite natif Node 22.13+. API même origine ; cookie opaque dont le hash est stocké. Validation Zod, contrôle d'origine des mutations, autorisations côté serveur. Répertoire de données ignoré par Git. Un seul processus serveur sert l'API, SSE et le site (Vite middleware en développement, dist en production).

## Design

Référence Image Gen : screenshot complet 1505×1045. Fond ivoire #f8f7f3, surfaces blanches, vert forêt #254e3e, sauge, bordures #e2e4db. Titres Lora, interface DM Sans. Sidebar 228px, contenu 1100px max, lignes de sessions, bannière illustration d’aventure, rayons 8 à 12px, icônes Lucide 1.6px. Navigation : Sessions, Ma progression, L’expédition, Mon profil. Mobile : en-tête compact et navigation horizontale, colonnes empilées. Transitions discrètes et respect de reduced-motion.

## Validation

Tests serveur : deux identités, isolation des objectifs, clôture autorisée, échéance, validation, bilans idempotents, plafonds de points, persistence après redémarrage. Navigateur : création → lien → second participant → tâches synchronisées → bilan → progression, plus navigation clavier et viewport mobile.

## Décisions de réalisation

- L’utilisateur a demandé de commencer à produire, après cadrage en conversation : réalisation autonome, sans nouvelle demande de validation documentaire.
- Choix confirmé en cours de réalisation : aventure et quêtes coopératives, remplace la bibliothèque proposée par défaut.
- Dossier demandé explicitement, dépôt initialement vide : travail dans ce dossier, pas de worktree supplémentaire.
- Illustration générée séparément : même composition et palette que la référence, paysage différent assumé. Accueil vide sans session fictive ; la ligne de référence apparaît après création réelle.
