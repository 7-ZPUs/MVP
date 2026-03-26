export interface ILiveAnnouncer {
  announce(message: string, politeness?: 'assertive' | 'polite'): void;
}
