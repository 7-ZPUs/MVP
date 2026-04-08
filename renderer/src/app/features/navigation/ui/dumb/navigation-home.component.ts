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
  styleUrl: './navigation-home.component.scss',
})
export class NavigationHomeComponent {}