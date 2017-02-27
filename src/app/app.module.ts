import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { MarkdownModule } from 'angular2-markdown';
import { MaterializeModule } from 'angular2-materialize';

import { AppComponent } from './app.component';

import { MarkdownService } from './markdown.service';
import { MarkdownWrapperComponent } from './markdown-wrapper/markdown-wrapper.component';

@NgModule({
  declarations: [
    AppComponent,
    MarkdownWrapperComponent    
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,

    MaterializeModule,
    MarkdownModule.forRoot()
  ],
  providers: [ MarkdownService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
