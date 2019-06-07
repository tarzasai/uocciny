import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleParentComponent } from './title-parent.component';

describe('TitleParentComponent', () => {
  let component: TitleParentComponent;
  let fixture: ComponentFixture<TitleParentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TitleParentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TitleParentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
