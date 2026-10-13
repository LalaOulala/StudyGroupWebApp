# Study Group

Des sessions d’étude, des objectifs partagés et une aventure collective. Cette première version accompagne un petit groupe Discord sans demander de bot ni de droits administrateur.

## Lancer le site

Prérequis : Node.js **22.13 ou plus récent**, avec le module SQLite natif.

```sh
npm ci
npm run dev
```

Ouvrir **http://127.0.0.1:3000**. La base est créée automatiquement dans `data/study-group.sqlite`. Aucun service externe ni secret n’est nécessaire. Le message « SQLite is an experimental feature » de Node 22 est attendu.

Pour servir la version compilée :

```sh
npm run build
npm start
```

Les réglages facultatifs sont dans `.env.example` : copier ce fichier vers `.env` pour changer le port, l’adresse d’écoute ou l’emplacement de la base. Le fichier `.env` et les données locales ne sont pas suivis par Git.

## Le parcours

1. Choisir son pseudo et sa couleur de profil.
2. Créer une session de 15 à 240 minutes et indiquer le salon vocal habituel.
3. Partager le lien d’invitation. Chacun rejoint explicitement avant de pouvoir lire les objectifs.
4. Ajouter ses objectifs et leur état : à faire, en cours, bien avancé, terminé ou bloqué. Les changements se synchronisent entre les participants.
5. Faire son bilan personnel. Les autres peuvent continuer ; l’organisateur peut aussi terminer ou prolonger la session pour tous.
6. Retrouver son historique, les compagnons avec qui on a étudié et l’expédition du groupe.

L’échéance termine la session côté serveur. Fermer un onglet ne termine pas la participation ; le bilan reste disponible après l’échéance. Les objectifs restent modifiables jusqu’au bilan personnel, puis sont figés.

## Points et expédition

Après au moins cinq minutes de participation et avec au moins un objectif, un bilan rapporte **10 points de participation + jusqu’à 10 points d’avancement**. L’avancement est la moyenne des objectifs : terminé = 100 %, bien avancé = 50 %, autres états = 0 %. Multiplier les objectifs n’augmente donc pas le maximum. Les trois premières sessions récompensées de la journée UTC comptent ; les suivantes restent dans l’historique. Un bilan ne peut être récompensé qu’une fois.

Les points individuels alimentent le total collectif. À 60, 160, 300 et 500 points, le groupe débloque le camp de base, la forêt des idées, le col des possibles et la citadelle du savoir. Il n’y a ni classement entre membres ni perte de points.

## Interface de jeu

Le lobby, la fiche de joueur et la carte adoptent un univers rétro : paysage en pixel art, petit compagnon, fenêtres cobalt et boutons tactiles. Les points existants s’affichent en XP ; chaque tranche de 100 XP personnels ouvre un niveau. Quatre insignes reflètent les bilans, les objectifs terminés, les compagnons et la progression du groupe.

Pendant une session, les jauges montrent l’avancement déclaré de chacun et de l’équipe. Terminer un objectif produit un retour bref ; le bilan affiche uniquement les XP réellement accordés par le serveur. Les animations respectent la préférence système de réduction des mouvements. Aucun champ ni écran obligatoire n’a été ajouté au parcours. Les choix et les ressources visuelles sont documentés dans [la direction graphique](docs/retro-design.md).

## Limites de cette première version

- **Profil invité lié au navigateur**, conservé par cookie pendant un an : pas encore de connexion Discord, de récupération ou de synchronisation du compte entre appareils. Supprimer les cookies fait perdre l’accès à ce profil.
- **Le vocal reste dans Discord.** La présence et la fin des appels ne sont pas détectées. Le nom du salon est une indication, sans création ni réservation automatique.
- **L’adresse locale fonctionne seulement sur l’ordinateur qui héberge le site.** Pour inviter les autres membres à distance, il faut mettre l’application sur un hébergement commun.
- Toute personne possédant un lien de session peut la rejoindre tant qu’elle est active. Les invitations ne vérifient pas l’appartenance au serveur Discord. Partager les liens uniquement avec le groupe.
- Cette installation représente un seul groupe. La progression collective agrège tous ses profils. Il n’y a pas encore de modération, de suppression de compte ou de gestion de plusieurs groupes.
- Les points reposent sur des avancées déclarées, sans surveillance de l’activité réelle.

## Hébergement ultérieur

Prévoir **un processus Node avec un disque persistant** pour SQLite. Un hébergement purement statique, comme GitHub Pages, ne suffit pas. Configurer `HOST=0.0.0.0` si l’hébergeur l’exige, un accès HTTPS, `PUBLIC_ORIGIN` avec l’origine exacte du site et `SECURE_COOKIES=1`. Le proxy doit laisser passer les événements SSE sans mise en tampon. Le mode développement ne sert pas au déploiement public.

Avant un pilote public, prévoir la sauvegarde de SQLite et décider de l’accès au groupe et de la récupération des profils. Pour une sauvegarde simple : arrêter le serveur proprement, copier le dossier `data/`, puis redémarrer. Ne jamais publier cette base dans le dépôt. Pour sauvegarder sans interruption, utiliser l’API de sauvegarde SQLite.

La future intégration Discord pourra lier les identités, ouvrir directement le salon vocal et synchroniser les arrivées/départs. Les champs d’identification sont prévus, mais aucune intégration Discord n’est active dans cette version.

## Vérification et structure

```sh
npm test
npm run build
```

Les tests couvrent deux participants, les autorisations, la confidentialité de l’aperçu, les échéances, la persistance, la validation des entrées et l’attribution unique des points. Le parcours complet a aussi été vérifié dans deux contextes de navigateur indépendants, sur ordinateur et mobile, avec un échec réseau simulé pendant la modification d’un objectif.

- `src/` : interface React et TypeScript, styles et composants.
- `server/` : API Express, diffusion SSE, règles métier et SQLite.
- `tests/` : tests du domaine et de l’API HTTP.
- `public/` : illustration d’aventure générée et icône.
- `docs/` : périmètre, décisions et plan de réalisation.

Les polices sont servies localement. Aucune donnée de membre du serveur Discord n’a été importée.
