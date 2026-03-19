import { TestBed } from '@angular/core/testing';
import { SearchFacade } from './search-facade';
import { ITelemetryService } from '../path/to/telemetry-service'; 

describe('SearchFacade', () => {
  let service: SearchFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SearchFacade,
        { provide: ITelemetryService, useValue: {} }
      ]
    });
    service = TestBed.inject(SearchFacade);
  });

  it('should handle errors and reset isSearching', () => {
    // Test implementation
  });

  it('should ignore calls if isSearching is true', () => {
    // Test implementation
  });

  it('should not call IPC if pre-validation fails', () => {
    // Test implementation
  });

  it('should reset loading flags and call abort()', () => {
    // Test implementation
  });

  it('should not execute if indexing is not READY', () => {
    // Test implementation
  });
});