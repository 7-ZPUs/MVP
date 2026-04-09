import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { ProcessMetadataComponent } from './process-metadata.component';
import { ProcessDetail } from '../../domain/process.models';

function makeDetail(overrides: Partial<ProcessDetail> = {}): ProcessDetail {
  return {
    processId: '31',
    processUuid: 'PROC-31',
    integrityStatus: 'VALID',
    metadata: {
      processId: '31',
      processUuid: 'PROC-31',
      integrityStatus: 'VALID',
      processStatus: 'TERMINATO',
      documentClassName: 'Classe Contratti',
      documentClassUuid: 'CLASS-UUID-22',
      documentClassTimestamp: '2026-04-08T10:30:00Z',
    },
    overview: {
      oggetto: 'Processo Contratti',
      procedimento: 'Gestione Contratti',
      materiaArgomentoStruttura: 'Contratti Pubblici',
    },
    submission: {
      processo: 'PROC-31',
      sessione: 'VERS-2026',
      dataInizio: '2026-04-08',
      dataFine: '2026-04-09',
      uuidAttivatore: 'ATT-VERS-123',
      uuidTerminatore: 'TERM-VERS-123',
      canaleAttivazione: 'PortaleWeb',
      canaleTerminazione: 'WebGui',
      stato: 'TERMINATA',
    },
    conservation: {
      processo: 'PRES-31',
      sessione: 'SESS-2026',
      dataInizio: '2026-04-08',
      dataFine: '2026-04-09',
      uuidAttivatore: 'ATT-CONS-123',
      uuidTerminatore: 'TERM-UUID-123',
      canaleAttivazione: 'ConservazioneBatch',
      canaleTerminazione: 'AUTOMATIC',
      stato: 'TERMINATA',
    },
    documentClass: {
      id: 22,
      name: 'Classe Contratti',
      uuid: 'CLASS-UUID-22',
      timestamp: '2026-04-08T10:30:00Z',
    },
    customMetadata: [
      {
        nome: 'Process.End.Date',
        valore: '2026-04-09',
      },
    ],
    indiceDocumenti: [],
    ...overrides,
  };
}

