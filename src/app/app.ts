import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { HeaderComponent } from './components/header/header';
import { MenuComponent } from './components/menu/menu';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, MenuComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isLoginPage = false;

  constructor(private router: Router) {
    // Escuchar cambios en la ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLoginPage = event.url === '/login' || event.urlAfterRedirects === '/login';
      });
    
    // Verificar ruta inicial
    this.isLoginPage = this.router.url === '/login';
  }
}
