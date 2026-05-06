import { ModuleEntity } from 'src/game/modules/module.schema';
import {
  SolutionWithIndex,
  getModuleId,
  toSolutionsWithIndex,
} from 'src/session/utils/solutions-distribution';

type DistributionResultShape = {
  solutionsDistribution: Array<{
    moduleId: string;
    allocations: Record<string, SolutionWithIndex[]>;
  }>;
  solutionsByAnalyste: Record<
    string,
    Array<{ moduleId: string; solutions: SolutionWithIndex[] }>
  >;
};

export const isBrailleModule = (module: ModuleEntity): boolean =>
  module.name.trim().toLowerCase() === 'braille';

export const applyBrailleDistribution = (
  module: ModuleEntity,
  recipientIds: string[],
  result: DistributionResultShape,
): boolean => {
  if (!isBrailleModule(module)) return false;

  const moduleId = getModuleId(module);
  const brailleSolutions = toSolutionsWithIndex(module.solutions ?? []);
  const allocations = Object.fromEntries(
    recipientIds.map((id) => [id, [...brailleSolutions]]),
  ) as Record<string, SolutionWithIndex[]>;

  result.solutionsDistribution.push({ moduleId, allocations });
  recipientIds.forEach((id) => {
    result.solutionsByAnalyste[id].push({
      moduleId,
      solutions: [...brailleSolutions],
    });
  });

  return true;
};