describe('ProcessMetadataComponent', () => {
  let fixture: ComponentFixture<ProcessMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessMetadataComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessMetadataComponent);
  });

  function render(detail: ProcessDetail): HTMLElement {
    fixture.componentRef.setInput('data', detail);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renderizza le sezioni principali con i test id previsti', () => {
    const el = render(makeDetail());

    expect(el.querySelector('[data-testid="process-metadata-card-anagrafica"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="process-metadata-card-overview"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="process-metadata-card-submission"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="process-metadata-card-conservation"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="process-metadata-card-custom"]')).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-heading-overview"]')?.textContent?.trim(),
    ).toBe('Contesto del Processo');

    expect(el.querySelector('[data-testid="process-metadata-row-process-id"]')?.textContent).toContain(
      '31',
    );
    expect(el.querySelector('[data-testid="process-metadata-row-process-status"]')?.textContent).toContain(
      'TERMINATO',
    );
    expect(
      el.querySelector('[data-testid="process-metadata-row-overview-oggetto"]')?.textContent,
    ).toContain('Processo Contratti');
  });

  it('mostra i campi opzionali di conservazione quando presenti', () => {
    const el = render(makeDetail());

    expect(el.querySelector('[data-testid="process-metadata-row-conservation-data-fine"]')).toBeTruthy();
    expect(
      el.querySelector('[data-testid="process-metadata-row-conservation-uuid-attivatore"]'),
    ).toBeTruthy();
    expect(
      el.querySelector('[data-testid="process-metadata-row-conservation-uuid-terminatore"]'),
    ).toBeTruthy();
    expect(
      el.querySelector('[data-testid="process-metadata-row-conservation-canale-attivazione"]'),
    ).toBeTruthy();
    expect(
      el.querySelector('[data-testid="process-metadata-row-conservation-canale-terminazione"]'),
    ).toBeTruthy();
    expect(el.querySelector('[data-testid="process-metadata-row-conservation-stato"]')).toBeTruthy();
  });

  it('mostra i campi opzionali di versamento quando presenti', () => {
    const el = render(makeDetail());

    expect(el.querySelector('[data-testid="process-metadata-row-submission-data-fine"]')).toBeTruthy();
    expect(
      el.querySelector('[data-testid="process-metadata-row-submission-uuid-attivatore"]'),
    ).toBeTruthy();
    expect(
      el.querySelector('[data-testid="process-metadata-row-submission-uuid-terminatore"]'),
    ).toBeTruthy();
    expect(
      el.querySelector('[data-testid="process-metadata-row-submission-canale-attivazione"]'),
    ).toBeTruthy();
    expect(
      el.querySelector('[data-testid="process-metadata-row-submission-canale-terminazione"]'),
    ).toBeTruthy();
    expect(el.querySelector('[data-testid="process-metadata-row-submission-stato"]')).toBeTruthy();
  });

  it('nasconde il contesto processo quando i campi sono tutti N/A', () => {
    const el = render(
      makeDetail({
        overview: {
          oggetto: 'N/A',
          procedimento: 'N/A',
          materiaArgomentoStruttura: 'N/A',
        },
      }),
    );

    expect(el.querySelector('[data-testid="process-metadata-card-overview"]')).toBeNull();
    expect(el.querySelector('[data-testid="process-metadata-overview-empty"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="optional-field-absent-message"]')?.textContent).toContain(
      'Nessun contesto del processo disponibile nei metadati',
    );
  });

  it('nasconde i campi opzionali di conservazione quando assenti', () => {
    const el = render(
      makeDetail({
        conservation: {
          processo: 'PRES-31',
          sessione: 'SESS-2026',
          dataInizio: '2026-04-08',
        },
      }),
    );

    expect(el.querySelector('[data-testid="process-metadata-row-conservation-data-fine"]')).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-row-conservation-uuid-attivatore"]'),
    ).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-row-conservation-uuid-terminatore"]'),
    ).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-row-conservation-canale-attivazione"]'),
    ).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-row-conservation-canale-terminazione"]'),
    ).toBeNull();
    expect(el.querySelector('[data-testid="process-metadata-row-conservation-stato"]')).toBeNull();
  });

  it('nasconde i campi opzionali di versamento quando assenti', () => {
    const el = render(
      makeDetail({
        submission: {
          processo: 'PROC-31',
          sessione: 'VERS-2026',
          dataInizio: '2026-04-08',
        },
      }),
    );

    expect(el.querySelector('[data-testid="process-metadata-row-submission-data-fine"]')).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-row-submission-uuid-attivatore"]'),
    ).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-row-submission-uuid-terminatore"]'),
    ).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-row-submission-canale-attivazione"]'),
    ).toBeNull();
    expect(
      el.querySelector('[data-testid="process-metadata-row-submission-canale-terminazione"]'),
    ).toBeNull();
    expect(el.querySelector('[data-testid="process-metadata-row-submission-stato"]')).toBeNull();
  });

  it('usa il fallback N/A per campi classe documentale non valorizzati', () => {
    const el = render(
      makeDetail({
        metadata: {
          processId: '31',
          processUuid: 'PROC-31',
          integrityStatus: 'VALID',
          documentClassName: 'N/A',
          documentClassUuid: 'N/A',
          documentClassTimestamp: 'N/A',
        },
        documentClass: {
          id: 22,
          name: 'N/A',
          uuid: 'N/A',
          timestamp: 'N/A',
        },
      }),
    );

    expect(
      el.querySelector('[data-testid="process-metadata-row-document-class-name"]')?.textContent,
    ).toContain('N/A');
    expect(
      el.querySelector('[data-testid="process-metadata-row-document-class-uuid"]')?.textContent,
    ).toContain('N/A');
    expect(
      el.querySelector('[data-testid="process-metadata-row-document-class-timestamp"]')?.textContent,
    ).toContain('N/A');
  });

  it('non visualizza la sezione metadati aggiuntivi anche se presenti', () => {
    const el = render(makeDetail());

    expect(el.querySelector('[data-testid="process-metadata-card-custom"]')).toBeNull();
    expect(el.querySelector('[data-testid="process-metadata-custom-empty"]')).toBeNull();
  });
});
