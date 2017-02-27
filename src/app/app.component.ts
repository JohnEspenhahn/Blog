import { Component, OnInit, ViewChild, ViewContainerRef, ReflectiveInjector, ComponentFactoryResolver } from '@angular/core';
import { MarkdownWrapperComponent } from './markdown-wrapper/markdown-wrapper.component';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  entryComponents: [MarkdownWrapperComponent]
})
export class AppComponent implements OnInit {
  currentComponent = null;
  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer: ViewContainerRef;

  componentSubscription = null;
  posts: Observable<any[]>;

  constructor(private http: Http, private resolver: ComponentFactoryResolver) { }

  ngOnInit() {
    this.posts = this.http.get('assets/markdown/db.json').map((value: Response) => {
      return value.json().posts;
    });
  }

  open(file: string) {
    let resolvedInputs = ReflectiveInjector.resolve([]);
    let injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.modalContainer.parentInjector);
    let factory = this.resolver.resolveComponentFactory(MarkdownWrapperComponent);

    let component = factory.create(injector);
    component.instance.file = file;
    this.componentSubscription = component.instance.onClose.subscribe(() => {
      this.closeModal();
    });
    
    // We insert the component into the dom container
    this.modalContainer.insert(component.hostView);
    
    // We can destroy the old component is we like by calling destroy
    if (this.currentComponent) {
      this.currentComponent.destroy();
    }
    
    this.currentComponent = component;
  }

  closeModal() {
    this.modalContainer.clear();

    if (this.componentSubscription) {
      this.componentSubscription.unsubscribe();
    }

    if (this.currentComponent) {
      this.currentComponent.instance.close();
      this.currentComponent.destroy();
      this.currentComponent = null;
    }
  }
}
