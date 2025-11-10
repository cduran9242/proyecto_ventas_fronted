import { Component, inject } from '@angular/core';
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

  get session(): SessionData | null {
    return this.authService.getSession();
  }

  logout(): void {
    this.authService.logout();
  }
}
