import { GameDifficulty, DifficultyConfig } from '../types/gameplay.types';

export const DIFFICULTY_CONFIGS: Record<GameDifficulty, DifficultyConfig> = {
  Easy: {
    maxTime: 1200, // 20 minutes
    label: 'Facile',
    extraHint: {
      maxHints: 6,
      baseCostSeconds: 5,
      incrementalCostSeconds: 5,
    },
  },
  Medium: {
    maxTime: 900, // 15 minutes
    label: 'Moyen',
    extraHint: {
      maxHints: 4,
      baseCostSeconds: 10,
      incrementalCostSeconds: 10,
    },
  },
  Hard: {
    maxTime: 600, // 10 minutes
    label: 'Difficile',
    extraHint: {
      maxHints: 3,
      baseCostSeconds: 15,
      incrementalCostSeconds: 15,
    },
  },
};

export const getDifficultyConfig = (
  difficulty: GameDifficulty,
): DifficultyConfig => {
  return DIFFICULTY_CONFIGS[difficulty];
};

export const getExtraHintCostForDifficulty = (
  difficulty: GameDifficulty,
  nextHintNumber: number,
): number => {
  const config = getDifficultyConfig(difficulty).extraHint;
  const normalizedHintNumber = Math.max(1, nextHintNumber);
  return (
    config.baseCostSeconds +
    (normalizedHintNumber - 1) * config.incrementalCostSeconds
  );
};
