# NBFC Futsal Manager

NBFC Futsal Manager est une application web moderne et interactive conçue pour aider les coachs du Noyal Brécé FC à gérer leurs tactiques, leurs équipes et leurs matchs de futsal. Elle offre une plateforme centralisée pour la planification stratégique, la communication avec les joueurs et le suivi des matchs en temps réel.

Construite avec une approche "mobile-first", l'application garantit une expérience fluide que ce soit sur un ordinateur de bureau ou sur le terrain depuis un téléphone portable.

## Fonctionnalités Principales

-   **Tableau Tactique Interactif** : Un terrain de futsal SVG où les coachs peuvent glisser-déposer des pions pour positionner les joueurs et définir des stratégies.
-   **Gestion de Composition** : Sélectionnez les joueurs pour le match, organisez les titulaires et les remplaçants.
-   **Suivi de Match en Direct** : Un tableau de marque complet avec score, chronomètre (temps arrêté ou continu), gestion des fautes et des périodes.
-   **Synchronisation en Temps Réel** : Toutes les modifications (positions des joueurs, score, etc.) sont synchronisées instantanément sur tous les appareils connectés grâce à Supabase Realtime.
-   **Notifications Push** : Tenez les joueurs et les supporters informés des convocations de match et des mises à jour de score via des notifications web push.
-   **Gestion des Matchs** : Planifiez les matchs à venir en définissant l'adversaire, la date, l'heure et le lieu.
-   **Accès par Rôle** : Les coachs disposent de pleins pouvoirs d'édition, tandis que les joueurs et les visiteurs ont un accès en lecture seule.

## Stack Technique

-   **Framework** : Next.js (App Router)
-   **Librairie UI** : React & TypeScript
-   **Style** : Tailwind CSS & ShadCN UI
-   **Backend & Base de Données** : Supabase (Auth, Dabatase, Realtime)
-   **Notifications** : `next-pwa` & `web-push`
-   **Logique Backend** : Genkit pour orchestrer les flux de notifications.
