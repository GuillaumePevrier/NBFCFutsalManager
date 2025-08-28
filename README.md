# NBFC Futsal Manager

## Descri problème sur Vercel

NBFC  est conçue pour aider les coachs du Noya FC à gérer leurs tactiques, leurs équipes et leurs . Elle offre une plateforme ntralisée pour , la communication avec les joueurs et le des matchs en réel.

 l'application une nce que sur un ordinateur de bureau rrain depu one.

-   **Tableau Tactique * :errain de futsal SVG où les fragments, la date durègne de SNEF ou pasglisser-déposer des (joueurs) définir des compositions.
-   pour le match, organisez les titulaires et les remplaçants sur un banc de touche dédié.
-   **Suivi de Match en Direct** : avec score, chronomètre (temps arrêté ou continu), gestion des fautes et des périodes.
-   **Synchronisation en Temps Réel** : , toutes les (positions des joueurs, score, chronomètre, fautes) sont synchronisées instantanément sur tous les appareils connectés. Les spectateurs voient les mises à jour en direct.
-   **Notifications   : Un système de notification push puissant pour tenir les joueurs et les supporters informés. Les notifications sont envoyées automatiquement à chaque but marqué.
-   **Gestion des Matchs** : Planifiez les matchs à venir en définissant l'adversaire, la date, l'heure et le lieu.
-   **Accès par Rôle (Coach/Visiteur)** : Les coachs, authentifiés via **Supabase Auth**, disposent de pleins pouvoirs d'édition. Les joueurs et les visiteurs ont un accès en lecture seule, leur permettant de suivre le match en direct sans pouvoir altérer les données.

## Architecture et Stack Technique

L'application est construite sur un socle de technologies modernes, choisies pour leur performance, leur fiabilité et leur expérience de développement.

-   **Framework Frontend** : **Next.js 15** avec l'**App Router**. Cela permet de bénéficier du rendu côté serveur (SSR) pour un chargement initial rapide et d'une navigation fluide côté client.
-   **Librairie UI** : **React** avec **TypeScript**. L'utilisation de TypeScript garantit un code plus sûr, plus robuste et plus facile à maintenir.
-   **Style et Composants** :
    -   **Tailwind CSS** : Pour un style rapide et personnalisable directement dans le balisage.
    -   **ShadCN UI** : Une collection de composants d'interface utilisateur réutilisables, esthétiques et accessibles, basés sur Radix UI et Tailwind CSS.

### Services Backend et Cloud

-   **Base de Données et Backend "as a Service"** : **Supabase**
    -   **Supabase Database** : Une base de données PostgreSQL qui stocke toutes les informations sur les matchs, les équipes et les joueurs.
    -   **Supabase Auth** : Gère l'authentification sécurisée des coachs par email et mot de passe.
    -   **Supabase Realtime** : La technologie clé pour la synchronisation en direct. L'application écoute les changements sur la table `matches` et met à jour l'interface utilisateur instantanément pour tous les clients connectés.

-   **Notifications Push** : **OneSignal**
    -   Un service tiers qui gère de manière fiable la collecte des abonnés aux notifications et la livraison des messages push sur les navigateurs web (desktop et mobile).
    -   L'intégration se fait via le package `react-onesignal` côté client et une API REST côté serveur.
- 
    -   Bien que le nom suggère une IA, nous utilisons Genkit comme un "orchestrateur" de tâches backend sécurisées.
    -   Un **Flow Genkit** (`send-onesignal-notification`) est défini côté serveur. Il contient la logique pour appeler l'API de OneSignal avec la clé secrète (REST API Key).
    -   Cela permet de ne jamais exposer les clés secrètes côté client, renforçant ainsi la sécurité de l'application. Le composant `Scoreboard` appelle ce flow lorsqu'un but est marqué.z