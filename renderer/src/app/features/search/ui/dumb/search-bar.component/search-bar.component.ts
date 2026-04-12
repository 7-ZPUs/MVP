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

import { SearchQuery, SearchQueryType } from '../../../../../../../../shared/domain/metadata';
import { SearchBarRulesManager } from './search-bar-rules.manager';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnChanges, OnDestroy {
  @Input() query: SearchQuery | null = null;
  @Input() isSearching: boolean = false;

  @Output() queryChanged = new EventEmitter<SearchQuery>();
  @Output() searchRequested = new EventEmitter<void>();

  public form: FormGroup;
  public QueryType = SearchQueryType;
  private readonly destroy$ = new Subject<void>();
  public isSemanticForced: boolean = false;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      text: [''],
      type: [SearchQueryType.FREE],
      useSemanticSearch: [false],
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      const ruleResult = SearchBarRulesManager.evaluate(value.useSemanticSearch, value.type);
      this.isSemanticForced = ruleResult.isSemanticForced;

      if (value.type !== ruleResult.activeType) {
        this.form.patchValue({ type: ruleResult.activeType }, { emitEvent: false });
        this.queryChanged.emit({ ...value, type: ruleResult.activeType });
      } else {
        this.queryChanged.emit(value as SearchQuery);
      }
    });
  }

  public onSubmit(): void {
    this.searchRequested.emit();
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
