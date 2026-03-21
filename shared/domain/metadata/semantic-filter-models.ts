import { IndexingStatus } from './search.enum';

export interface SemanticIndexState {
  status: IndexingStatus;
  progressPercentage: number;
  lastIndexedAt: Date | null;
}
