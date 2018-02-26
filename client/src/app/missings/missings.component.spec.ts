import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MissingsComponent } from './missings.component';

describe('MissingsComponent', () => {
  let component: MissingsComponent;
  let fixture: ComponentFixture<MissingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MissingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MissingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
