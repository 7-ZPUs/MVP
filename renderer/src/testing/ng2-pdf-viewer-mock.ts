import { Component, NgModule, Input } from '@angular/core';

@Component({
  selector: 'pdf-viewer',
  template: '<div>Mock PDF Viewer</div>',
  standalone: false,
})
export class MockPdfViewerComponent {
  @Input() src: any;
  @Input() 'render-text': any;
  @Input() 'original-size': any;
  @Input() autoresize: any;
  @Input() 'show-all': any;
}

@NgModule({
  declarations: [MockPdfViewerComponent],
  exports: [MockPdfViewerComponent],
})
export class PdfViewerModule {}
