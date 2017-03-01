import { Component, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MarkdownService } from '../markdown.service';
import { MaterializeAction } from 'angular2-materialize';

declare var $: any;

@Component({
  selector: 'app-markdown-wrapper',
  templateUrl: './markdown-wrapper.component.html',
  styleUrls: ['./markdown-wrapper.component.css']
})
export class MarkdownWrapperComponent implements AfterViewInit {
  readonly inDuration = 300;
  readonly outDuration = 200;

  @Input()
  file: string;

  data = "";
  isOpen: boolean;
  forceOpen: boolean;
  modalActions = new EventEmitter<string|MaterializeAction>();

  @ViewChild('markdown_modal') modal: ElementRef;

  constructor(private router: Router, private markdownService: MarkdownService) { }

  ngAfterViewInit() {
    this.markdownService.load(this.file + '.md').subscribe((data: string) => {
      this.data = data;
    });
    // $(this.modal.nativeElement).modal('open');
    this.open();
  }

  public open(force: boolean = false) {
    this.isOpen = true;
    
    if (force) this.forceOpen = true;
    else this.modalActions.emit({action:"modal",params:['open']});
  }

  public close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.modalActions.emit({action:"modal",params:['close']});

    setTimeout(() => {
      this.router.navigate(['/posts', 'home' ]);
    }, this.outDuration);
  }

}
