import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  usuario = '';
  password = '';

  constructor(private router: Router) {}

  // Método que se ejecutará al hacer clic en "Ingresar"
  // Por ahora solo redirige, sin validación
  ingresar() {
    // TODO: Implementar validación con FastAPI
    console.log('Usuario:', this.usuario, 'Password:', this.password);
    
    // Redirigir a la página principal
    this.router.navigate(['/inicio']);
  }
}
