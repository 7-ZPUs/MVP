import { Component } from '@angular/core';

@Component({
  selector: 'app-navigation-home',
  standalone: true,
  template: `
    <section class="browse-home" aria-live="polite">
      <h2>Esplora il DiP</h2>
      <p>Seleziona un processo o un documento dall'albero a sinistra per visualizzare i dettagli.</p>
      <p class="hint">La ricerca resta disponibile come pagina separata dal pulsante "Ricerca".</p>
    </section>
  `,
  styles: [
    `
      .browse-home {
        margin: 24px;
        padding: 20px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #ffffff;
        color: #0f172a;
        max-width: 760px;
      }

      .browse-home h2 {
        margin: 0 0 10px;
        font-size: 1.1rem;
      }

      .browse-home p {
        margin: 0 0 8px;
        color: #334155;
      }

      .browse-home .hint {
        margin-bottom: 0;
        color: #64748b;
      }
    `,
  ],
})
export class NavigationHomeComponent {}