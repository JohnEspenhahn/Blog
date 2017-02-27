import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownWrapperComponent } from './markdown-wrapper.component';

describe('MarkdownWrapperComponent', () => {
  let component: MarkdownWrapperComponent;
  let fixture: ComponentFixture<MarkdownWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkdownWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
