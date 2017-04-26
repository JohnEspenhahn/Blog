import { Component, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MaterializeAction } from 'angular2-materialize';
import { ModaltrackerService } from "../modaltracker.service";

var window: any;

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

  isOpen: boolean;
  forceOpen: boolean;
  modalActions = new EventEmitter<string|MaterializeAction>();

  @ViewChild('markdown_modal') modal: ElementRef;

  constructor(private router: Router, private tracker: ModaltrackerService) { }

  ngAfterViewInit() {
    this.open();
  }

  public open(force: boolean = false) {
    this.isOpen = true;
    
    this.tracker.setOpen();
    if (force) this.forceOpen = true;
    else this.modalActions.emit({action:"modal",params:['open']});
  }

  public close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.tracker.setClosed();
    this.modalActions.emit({action:"modal",params:['close']});

    setTimeout(() => {
      this.router.navigate(['/posts', 'home' ]);
    }, this.outDuration);
  }

}
