import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-index',
  standalone: true,
  templateUrl: './index.html',
  styleUrl: './index.css'
})
export class IndexComponent {
  constructor(private router: Router) {}

  // Método para ir al login
  irAlLogin() {
    this.router.navigate(['/login']);
  }

  // Método para ir a la página principal
  irAPrincipal() {
    this.router.navigate(['/principal']);
  }
}
