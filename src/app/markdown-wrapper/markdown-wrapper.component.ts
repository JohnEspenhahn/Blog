import { Component, AfterViewInit, Input, EventEmitter } from '@angular/core';
import { MarkdownService } from '../markdown.service';
import { MaterializeAction } from 'angular2-materialize';

@Component({
  selector: 'app-markdown-wrapper',
  templateUrl: './markdown-wrapper.component.html',
  styleUrls: ['./markdown-wrapper.component.css']
})
export class MarkdownWrapperComponent implements AfterViewInit {

  @Input()
  file: string;
  data: string = "";

  modalActions = new EventEmitter<string|MaterializeAction>();

  constructor(private markdownService: MarkdownService) { }

  ngAfterViewInit() {
    this.markdownService.load(this.file).subscribe((data: string) => {
      this.data = data;
    });
    this.modalActions.emit({action:"modal",params:['open']});
  }

  public close() {
    this.modalActions.emit({action:"modal",params:['close']});
  }

}
