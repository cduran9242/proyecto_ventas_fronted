import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService, LoginCredentials, LoginResponse, Rol, RolModulo, Usuario } from './api.service';

export interface SessionData {
  usuario: Usuario;
  rol: Rol;
  modulos: RolModulo[];
}

const SESSION_STORAGE_KEY = 'erp-session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<SessionData | null>(null);
  readonly session$ = this.sessionSubject.asObservable();
  private readonly esBrowser: boolean;

  constructor(
    private apiService: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.esBrowser = isPlatformBrowser(platformId);
    const sesion = this.recuperarSesion();
    if (sesion) {
      this.sessionSubject.next(sesion);
    }
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.apiService.login(credentials).pipe(
      tap(response => {
        const session: SessionData = {
          usuario: response.usuario,
          rol: response.rol,
          modulos: response.modulos ?? []
        };
        this.guardarSesion(session);
        this.sessionSubject.next(session);
      })
    );
  }

  logout(): void {
    if (this.esBrowser) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    this.sessionSubject.next(null);
    this.router.navigate(['/login']);
  }

  getSession(): SessionData | null {
    return this.sessionSubject.getValue();
  }

  isAuthenticated(): boolean {
    return !!this.sessionSubject.getValue();
  }

  private guardarSesion(session: SessionData): void {
    if (!this.esBrowser) {
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private recuperarSesion(): SessionData | null {
    if (!this.esBrowser) {
      return null;
    }
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        return null;
      }
      return JSON.parse(stored) as SessionData;
    } catch (error) {
      console.warn('No se pudo restaurar la sesión', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }
}

