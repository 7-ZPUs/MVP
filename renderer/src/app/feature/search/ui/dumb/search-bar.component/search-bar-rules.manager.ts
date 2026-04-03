import { SearchQueryType } from "../../../../../../../../shared/domain/metadata";


export interface SearchBarState {
    isSemanticForced: boolean;
    activeType: SearchQueryType;
}

export class SearchBarRulesManager {
    public static evaluate(isSemantic: boolean, requestedType: SearchQueryType): SearchBarState {
        if (isSemantic) {
            return {
                isSemanticForced: true,
                activeType: SearchQueryType.FREE,
            };
        }

        return {
            isSemanticForced: false,
            activeType: requestedType,
        }
       
    }
}