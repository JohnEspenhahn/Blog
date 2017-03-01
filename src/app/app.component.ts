import { Component, OnInit, ViewChild, ViewContainerRef, ReflectiveInjector, ComponentFactoryResolver } from '@angular/core';
import { MarkdownWrapperComponent } from './markdown-wrapper/markdown-wrapper.component';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  ngOnInit() {

  }

}
