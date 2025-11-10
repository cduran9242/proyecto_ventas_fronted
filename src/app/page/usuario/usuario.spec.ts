import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioPage } from './usuario';

describe('UsuarioPage', () => {
  let component: UsuarioPage;
  let fixture: ComponentFixture<UsuarioPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
