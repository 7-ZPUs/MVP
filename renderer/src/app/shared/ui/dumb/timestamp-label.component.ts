// timestamp-label.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timestamp-label',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timestamp-label.html',
})
export class TimestampLabelComponent {
  /** ISO-8601 string oppure Date */
  @Input({ required: true }) timestamp!: string | Date;

  get isoValue(): string {
    return new Date(this.timestamp).toISOString();
  }

  /** GG/MM/AAAA HH:MM:SS come da specifica UC-5 */
  get displayValue(): string {
    const d = new Date(this.timestamp);
    const pad = (n: number) => String(n).padStart(2, '0');
    return [
      pad(d.getDate()),
      pad(d.getMonth() + 1),
      d.getFullYear()
    ].join('/') + ' ' + [
      pad(d.getHours()),
      pad(d.getMinutes()),
      pad(d.getSeconds())
    ].join(':');
  }
}