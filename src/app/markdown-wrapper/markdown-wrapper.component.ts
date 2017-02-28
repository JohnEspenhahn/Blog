import { Component, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { MarkdownService } from '../markdown.service';
import { MaterializeAction } from 'angular2-materialize';

@Component({
  selector: 'app-markdown-wrapper',
  templateUrl: './markdown-wrapper.component.html',
  styleUrls: ['./markdown-wrapper.component.css']
})
export class MarkdownWrapperComponent implements AfterViewInit {
  inDuration = 300;
  outDuration = 200;

  @Input()
  file: string;

  data = "";
  open = true;
  modalActions = new EventEmitter<string|MaterializeAction>();

  @Output()
  onClose = new EventEmitter();

  constructor(private markdownService: MarkdownService) { }

  ngAfterViewInit() {
    this.markdownService.load(this.file).subscribe((data: string) => {
      this.data = data;
    });
    this.modalActions.emit({action:"modal",params:['open']});
  }

  public close() {
    if (!this.open) return;

    this.open = false;
    this.modalActions.emit({action:"modal",params:['close']});

    setTimeout(() => this.onClose.emit(), this.outDuration);
  }

}
