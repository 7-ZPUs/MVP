import { AggregateFilterValues } from './search-aggregate-filters-models';
import { CommonFilterValues } from './search-common-filters-models';
import { CustomFilterValues } from './search-custom-filters-models';
import { DiDaiFilterValues } from './search-diDai-filters-models';

export interface PartialSearchFilters {
  common: CommonFilterValues;
  diDai: DiDaiFilterValues;
  aggregate: AggregateFilterValues;
  customMeta: CustomFilterValues | null;
}
