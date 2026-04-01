// verification-badge.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationStatus } from '../../domain/shared-types';

interface BadgeConfig {
  icon: string;           // SVG path o nome icona
  label: string;          // testo sempre visibile (WCAG 1.4.1: colore NON unico)
  ariaLabel: string;      // per screen reader (WCAG 4.1.2)
  cssClass: string;
}

const BADGE_CONFIG: Record<VerificationStatus, BadgeConfig> = {
  not_verified: {
    icon: 'help_outline',
    label: 'Non Verificato',
    ariaLabel: 'Stato verifica: Non Verificato',
    cssClass: 'badge--not-verified',
  },
  valid: {
    icon: 'check_circle_outline',
    label: 'Valido',
    ariaLabel: 'Stato verifica: Valido',
    cssClass: 'badge--valid',
  },
  invalid: {
    icon: 'error_outline',
    label: 'Non Valido',
    ariaLabel: 'Stato verifica: Non Valido',
    cssClass: 'badge--invalid',
  },
};

@Component({
  selector: 'app-verification-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verification-badge.html',
})
export class VerificationBadgeComponent {
  @Input({ required: true }) status!: VerificationStatus;

  get config(): BadgeConfig {
    return BADGE_CONFIG[this.status] ?? BADGE_CONFIG['not_verified'];
  }
}