import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { MarkdownModule } from 'angular2-markdown';
import { MaterializeModule } from 'angular2-materialize';

import { AppComponent } from './app.component';

import { MarkdownWrapperComponent } from './markdown-wrapper/markdown-wrapper.component';
import { HomeComponent } from './home/home.component';

import { ModaltrackerService } from "./modaltracker.service";

const routes: Routes = [
  { path: 'posts/:name', component: HomeComponent },
  { path: '', redirectTo: '/posts/home', pathMatch: 'full' },
  { path: '**', redirectTo: 'posts/home' }
];

@NgModule({
  declarations: [
    AppComponent,
    MarkdownWrapperComponent,
    HomeComponent
  ],  
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, { useHash: true }),
    FormsModule,
    HttpModule,

    MaterializeModule,
    MarkdownModule.forRoot()
  ],
  providers: [
    ModaltrackerService
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
