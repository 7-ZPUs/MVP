import { describe, it, expect } from 'vitest';
import { SearchBarRulesManager } from './search-bar-rules.manager';
import { SearchQueryType } from '../../../../../../../../shared/domain/metadata';

describe('SearchBarRulesManager', () => {
  describe('evaluate()', () => {
    it('should force semantic state and set activeType to FREE when isSemantic is true', () => {
      const requestedType = 'SOME_ARBITRARY_TYPE' as SearchQueryType;
    
      const result = SearchBarRulesManager.evaluate(true, requestedType);

      expect(result).toEqual({
        isSemanticForced: true,
        activeType: SearchQueryType.FREE,
      });
    });

    it('should NOT force semantic state and should retain the requestedType when isSemantic is false', () => {
      const requestedType = 'EXACT' as SearchQueryType;
      
      const result = SearchBarRulesManager.evaluate(false, requestedType);
      
      expect(result).toEqual({
        isSemanticForced: false,
        activeType: requestedType,
      });
    });
  });
});