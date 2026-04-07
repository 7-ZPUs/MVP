import { IDocContextStrategy } from '../contracts/doc-context-strategy.interface';
import { DiContextStrategy } from './di-context.strategy';
import { DaiContextStrategy } from './dai-context.strategy';
import { AggContextStrategy } from './aggregate-context.strategy';
import { AllContextStrategy } from './all-context.strategy';
import { DocContext } from '@shared/domain/metadata/subject.enum';

export const DOC_CONTEXT_STRATEGY_REGISTRY: Record<DocContext, IDocContextStrategy> = {
  [DocContext.DI]: new DiContextStrategy(),
  [DocContext.DAI]: new DaiContextStrategy(),
  [DocContext.AGG]: new AggContextStrategy(),
  [DocContext.ALL]: new AllContextStrategy(),
};
