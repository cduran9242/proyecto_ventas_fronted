import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService, SessionData } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  menuAbierto = false;

  get session(): SessionData | null {
    return this.authService.getSession();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  cambiarContrasena(): void {
    this.menuAbierto = false;
  }

  logout(): void {
    this.menuAbierto = false;
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuAbierto = false;
    }
  }
}
