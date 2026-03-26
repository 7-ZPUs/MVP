import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { SearchQuery, SearchQueryType } from '../../../../../shared/domain/metadata';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
})
export class SearchBarComponent implements OnChanges, OnDestroy {
  @Input() query: SearchQuery | null = null;
  @Input() isSearching: boolean = false;

  @Output() queryChanged = new EventEmitter<SearchQuery>();

  public form: FormGroup;
  public QueryType = SearchQueryType;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      text: [''],
      type: [SearchQueryType.FREE],
      useSemantic: [false],
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.queryChanged.emit(value as SearchQuery);
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['query']?.currentValue) {
      this.form.patchValue(changes['query'].currentValue, { emitEvent: false });
    }

    if ('isSearching' in changes) {
      if (this.isSearching) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
