import { Component, ViewChild, ViewContainerRef, ReflectiveInjector, ComponentFactoryResolver } from '@angular/core';
import { MarkdownWrapperComponent } from './markdown-wrapper/markdown-wrapper.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  entryComponents: [MarkdownWrapperComponent]
})
export class AppComponent {
  currentComponent = null;
  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer: ViewContainerRef;

  constructor(private resolver: ComponentFactoryResolver) { }

  open(file: string) {
    // Inputs need to be in the following format to be resolved properly
    let data = { inputs: { file: file }, component: MarkdownWrapperComponent };
    let inputProviders = Object.keys(data.inputs).map((inputName) => {return {provide: inputName, useValue: data.inputs[inputName]};});
    let resolvedInputs = ReflectiveInjector.resolve(inputProviders);
    
    // We create an injector out of the data we want to pass down and this components injector
    let injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.modalContainer.parentInjector);
    
    // We create a factory out of the component we want to create
    let factory = this.resolver.resolveComponentFactory(data.component);
    
    // We create the component using the factory and the injector
    let component = factory.create(injector);
    component.instance.file = file;
    
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
    if (this.currentComponent) {
      this.currentComponent.instance.close();
      this.currentComponent.destroy();
      this.currentComponent = null;
    }
  }
}
