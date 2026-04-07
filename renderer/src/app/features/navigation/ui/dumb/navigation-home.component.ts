import { Component } from '@angular/core';

@Component({
  selector: 'app-navigation-home',
  standalone: true,
  template: `
    <section class="browse-home" aria-live="polite" role="region" aria-label="Introduzione alla pagina Esplora">
      <p class="eyebrow">Esplora</p>
      <h2>Lavora sul DiP partendo dall albero di navigazione</h2>
      <p class="lead">
        Apri una classe documentale, un processo o un documento per visualizzare subito dettagli,
        verifica e relazioni nel pannello a destra.
      </p>

      <div class="feature-grid">
        <article class="feature-card">
          <h3>Classi documentali</h3>
          <p>Nome, stato della verifica, marcatura temporale e processi associati.</p>
        </article>
        <article class="feature-card">
          <h3>Processi</h3>
          <p>UUID, verifica, marcatura temporale e documenti associati.</p>
        </article>
      </div>

      <p class="hint">Per una ricerca puntuale usa il pulsante Ricerca nella toolbar.</p>
    </section>
  `,
  styles: [
    `
      .browse-home {
        margin: 24px;
        padding: 24px;
        border: 1px solid var(--f-border, #cbd5e1);
        border-radius: var(--f-radius, 6px);
        background: linear-gradient(135deg, var(--f-surface, #ffffff) 0%, #f8fbff 100%);
        color: var(--f-text-main, #1e293b);
        max-width: 900px;
      }

      .eyebrow {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        font-size: 0.78rem;
        color: #1d4ed8;
      }

      .browse-home h2 {
        margin: 0;
        font-size: 1.25rem;
        line-height: 1.3;
      }

      .lead {
        margin: 12px 0 0;
        color: var(--f-text-main, #1e293b);
      }

      .feature-grid {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .feature-card {
        border: 1px solid var(--f-border-light, #e2e8f0);
        border-radius: var(--f-radius, 6px);
        padding: 12px;
        background: rgba(255, 255, 255, 0.85);
      }

      .feature-card h3 {
        margin: 0;
        font-size: 0.95rem;
        color: var(--f-text-main, #1e293b);
      }

      .feature-card p {
        margin: 6px 0 0;
        color: var(--f-text-muted, #64748b);
        font-size: 0.9rem;
      }

      .browse-home .hint {
        margin: 16px 0 0;
        color: var(--f-text-muted, #64748b);
        font-size: 0.9rem;
      }

      @media (max-width: 900px) {
        .browse-home {
          margin: 16px;
          padding: 18px;
        }

        .feature-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class NavigationHomeComponent {}