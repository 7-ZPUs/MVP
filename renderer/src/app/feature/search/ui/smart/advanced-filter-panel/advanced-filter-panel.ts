import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  SearchFilters,
  ValidationResult,
  FilterValidatorFn,
  CommonFilterValues,
  DiDaiFilterValues,
  AggregateFilterValues,
  CustomFilterValues,
  SubjectCriteria,
  ValidationError,
  PartialSearchFilters,
  MetadataFilter,
} from '../../../../../../../../shared/domain/metadata';

import { CommonFiltersComponent } from '../../dumb/common-filters.component/common-filters.component';
import { DiDaiFiltersComponent } from '../../dumb/di-dai-filters.component/di-dai-filters.component';
import { AggregateFiltersComponent } from '../../dumb/aggregate-filters.component/aggregate-filters.component';
import { CustomMetaFiltersComponent } from '../../dumb/custom-meta-filters.component/custom-meta-filters.component';
import { SubjectFiltersComponent } from '../../dumb/subject-filters.component/subject-filters.component';

@Component({
  selector: 'app-advanced-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonFiltersComponent,
    DiDaiFiltersComponent,
    AggregateFiltersComponent,
    CustomMetaFiltersComponent,
    SubjectFiltersComponent,
  ],
  templateUrl: './advanced-filter-panel.html',
})
export class AdvancedFilterPanelComponent implements OnInit, OnChanges {
  @Input() validator?: FilterValidatorFn;
  @Input() externalValidation: ValidationResult | null = null;
  private _filters!: SearchFilters;
  @Input()
  set filters(value: SearchFilters) {
    this._filters = value;
    if (this.panelForm && value) {
      this.panelForm.patchValue({
         subject: value.subject,
         // Non possiamo ricaricare tutti i campi typed indietro da value.filters facilmente. 
         // Visto che questo componente di solito inizializza o resetta.
      }, { emitEvent: false });
    }
  }
  get filters(): SearchFilters {
    return this._filters;
  }

  @Output() filtersChanged = new EventEmitter<SearchFilters>();
  @Output() filtersSubmit = new EventEmitter<SearchFilters>();
  @Output() validationResult = new EventEmitter<ValidationResult>();
  // filterAdded e filterRemoved sembrano non usati nell'HTML, ma li lasciamo se servono altrove
  @Output() filterAdded = new EventEmitter<CustomFilterValues>();
  @Output() filterRemoved = new EventEmitter<string>();
  @Output() filtersReset = new EventEmitter<void>();

  public isExpanded: boolean = true;
  public currentValidationResult: ValidationResult | null = null;
  public subjectResetCounter: number = 0;

  public panelForm!: FormGroup;

  constructor(private readonly fb: FormBuilder) {}

