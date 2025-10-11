import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Not } from './not';

describe('Not', () => {
  let component: Not;
  let fixture: ComponentFixture<Not>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Not]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Not);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
