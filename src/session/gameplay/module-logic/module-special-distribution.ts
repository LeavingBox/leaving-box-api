import { ModuleEntity } from 'src/game/modules/module.schema';
import { applyBrailleDistribution } from './braille/braille-solution-distribution';
import { SolutionWithIndex } from 'src/session/utils/solutions-distribution';

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

type ModuleSpecialDistributionHandler = (
  module: ModuleEntity,
  recipientIds: string[],
  result: DistributionResultShape,
) => boolean;

const MODULE_SPECIAL_DISTRIBUTION_HANDLERS: ModuleSpecialDistributionHandler[] =
  [applyBrailleDistribution];

export const applyModuleSpecialDistribution = (
  module: ModuleEntity,
  recipientIds: string[],
  result: DistributionResultShape,
): boolean =>
  MODULE_SPECIAL_DISTRIBUTION_HANDLERS.some((handler) =>
    handler(module, recipientIds, result),
  );