  public ngOnInit(): void {
    this.panelForm = this.fb.group({
      common: [{}],
      diDai: [{}],
      aggregate: [{}],
      customMeta: [null],
      subject: [this.filters?.subject || null],
    });

    this.panelForm.valueChanges.subscribe((values) => {
      this.validateAndEmit(values);
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['externalValidation']?.currentValue?.isValid === false) {
      this.isExpanded = true;
    }
  }

  public get effectiveValidationResult(): ValidationResult | null {
    if (this.externalValidation?.isValid === false) {
      return this.externalValidation;
    }

    return this.currentValidationResult || this.externalValidation;
  }

  public onCommonFiltersChanged(values: CommonFilterValues): void {
    this.panelForm.patchValue({ common: values }, { emitEvent: true });
  }

  public onDiDaiFiltersChanged(values: DiDaiFilterValues): void {
    this.panelForm.patchValue({ diDai: values }, { emitEvent: true });
  }

  public onAggregateFiltersChanged(values: AggregateFilterValues): void {
    this.panelForm.patchValue({ aggregate: values }, { emitEvent: true });
  }

  public onEntriesChanged(entries: CustomFilterValues | null): void {
    this.panelForm.patchValue({ customMeta: entries }, { emitEvent: true });
  }

  public onSubjectChanged(subject: SubjectCriteria): void {
    const updatedFilters = { ...this.filters, subject };
    this.filtersChanged.emit(updatedFilters);
  }

  private flattenToMetadataFilters(formValues: any): MetadataFilter[] {
    const filters: MetadataFilter[] = [];
    const add = (key: string, value: any) => {
      if (value !== null && value !== undefined && value !== '') {
        filters.push({ key, value: String(value) });
      }
    };

    const c = formValues.common;
    if (c) {
      add("note", c.note);
      add("oggetto", c.chiaveDescrittiva?.oggetto);
      add("parole_chiave", c.chiaveDescrittiva?.paroleChiave);
      add("indice_di_classificazione", c.classificazione?.codice);
      add("descrizione", c.classificazione?.descrizione);
      add("tempo_di_conservazione", c.conservazione?.valore);
      if (c.tipoDocumento === "DOCUMENTO INFORMATICO") add("documento_informatico", "");
      if (c.tipoDocumento === "DOCUMENTO AMMINISTRATIVO INFORMATICO") add("documento_amministrativo_informatico", "");
      if (c.tipoDocumento === "AGGREGAZIONE DOCUMENTALE") add("aggregazione_documentale", "");
    }

    const d = formValues.diDai;
    if (d) {
      add("nome_del_documento", d.nome);
      add("versione_del_documento", d.versione);
      add("id_identificativo_documento_primario", d.idPrimario);
      add("tipologia_documentale", d.tipologia);
      add("modalita_di_formazione", d.modalitaFormazione);
      add("riservato", d.riservatezza);
      add("formato", d.identificativoFormato?.formato);
      add("nome_prodotto", d.identificativoFormato?.nomeProdottoCreazione);
      add("versione_prodotto", d.identificativoFormato?.versioneProdottoCreazione);
      add("produttore", d.identificativoFormato?.produttoreProdottoCreazione);
      add("firmato_digitalmente", d.verifica?.formatoDigitalmente);
      add("sigillato_elettronicamente", d.verifica?.sigillatoElettr);
      add("marcatura_temporale", d.verifica?.marcaturaTemporale);
      add("conformita_copie_immagine_su_supporto_informatico", d.verifica?.conformitaCopie);
      add("tipologia_di_flusso", d.registrazione?.tipologiaFlusso);
      add("tipo_registro", d.registrazione?.tipologiaRegistro);
      add("data_registrazione_documento", d.registrazione?.dataRegistrazione);
      add("numero_registrazione_documento", d.registrazione?.numeroRegistrazione);
      add("codice_registro", d.registrazione?.codiceRegistro);
    }

    const a = formValues.aggregate;
    if (a) {
      add("tipo_aggregazione", a.tipoAggregazione);
      add("id_aggregazione", a.idAggregazione);
      add("tipo_agg", a.tipoFascicolo);
      add("data_apertura", a.dataApertura);
      add("data_chiusura", a.dataChiusura);
      add("oggetto", a.procedimento?.materia);
      add("denominazione", a.procedimento?.denominazioneProcedimento);
      add("tipo_ruolo", a.assegnazione?.tipoAssegnazione);
      add("data_inizio_assegnazione", a.assegnazione?.dataInizioAssegn);
      add("data_fine_assegnazione", a.assegnazione?.dataFineAssegn);
    }

    if (formValues.customMeta) {
      add(formValues.customMeta.field, formValues.customMeta.value);
    }

    return filters;
  }

  public onFieldValidationError(field: string, error: ValidationError | null): void {
    // Riservato per logiche future
  }

  public togglePanel(): void {
    this.isExpanded = !this.isExpanded;
  }

  public onSubmit(): void {
    if (
      this.currentValidationResult?.isValid !== false &&
      this.externalValidation?.isValid !== false
    ) {
      const flatFilters = this.flattenToMetadataFilters(this.panelForm.value);
      const finalFilters: SearchFilters = {
        filters: flatFilters,
        subject: this.filters?.subject || null,
      };
      this.filtersSubmit.emit(finalFilters);
    }
  }

  public onReset(): void {
    this.panelForm.reset();
    this.subjectResetCounter++;
    this.currentValidationResult = null; // Resetta anche gli errori visivi
    this.filtersReset.emit();
  }

  private validateAndEmit(formValues: any): void {
    const partialSearchFilters: PartialSearchFilters = {
      common: formValues.common,
      diDai: formValues.diDai,
      aggregate: formValues.aggregate,
      customMeta: formValues.customMeta,
    };

    if (this.validator) {
      this.currentValidationResult = this.validator(partialSearchFilters);
      this.validationResult.emit(this.currentValidationResult);
    }

    const flatFilters = this.flattenToMetadataFilters(formValues);
    const fullFilters: SearchFilters = {
      filters: flatFilters,
      subject: this.filters?.subject || null,
    };
    this.filtersChanged.emit(fullFilters);
  }
}
