import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, ViewChild, ViewContainerRef, ReflectiveInjector, ComponentFactoryResolver } from '@angular/core';
import { MarkdownWrapperComponent } from '../markdown-wrapper/markdown-wrapper.component';
import { ActivatedRoute } from '@angular/router';
import { Http, Response } from '@angular/http';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  entryComponents: [MarkdownWrapperComponent]
})
export class HomeComponent implements OnInit, AfterViewInit {
  currentComponent = null;
  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer: ViewContainerRef;

  routesInit: boolean;
  routersSubscription: Subscription;
  posts: Observable<any[]>;

  constructor(private route: ActivatedRoute, private http: Http, private resolver: ComponentFactoryResolver) { }

  ngOnInit() {
    this.posts = this.http.get('assets/markdown/db.json').map((value: Response) => {
      return value.json().posts;
    });
  }

  ngAfterViewInit() {
    if (!this.routersSubscription) {
      this.routesInit = false;
      this.routersSubscription = this.route.params.subscribe((params: { [key: string]: any }) => this.checkRoutes(params));
    }
  }

  checkRoutes(params: { [key: string]: any }) {
    var post_name = params['name'];
    if (post_name == 'home') this.closeModal();
    else if (post_name) this.open(post_name);
    this.routesInit = true;
  }

  ngOnDestroy() {
    if (this.routersSubscription)
      this.routersSubscription.unsubscribe();
  }

  open(file: string) {
    let factory = this.resolver.resolveComponentFactory(MarkdownWrapperComponent);
    let component = this.modalContainer.createComponent(factory);
    component.instance.file = file;

    // If opening via route navigation directly, skip transition
    if (!this.routesInit) {
      component.instance.open(true);
    }
    
    // We can destroy the old component is we like by calling destroy
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }
    
    this.currentComponent = component;
  }

  closeModal() {
    this.modalContainer.clear();

    if (this.currentComponent) {
      this.currentComponent.instance.close();
      this.currentComponent.destroy();
      this.currentComponent = null;
    }
  }
}
