import mongoose, { Schema } from 'mongoose';

type SeedModule = {
  name: string;
  description: string;
  rules: string;
  imgUrl?: string;
  solutions: string[];
  hints: string[];
};

const seedModules: SeedModule[] = [
  {
    name: 'Simon Says',
    description:
      "Reproduire des séquences lumineuses et sonores qui s'allongent à chaque étape.",
    rules:
      'Observer la séquence complète, répéter sans erreur; la vitesse augmente à chaque étape.',
    imgUrl: '/manuals/module-simon.pdf',
    solutions: [
      'Numéro de série : chiffre au début, lettre à la fin',
      'Numéro de série : chiffre au début, chiffre à la fin',
      'Numéro de série : lettre au début, lettre à la fin',
      'Numéro de série : lettre au début, chiffre à la fin',
    ],
    hints: [
      'Appuyer sur un bouton pour lancer la première séquence.',
      'Règle 1 (chiffre→lettre) : Bleu→Jaune, Jaune→Rouge, Vert→Bleu, Rouge→Vert.',
      'Règle 2 (chiffre→chiffre) : Rouge→Jaune, Jaune→Bleu, Bleu→Vert, Vert→Rouge.',
      'Règle 3 (lettre→lettre) : Rouge↔Bleu, Jaune↔Vert.',
      'Règle 4 (lettre→chiffre) : identité, la couleur ne change pas.',
      "En cas d'erreur : strike déclenché, rejouer toute la séquence avec les traductions.",
    ],
  },
  {
    name: 'Wires',
    description:
      'Couper les bons fils selon une table de correspondance couleur/symbole.',
    rules:
      "Analyser la couleur, vérifier la position, couper les fils dans l'ordre prescrit par la table.",
    solutions: [
      'Position 1 : couleur Rouge',
      'Position 2 : couleur Bleu',
      'Position 3 : couleur Jaune',
    ],
    hints: [
      'Identifier le schéma de couleurs et les positions de chaque fil.',
      "Suivre la table couleur/position pour déterminer l'ordre de coupe.",
      "Couper uniquement dans l'ordre validé; une erreur déclenche un strike.",
    ],
  },
  {
    name: 'Memory Code',
    description:
      'Retenir un code à 4 chiffres affiché brièvement et le reproduire après délai.',
    rules:
      'Mémoriser le code, attendre le signal, entrer la séquence sans erreur.',
    solutions: [
      'Code affiché : 4 chiffres entre 0 et 9',
      'Signal de saisie : bip sonore',
    ],
    hints: [
      "Mémoriser le code dès l'affichage, ne pas attendre.",
      "Attendre le signal de saisie avant d'entrer le code.",
      'Saisir le code complet sans erreur pour valider.',
    ],
  },
  {
    name: 'Keypad',
    description:
      "Appuyer sur les symboles dans l'ordre indiqué par le manuel de référence.",
    rules:
      "Identifier les symboles, comparer à la table de référence, valider la séquence dans l'ordre indiqué.",
    solutions: [
      'Symbole 1 : colonne A du manuel',
      'Symbole 2 : colonne B du manuel',
      'Symbole 3 : colonne C du manuel',
      'Symbole 4 : colonne D du manuel',
    ],
    hints: [
      'Identifier chaque symbole affiché sur le module.',
      'Trouver la colonne du manuel qui contient tous les symboles affichés.',
      "Appuyer dans l'ordre exact défini par cette colonne (de haut en bas).",
    ],
  },
  {
    name: 'Morse Relay',
    description:
      'Traduire un signal Morse court en mot-clé pour déverrouiller le module.',
    rules:
      'Compter les points/traits du Morse, identifier les lettres, envoyer le mot-clé final.',
    solutions: [
      'Signal Morse : séquence de points et traits',
      'Mot-clé : 3 à 5 lettres à déduire',
    ],
    hints: [
      'Écouter/observer le Morse et segmenter les points (.) et traits (-).',
      "Traduire chaque lettre via l'alphabet Morse standard.",
      "Composer le mot-clé complet et l'envoyer pour valider.",
    ],
  },
  {
    name: 'Labyrinthe de Formes',
    description:
      'Aligner une séquence de 6 formes/couleurs en combinant le nombre de barrettes RAM, le numéro de série et des conditions supplémentaires.',
    rules:
      'Former une boucle de 6 formes : les 3 premières dépendent du nombre de barrettes RAM, les 3 dernières du dernier chiffre du numéro de série. Appliquer seulement la première condition supplémentaire vraie.',
    solutions: [
      "Bleu = Petite croix | Rouge = Etoile | Vert = Grosse Croix | Rose = Losange | Orange = Fleur | Jaune = Point d'interrogation",
      '1 barrette RAM → ROSE -> JAUNE -> FLEUR',
      '2 barrettes RAM → FLEUR -> LOSANGE -> JAUNE',
      '3 ou 4 barrettes RAM → ? -> ORANGE -> ROSE',
      'Dernier chiffre du numéro de série pair → VERT -> BLEU -> ETOILE',
      'Dernier chiffre du numéro de série impair → PETITE CROIX -> ROUGE -> VERT',
    ],
    hints: [
      'Chercher le nombre de barrettes RAM dans le boîtier pour déterminer les 3 premières formes.',
      'Regarder le dernier chiffre du numéro de série pour les 3 dernières formes (pair ou impair).',
      "Condition supplémentaire 1 : si le numéro de série commence par une lettre → inverser l'ordre des 3 dernières formes.",
      'Condition supplémentaire 2 : si le numéro de série se termine par 0 → remplacer la dernière forme par JAUNE.',
      'Condition supplémentaire 3 : si le numéro de série contient exactement 2 lettres → échanger la première et la dernière forme.',
      'Rappel : appliquer seulement la première condition supplémentaire vraie, pas les suivantes.',
    ],
  },
];

const moduleSchema = new Schema<SeedModule>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    rules: { type: String, required: true },
    imgUrl: { type: String, required: false },
    solutions: { type: [String], required: true },
    hints: { type: [String], required: false, default: [] },
  },
  { collection: 'moduleentities', timestamps: false },
);

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "DATABASE_URL manquant dans les variables d'environnement.",
    );
  }

  await mongoose.connect(uri);
  const ModuleModel = mongoose.model<SeedModule>('ModuleEntity', moduleSchema);

  for (const mod of seedModules) {
    await ModuleModel.updateOne(
      { name: mod.name },
      { $set: mod },
      { upsert: true },
    );
    console.log(`✔ Module prêt : ${mod.name}`);
  }

  await mongoose.disconnect();
  console.log('✅ Seed modules terminé.');
}

main().catch((err) => {
  console.error('❌ Seed échoué :', err);
  process.exit(1);
});
