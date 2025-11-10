import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { MenuItemNode } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  cargando = false;
  mensajeError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/principal']);
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  ingresar(): void {
    this.mensajeError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const { email, password } = this.loginForm.value;

    this.authService
      .login({ email, password })
      .subscribe({
        next: (response) => {
          this.cargando = false;

          this.router.navigate(['/principal']);
        },
        error: (error) => {
          this.cargando = false;
          console.error('Error de autenticación:', error);
          if (error?.status === 401) {
            this.mensajeError = 'Credenciales inválidas. Verifica tu correo y contraseña.';
          } else {
            this.mensajeError = 'No fue posible iniciar sesión. Intenta nuevamente.';
          }
        }
      });
  }

  private buscarPrimeraRuta(_: MenuItemNode[]): string | null {
    return '/principal';
  }
}
