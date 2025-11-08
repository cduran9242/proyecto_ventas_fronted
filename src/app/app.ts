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
    const isLoginRoute = (url?: string | null): boolean => {
      if (!url) {
        return false;
      }

      const normalizedUrl = url.split('?')[0]?.split('#')[0] ?? url;
      return normalizedUrl === '/login' || normalizedUrl === '/' || normalizedUrl === '';
    };

    // Escuchar cambios en la ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isLoginPage = isLoginRoute(event.urlAfterRedirects ?? event.url);
      });
    
    // Verificar ruta inicial
    this.isLoginPage = isLoginRoute(this.router.url);
  }
}
