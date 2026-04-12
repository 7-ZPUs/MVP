import { ISearchResult } from "../../../../../../shared/domain/metadata/search-result.models";

export interface ISearchResultItemComponent {
  result: ISearchResult;
  onSelectAction: (res: ISearchResult) => void;
}