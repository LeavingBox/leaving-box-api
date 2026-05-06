# Guide Front Integration (Socket.IO)

Ce document est la reference front pour integrer l'API temps reel.
Il decrit les evenements Socket.IO, les payloads, les contraintes metier et le flow recommande.

## Connexion

- Transport: Socket.IO (`websocket`, fallback `polling`)
- URL dev typique: `http://localhost:3000`
- CORS cote backend: ouvert (`origin: *`)

Exemple de connexion front:

```ts
import { io } from 'socket.io-client';

export const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});
```

## Roles metier

- `agent`
  - cree la session
  - lance la partie
  - lance/arrete le timer
  - demande les indices supplementaires
- `analyste`
  - rejoint la session
  - recoit les infos de jeu et alertes

## Objets principaux

- `Session`
  - `code`: code de session
  - `players`: liste joueurs connectes
  - `started`: partie lancee
  - `timerStarted`: timer actif
  - `remainingTime`: temps restant
  - `difficulty`: `Easy | Medium | Hard`
  - `gameMode`: `ONE_OPERATOR_ONE_MODULE | RANDOM_ONE_MODULE_SPLIT`
  - `extraHintsUsed`: nombre global d'indices deja consommes
  - `moduleHintsState`: map `{ [moduleId]: hintsConsommes }`
  - `activeModuleIds`: modules actifs de la manche

## Client -> Serveur (events a emettre)

### `createSession` (agent uniquement)

Payload:

```ts
{
  difficulty: 'Easy' | 'Medium' | 'Hard';
  gameMode?: 'ONE_OPERATOR_ONE_MODULE' | 'RANDOM_ONE_MODULE_SPLIT';
  role: 'agent' | 'analyste';
}
```

Comportement:
- refuse si `role !== agent`
- cree la session et emet `sessionCreated` au socket agent

### `joinSession`

Payload:

```ts
{
  sessionCode: string;
  player: string; // non utilise cote metier pour l'id, garde pour compat front
}
```

Comportement:
- ajoute l'analyste dans la session
- room join automatique
- emet `playerJoined` a la room
- si limite analystes atteinte, emet `joinSessionRejected` et `sessionFull` au joueur refuse

### `getSession`

Payload:

```ts
{
  sessionCode: string;
  currentPath?: string; // optionnel, utile pour tracking navigation analyste
}
```

Comportement:
- renvoie `currentSession` si le socket est deja dans la room
- retour d'ack `{ success: boolean, message? }`

### `leaveSession`

Payload:

```ts
{
  sessionCode: string;
  player: string;
}
```

Comportement:
- retire le joueur
- emet `playerLeft` a la room
- peut fermer la session selon les regles metier

### `startGame` (agent uniquement)

Payload:

```ts
{ sessionCode: string }
```

Comportement:
- lance la partie
- calcule la distribution des solutions
- initialise `activeModuleIds`
- emet `gameStarted`

### `startTimer` / `stopTimer` (agent uniquement)

Payload:

```ts
{ sessionCode: string }
```

Comportement:
- `startTimer`: demarre le decompte
- `stopTimer`: stoppe le timer et remet le restant a 0

### `getExtraHintContext` (agent uniquement)

Payload:

```ts
{ sessionCode: string }
```

Comportement:
- calcule le cout du prochain indice selon la difficulte
- renvoie la liste des modules actifs + etat des indices par module
- emet `extraHintContext` au socket agent

### `requestExtraHint` (agent uniquement)

Payload:

```ts
{
  sessionCode: string;
  moduleId: string; // module cible (obligatoire)
  hintIndex?: number; // 1-based, optionnel
}
```

Comportement:
- verifie que la partie et le timer sont actifs
- verifie que le module est actif dans la session
- prend `hints[]` si dispo sinon fallback `solutions[]`
- applique cout temps progressif selon difficulte
- met a jour:
  - `remainingTime`
  - `extraHintsUsed`
  - `moduleHintsState[moduleId]`
- emet:
  - `timerUpdate` (room)
  - `extraHintGranted` (room)
  - `extraHintAlert` (analystes seulement)
- si temps <= 0: emet `gameOver`

## Serveur -> Client (events a ecouter)

### Session / Joueurs

- `sessionCreated` -> `Session`
- `currentSession` -> `{ sessionCode, sessionData, connectedClients }`
- `playerJoined` -> `{ playerId, playerLabel, playerRole, session }`
- `playerLeft` -> `{ playerId, session }`
- `joinSessionRejected` -> details de refus
- `sessionFull` -> details de refus
- `sessionCleared` -> `{ sessionCode }`

### Jeu / Timer

- `gameStarted` -> `{ session, moduleManuals, solutionsDistribution, solutionsByAnalyste }`
- `timerUpdate` -> `{ remaining }`
- `timerStopped` -> `{ sessionCode }`
- `gameOver` -> `{ message, sessionCode, difficulty, gameResult }`

### Indices

- `extraHintContext`:

```ts
{
  sessionCode: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  extraHintsUsed: number;
  maxHintsForDifficulty: number;
  nextHintNumber: number;
  nextHintCostSeconds: number;
  moduleHintsState: Record<string, number>;
  availableModules: Array<{
    moduleId: string;
    moduleNumber: number; // affichage UI 1..N
    moduleName: string;
    hintsUsed: number;
    totalHints: number;
    hintsRemaining: number;
  }>;
}
```

- `extraHintGranted` (agent + room):

```ts
{
  sessionCode: string;
  moduleId: string;
  moduleNumber: number | null;
  moduleName: string;
  message: string;
  hintIndex: number;
  hintText: unknown;
  hintsUsedForModule: number;
  totalHintsInModule: number;
  hintNumber: number;
  maxHintsForDifficulty: number;
  timeCostSeconds: number;
  remainingTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  extraHintsUsed: number;
  requestedBy: string;
  timestamp: Date;
}
```

- `extraHintAlert` (analystes uniquement):
  - meme structure que `extraHintGranted`
  - `message` deja pret pour affichage

## Regles de cout des indices

Configurees dans `src/session/gameplay/config/difficulty.config.ts`.

- Easy: `maxHints=6`, couts `5, 10, 15...`
- Medium: `maxHints=4`, couts `10, 20, 30...`
- Hard: `maxHints=3`, couts `15, 30, 45...`

Formule:

`cout = baseCostSeconds + (hintNumber - 1) * incrementalCostSeconds`

## Regles module special (Braille)

- Le module `Braille` a une logique de distribution dediee.
- En `RANDOM_ONE_MODULE_SPLIT`, Braille n'est pas decoupe en round-robin.
- La solution riche de Braille est envoyee en entier a tous les analystes.

Fichiers:
- `src/session/gameplay/module-logic/module-special-distribution.ts`
- `src/session/gameplay/module-logic/braille/braille-solution-distribution.ts`

## Flow front recommande (agent)

1. `createSession`
2. attendre analystes (`playerJoined`)
3. `startGame`
4. `startTimer`
5. pour indice:
   - `getExtraHintContext`
   - choix module
   - `requestExtraHint`
   - refresh UI via `extraHintGranted` + `timerUpdate`

## Checklist UI cote front

- desactiver boutons agent selon role + etat session
- afficher erreurs d'ack (`success: false, message`)
- utiliser `moduleNumber` uniquement pour affichage
- utiliser `moduleId` pour les requetes
- mettre a jour timer uniquement via `timerUpdate`
- gerer `gameOver` globalement (modal / redirect / verrouillage actions)

