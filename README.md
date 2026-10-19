# RedPower

Simulateur de campagnes **Reddit Ads**, conçu pour s'étendre aux autres plateformes (Meta, TikTok, LinkedIn, X).

Tapez le nom d'une entreprise → RedPower fait une recherche web en temps réel et en tire une fiche prête pour le media planning. Décrivez ensuite un besoin → vous obtenez des campagnes complètes et leur simulation de performance.

## Fonctionnalités

| Onglet | Ce que ça fait |
|---|---|
| 🔎 **Intelligence** | Ce que représente l'entreprise, CA et effectifs estimés, **budget marketing potentiel** et budget Reddit recommandé, **objectifs actuels** déduits des signaux récents (actualités, recrutements, levées), concurrents, **keywords** classés par intention, **meilleurs subreddits** (taille vérifiée via l'API Reddit, pertinence, ton à adopter, risque de rejet), **Reddit Fit Score**, idées immédiates et sources. |
| ✨ **Studio campagne** | À partir d'un besoin libre : 3 concepts contrastés (objectif Reddit, étape du funnel, ciblage communautés / intérêts / keywords), 3 annonces par concept avec **aperçu dans le feed**, répartition du budget, test A/B, activation communautaire, **réponses prêtes aux commentaires**, banque de headlines, checklist de lancement, export Markdown. |
| 📈 **Simulateur** | Impressions, reach, fréquence, clics, conversions, CPM/CPC/CPA, ROAS, avec fourchette pessimiste / optimiste. Modèle : benchmarks par objectif et secteur, reach à rendements décroissants, fatigue créative, phase d'apprentissage. Répartition par communauté, recommandations automatiques et **comparateur multi-plateformes**. |
| 🧪 **Headline Lab** | « Reddit Vibe Check » : score d'authenticité en direct (jargon, clickbait, majuscules, spécificité, ton humain…), variantes en un clic, exemples avant / après. |

Avant de taper le nom, on choisit le **type de client : annonceur direct ou agence**. L'analyse produit alors un **brief d'appel** (Prep → Discovery → Tailoring & next steps) qui répond aux 6 questions de préparation propres à chaque type, avec un statut (répondu, partiel, à vérifier), l'endroit où vérifier (Salesforce, site, LinkedIn…), un champ de notes par question, la stratégie à pitcher, les hypothèses à confirmer, les questions de discovery et les next steps. Pour une agence, la fiche est lue du point de vue de l'agence (services, clients et verticales, agences concurrentes).

Un **parcours guidé** (Analyser → Campagnes → Simuler) relie les outils, mais chacun reste accessible seul, y compris le Headline Lab. La fiche s'ouvre sur un résumé **« En bref »** (3 constats et l'action n°1), et chaque donnée porte un **badge de fiabilité** (Vérifié, Source web, Claude, Estimation, Démo).

Réglages : **le modèle Claude** de l'analyse (Haiku 5.5 par défaut) et celui des campagnes (Sonnet 5.5 par défaut), modifiables séparément parmi Opus 5.5, Fable 5.1, Sonnet 5.5 et Haiku 5.5, et **les pays visés** (jusqu'à 5). Les objectifs, idées, résumé, budget et communautés de la fiche sont alors orientés vers ces marchés, et chaque pays a son encart : perception, notoriété, différences avec le reste du monde, concurrents et subreddits locaux, objectifs propres, score d'opportunité et budget conseillé. Avec plusieurs pays, un comparatif indique le marché le plus prometteur. Les pays préremplissent le marché du Studio.

Les éléments sont reliés entre eux : cocher des subreddits alimente le simulateur, cliquer un objectif ou une idée crée un brief, et « Simuler ce concept » transfère objectif, budget et ciblage dans le simulateur.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseignez ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Sans clé API, l'app tourne en **mode démo** : données simulées mais déterministes, clairement étiquetées. Avec une clé, l'analyse utilise le modèle Claude choisi dans l'interface (défaut du serveur modifiable via `REDPOWER_MODEL`) avec l'outil de recherche web côté serveur, puis une sortie structurée validée par Zod.

## Version claude.ai (artifact)

`npm run build:artifact` produit `dist/redpower-artifact.html`, une page autonome publiable comme artifact sur claude.ai. Elle n'a pas besoin de serveur ni de clé API (environ 150 Ko, zod n'y est pas embarqué : les JSON Schemas sont calculés au build) : l'analyse et les campagnes passent par Claude sur le compte de la personne qui ouvre la page (capacité `sample`), à partir des connaissances du modèle, **sans recherche web en temps réel**. Si Claude n'est pas disponible ou que l'accès est refusé, la page bascule en mode démo.

## Architecture

```
src/
  app/api/company     Recherche web + structuration → fiche entreprise (streaming NDJSON)
  app/api/campaign    Brief → plan de campagne structuré
  app/api/subreddits  Recherche de subreddits (API publique Reddit)
  lib/transport.ts    Accès aux données : serveur Next.js ou artifact claude.ai
  lib/prompts.ts      Consignes partagées entre les deux versions
  artifact/           Point d'entrée et transport de la version artifact
  lib/claude.ts       Appels Claude : recherche (web_search, gestion pause_turn), sortie structurée, fallback serveur
  lib/schemas.ts      Schémas Zod partagés (fiche, concepts, annonces)
  lib/platforms/      Registre des plateformes et benchmarks (ajouter une plateforme = une entrée)
  lib/simulator.ts    Moteur de simulation (pur, testable, côté client)
  lib/headlineScore.ts Vibe check des headlines
  lib/demo.ts         Générateur du mode démo
  components/         UI (Next.js App Router, React 19, Tailwind 4)
```

### Ajouter une plateforme

1. Compléter son entrée dans `src/lib/platforms/index.ts` (benchmarks déjà présents pour Meta, TikTok, LinkedIn, X) et passer `status` à `"live"`.
2. Adapter les prompts de `lib/claude.ts` (règles créatives propres à la plateforme) et l'aperçu d'annonce.

## Limites

Les chiffres de budget d'une entreprise sont des **estimations** (rarement publics) ; la fiche indique un niveau de confiance. Les benchmarks du simulateur sont des moyennes de marché indicatives : ils servent à dimensionner et comparer, pas à garantir une performance.
