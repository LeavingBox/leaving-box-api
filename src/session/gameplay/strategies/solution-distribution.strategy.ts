import { ModuleEntity } from 'src/game/modules/module.schema';
import {
  SolutionsDistribution,
  SolutionsByAnalyste,
  SolutionWithIndex,
  getModuleId,
  toSolutionsWithIndex,
} from 'src/session/utils/solutions-distribution';
import { applyModuleSpecialDistribution } from '../module-logic/module-special-distribution';
import { GameMode } from '../types/gameplay.types';

export type DistributionResult = {
  solutionsDistribution: SolutionsDistribution[];
  solutionsByAnalyste: SolutionsByAnalyste;
};

export interface SolutionDistributionStrategy {
  distribute(
    modules: ModuleEntity[],
    recipientIds: string[],
  ): DistributionResult;
}

const initResult = (recipientIds: string[]): DistributionResult => ({
  solutionsDistribution: [],
  solutionsByAnalyste: Object.fromEntries(
    recipientIds.map((id) => [id, []]),
  ) as SolutionsByAnalyste,
});

const assignModuleToAll = (
  module: ModuleEntity,
  recipientIds: string[],
  result: DistributionResult,
): void => {
  const moduleId = getModuleId(module);
  const solutions = toSolutionsWithIndex(module.solutions ?? []);
  const allocations = Object.fromEntries(
    recipientIds.map((id) => [id, [...solutions]]),
  ) as Record<string, SolutionWithIndex[]>;

  result.solutionsDistribution.push({ moduleId, allocations });
  recipientIds.forEach((id) => {
    result.solutionsByAnalyste[id].push({
      moduleId,
      solutions: [...solutions],
    });
  });
};

/** Mode standard: chaque analyste reçoit tous les modules avec toutes les solutions. */
export class OneOperatorOneModuleDistributionStrategy implements SolutionDistributionStrategy {
  distribute(
    modules: ModuleEntity[],
    recipientIds: string[],
  ): DistributionResult {
    const result = initResult(recipientIds);
    if (modules.length === 0) return result;

    modules.forEach((module) =>
      assignModuleToAll(module, recipientIds, result),
    );
    return result;
  }
}

/** Solutions réparties en round-robin entre analystes */
export class RandomOneModuleSplitDistributionStrategy implements SolutionDistributionStrategy {
  distribute(
    modules: ModuleEntity[],
    recipientIds: string[],
  ): DistributionResult {
    const result = initResult(recipientIds);
    if (modules.length === 0) return result;

    modules.forEach((module) => {
      const steps = module.solutions ?? [];
      const allocations: Record<string, SolutionWithIndex[]> = {};

      recipientIds.forEach((id) => (allocations[id] = []));

      if (applyModuleSpecialDistribution(module, recipientIds, result)) return;

      const moduleId = getModuleId(module);
      steps.forEach((step, idx) => {
        const target = recipientIds[idx % recipientIds.length];
        allocations[target].push({ index: idx + 1, text: step });
      });

      result.solutionsDistribution.push({ moduleId, allocations });
      Object.entries(allocations).forEach(([id, sols]) => {
        if (sols.length > 0) {
          result.solutionsByAnalyste[id].push({ moduleId, solutions: sols });
        }
      });
    });
    return result;
  }
}

export const createSolutionDistributionStrategy = (
  gameMode: GameMode,
): SolutionDistributionStrategy => {
  switch (gameMode) {
    case 'RANDOM_ONE_MODULE_SPLIT':
      return new RandomOneModuleSplitDistributionStrategy();
    case 'ONE_OPERATOR_ONE_MODULE':
    default:
      return new OneOperatorOneModuleDistributionStrategy();
  }
};
