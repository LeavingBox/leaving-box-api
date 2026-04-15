# Modes de Jeu et Difficultés

## Vue d'ensemble

Le système de gameplay a été découplé en plusieurs composants modulaires pour gérer les difficultés et les modes de jeu de manière flexible.

## Difficultés

Les difficultés déterminent le temps maximum alloué à une session :

- **Easy** : 1200 secondes (20 minutes)
- **Medium** : 900 secondes (15 minutes)
- **Hard** : 600 secondes (10 minutes)

La configuration est centralisée dans `src/session/gameplay/config/difficulty.config.ts`.

## Modes de Jeu

### 1. ONE_OPERATOR_ONE_MODULE (Par défaut)

**Description** : Affiche tous les modules disponibles et envoie chaque module à tous les opérateurs avec toutes les solutions.

**Comportement** :
- **Quel que soit le nombre d'opérateurs (2, 3, 4+)** : Tous les modules sont sélectionnés
- **Quel que soit le nombre d'opérateurs (2, 3, 4+)** : Chaque opérateur reçoit toutes les solutions de chaque module

**Exemples** :

**4 modules, 3 opérateurs** :
- Module 1 → Opérateur 1, 2, 3 (toutes les solutions)
- Module 2 → Opérateur 1, 2, 3 (toutes les solutions)
- Module 3 → Opérateur 1, 2, 3 (toutes les solutions)
- Module 4 → Opérateur 1, 2, 3 (toutes les solutions)

### 2. RANDOM_ONE_MODULE_SPLIT

**Description** : Tous les modules sont sélectionnés de manière aléatoire, mais leurs solutions sont réparties en round-robin entre tous les opérateurs.

**Comportement** :
- Les solutions de chaque module sont réparties en round-robin entre les opérateurs
- Chaque opérateur reçoit une partie des solutions de chaque module
- Sélection de module comme pour le mode 1

**Exemple** :
- 3 opérateurs → tous les modules sélectionnés, solutions réparties en round-robin entre les 3 opérateurs

## Architecture

### Structure des fichiers

```
src/session/gameplay/
├── types/
│   └── gameplay.types.ts          # Types TypeScript (GameDifficulty, GameMode, etc.)
├── config/
│   └── difficulty.config.ts       # Configuration des difficultés
├── strategies/
│   ├── module-selection.strategy.ts      # Stratégies de sélection de modules
│   └── solution-distribution.strategy.ts # Stratégies de distribution de solutions
└── gameplay.service.ts           # Service principal qui orchestre tout
```

### Pattern Strategy

Le système utilise le pattern Strategy pour permettre l'ajout facile de nouveaux modes de jeu :

1. **ModuleSelectionStrategy** : Détermine quels modules sont sélectionnés
2. **SolutionDistributionStrategy** : Détermine comment les solutions sont réparties

Pour ajouter un nouveau mode :
1. Créer une nouvelle classe qui implémente `ModuleSelectionStrategy`
2. Créer une nouvelle classe qui implémente `SolutionDistributionStrategy`
3. Ajouter le nouveau mode dans `gameplay.types.ts`
4. Mettre à jour les factories dans les fichiers de stratégies

## Utilisation

### Création d'une session

```typescript
socket.emit('createSession', {
  difficulty: 'Medium',
  gameMode: 'ONE_OPERATOR_ONE_MODULE', // ou 'RANDOM_ONE_MODULE_SPLIT'
  role: 'agent'
});
```

### Valeurs par défaut

- Si `gameMode` n'est pas fourni lors de la création : `ONE_OPERATOR_ONE_MODULE`
- Pour les anciennes sessions sans `gameMode` : migration automatique vers `ONE_OPERATOR_ONE_MODULE`

## Migration

Les sessions existantes sont automatiquement migrées :
- Si `difficulty` manque → `Medium`
- Si `gameMode` manque → `ONE_OPERATOR_ONE_MODULE`

La migration se fait lors de la lecture de la session (`getSession`).
