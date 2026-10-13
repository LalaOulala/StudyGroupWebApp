# Direction graphique — aventure coopérative rétro

## Intention

Transformer l’interface de suivi en un petit jeu coopératif, en conservant le parcours : créer ou rejoindre une session, poser ses objectifs, les faire avancer et enregistrer son bilan. La refonte ne change ni l’API, ni les règles d’attribution, ni les permissions, ni les échéances. Le vocal reste indépendant dans Discord.

Les références fournies associent affiches de consoles, papier crème, impressions contrastées et fenêtres informatiques illustrées en pixel art. La réalisation reprend cette direction avec une scène et un personnage originaux, sans réutiliser les marques ou les personnages des affiches.

## Composition et langage visuel

- Navigation horizontale en trois destinations : Le lobby, Mon joueur, La carte.
- Lobby : accroche, progression personnelle, grande fenêtre illustrée et accès immédiat à la création ou à une invitation.
- Session : bandeau d’équipe, objectifs de chaque participant et minuteur. L’illustration immersive reste dans le lobby et sur la carte ; les tâches occupent l’écran de travail.
- Profil : compagnon, niveau, statistiques existantes, insignes, historique et coéquipiers.
- Carte : cinq étapes consultables. Choisir une étape affiche son détail sur la même page ; aucune exploration n’est obligatoire.

Palette : crème `#f4f0df`, encre `#20252b`, cobalt `#234ecb`, corail `#ed6547`, jaune `#f5dc7b`, vert `#527747`. Bordures franches, ombres décalées et pression des boutons rendent les contrôles identifiables. Bungee porte les grandes accroches, Anton les titres compacts, VT323 les compteurs et DM Sans les textes. Toutes les polices sont locales.

## Gamification reliée aux actions utiles

| Besoin                         | Retour visible                                   | Donnée utilisée                                                   |
| ------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------- |
| Voir ses petites avancées      | Jauge et validation d’objectif en un clic        | Terminé = 100 %, bien avancé = 50 %, autres états = 0 %           |
| S’engager avec les autres      | Avancement d’équipe et objectifs visibles        | Objectifs des participants de la session                          |
| Mesurer son parcours           | Niveau personnel et jauge vers le suivant        | Niveau = 1 + partie entière des XP / 100                          |
| Partager une destination       | Étapes de carte à 60, 160, 300 et 500 XP         | Total collectif existant                                          |
| Garder une trace des réussites | Quatre insignes                                  | Statistiques et compagnons existants, aucun nouvel enregistrement |
| Ressentir une réussite         | Notification courte, particules et montant gagné | Réponse réussie du serveur                                        |

Les insignes reconnaissent le premier bilan, un objectif terminé comptabilisé au bilan, un bilan partagé avec un coéquipier et le camp de base collectif. Ils ne donnent pas de points supplémentaires.

Les niveaux et insignes sont calculés à partir des données existantes. Il n’y a ni classement, ni série quotidienne à entretenir, ni perte de points, ni récompense aléatoire. Un objectif achevé ne donne pas de XP immédiatement : l’attribution reste au bilan. Une erreur réseau ne déclenche pas de célébration ; charger une page ne rejoue pas une récompense. La notification n’interrompt pas la saisie et disparaît après 5,5 secondes ou sur fermeture.

## Ressources visuelles

- `public/study-world.webp` : paysage original généré, partagé par le lobby et la carte. Source panoramique de 2172 × 724, export WebP.
- `public/companion.png` : petit robot original en pixel art, fond transparent, hauteur 384 px.
- `public/favicon.svg` : icône vectorielle de direction de jeu.

Les concepts et les ressources ont été générés séparément. Les instructions de direction suivantes décrivent les productions :

**Concept lobby** : interface de jeu coopératif Study Group, format ordinateur, affiche rétro crème et encre, fenêtres cobalt, navigation horizontale, grand titre « On avance. Ensemble. », paysage pixel art avec tente et citadelle reliée par un pont de livres, panneau de création de session à gauche, progression personnelle et collective, liste des sessions.

**Concept session** : même identité rétro, écran calme de travail coopératif, bandeau bleu avec avancement d’équipe, deux panneaux d’objectifs personnels côte à côte, minuteur jaune dans une colonne latérale, contrôles et texte lisibles.

**Paysage** : panorama pixel art original, tente orange et campement à gauche, lac bleu, montagnes, pont formé de livres et citadelle à droite, composition de jeu d’aventure accueillante, sans interface, sans texte ni marque.

**Compagnon** : petit robot de quête en pixel art, coque crème, visage noir, yeux bleus, sac corail et livre bleu, vue de trois quarts, silhouette entière sur fond transparent, sans texte ni marque.

## Accessibilité et validation

Les contrôles restent de vrais boutons, champs et sélecteurs ; les fenêtres de saisie utilisent un dialogue natif. Les jauges ont un libellé accessible, la carte expose l’étape sélectionnée et les notifications utilisent une annonce polie. Le clavier dispose d’un lien d’accès au contenu et d’un focus visible, y compris dans les onglets. La préférence `prefers-reduced-motion` supprime les animations et les particules.

Le parcours a été vérifié avec deux contextes de navigateur indépendants : rejoindre, saisir, modifier, terminer un objectif, synchroniser, enregistrer son bilan et retrouver son historique. Les vérifications incluent un échec réseau simulé, le maintien du brouillon, l’absence de fausse récompense, un bilan à 0 XP et un bilan réel à 20 XP, le passage de 80 à 100 XP personnels, le déblocage collectif, la navigation au clavier et des largeurs de 320, 375, 390, 768 et 1536 px. Les données de démonstration sont restées dans une base de test séparée.
