import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService, LoginCredentials, LoginResponse, MenuItemNode, Rol, Usuario } from './api.service';

export interface SessionData {
  usuario: Usuario;
  rol: Rol;
  menu: MenuItemNode[];
}

const SESSION_STORAGE_KEY = 'erp-session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<SessionData | null>(null);
  readonly session$ = this.sessionSubject.asObservable();
  private readonly esBrowser: boolean;
  private readonly permisosPorRuta = new Map<string, Set<string>>();
  private readonly rutasBase = new Set(['/principal', '/inicio']);

  constructor(
    private apiService: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.esBrowser = isPlatformBrowser(platformId);
    const sesion = this.recuperarSesion();
    if (sesion) {
      this.sessionSubject.next(sesion);
      this.actualizarPermisos(sesion.menu ?? []);
    }
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.apiService.login(credentials).pipe(
      tap(response => {
        const menuTree = response.modulos ?? response.menu ?? [];
        const session: SessionData = {
          usuario: response.usuario,
          rol: response.rol,
          menu: menuTree
        };
        this.guardarSesion(session);
        this.sessionSubject.next(session);
         this.actualizarPermisos(menuTree);
      })
    );
  }

  logout(): void {
    if (this.esBrowser) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    this.sessionSubject.next(null);
    this.permisosPorRuta.clear();
    this.router.navigate(['/login']);
  }

  getSession(): SessionData | null {
    return this.sessionSubject.getValue();
  }

  isAuthenticated(): boolean {
    return !!this.sessionSubject.getValue();
  }

  hasRole(nombreRol: string): boolean {
    const session = this.getSession();
    if (!session?.rol?.nombre) {
      return false;
    }
    return session.rol.nombre.toLowerCase().includes(nombreRol.toLowerCase());
  }

  hasPermission(ruta: string, permiso: 'ver' | 'crear' | 'editar' | 'eliminar'): boolean {
    const normalizada = this.normalizarRuta(ruta);
    if (this.rutasBase.has(normalizada)) {
      return permiso === 'ver';
    }
    const permisos = this.permisosPorRuta.get(normalizada);
    if (!permisos) {
      return false;
    }
    if (permiso === 'ver') {
      return permisos.has('ver') || permisos.size > 0;
    }
    return permisos.has(permiso);
  }

  getPermisosDeRuta(ruta: string): string[] {
    const normalizada = this.normalizarRuta(ruta);
    const permisos = this.permisosPorRuta.get(normalizada);
    return permisos ? Array.from(permisos.values()) : [];
  }

  private guardarSesion(session: SessionData): void {
    if (!this.esBrowser) {
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.actualizarPermisos(session.menu ?? []);
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

  private actualizarPermisos(menu: MenuItemNode[]): void {
    this.permisosPorRuta.clear();
    this.rutasBase.forEach(ruta => {
      this.permisosPorRuta.set(ruta, new Set(['ver']));
    });
    const recorrer = (items?: MenuItemNode[]) => {
      if (!items) {
        return;
      }
      items.forEach(item => {
        const ruta = item.ruta?.trim();
        if (ruta) {
          const normalizada = this.normalizarRuta(ruta);
          const permisos = this.permisosPorRuta.get(normalizada) ?? new Set<string>();
          const lista = item.permisos ?? [];
          if (lista.length === 0) {
            permisos.add('ver');
          } else {
            lista.forEach(p => permisos.add(p.toLowerCase()));
          }
          this.permisosPorRuta.set(normalizada, permisos);
        }
        if (item.hijos?.length) {
          recorrer(item.hijos);
        }
      });
    };
    recorrer(menu);
  }

  private normalizarRuta(ruta: string): string {
    if (!ruta) {
      return '';
    }
    const trimmed = ruta.trim();
    if (!trimmed) {
      return '';
    }
    return trimmed.startsWith('/') ? trimmed.toLowerCase() : `/${trimmed.toLowerCase()}`;
  }
}

