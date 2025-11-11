import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

import {
  ApiService,
  FavoritoCreatePayload,
  FavoritoMenuItem,
  FavoritoUpdatePayload,
  LoginCredentials,
  LoginResponse,
  MenuItemNode,
  Rol,
  Usuario
} from './api.service';

export interface SessionData {
  usuario: Usuario;
  rol: Rol;
  menu: MenuItemNode[];
  favoritos: FavoritoMenuItem[];
}

const SESSION_STORAGE_KEY = 'erp-session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<SessionData | null>(null);
  readonly session$ = this.sessionSubject.asObservable();
  private readonly favoritosSubject = new BehaviorSubject<FavoritoMenuItem[]>([]);
  readonly favoritos$ = this.favoritosSubject.asObservable();
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
      this.establecerSesion(sesion, false);
    }
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.apiService.login(credentials).pipe(
      tap(response => {
        const menuTree = response.modulos ?? response.menu ?? [];
        const favoritos = response.favoritos ?? [];
        const session: SessionData = {
          usuario: response.usuario,
          rol: response.rol,
          menu: menuTree,
          favoritos
        };
        this.establecerSesion(session, true);
      })
    );
  }

  logout(): void {
    if (this.esBrowser) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    this.sessionSubject.next(null);
    this.favoritosSubject.next([]);
    this.permisosPorRuta.clear();
    this.router.navigate(['/login']);
  }

  getSession(): SessionData | null {
    return this.sessionSubject.getValue();
  }

  getFavoritos(): FavoritoMenuItem[] {
    return this.favoritosSubject.getValue();
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

  sincronizarFavoritosDesdeServidor(): Observable<FavoritoMenuItem[]> {
    const session = this.getSession();
    if (!session?.usuario?.id) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }
    const rolId = session.rol?.id;
    return this.apiService
      .getFavoritosUsuario(session.usuario.id, rolId)
      .pipe(tap(favoritos => this.actualizarFavoritosLocales(favoritos, true)));
  }

  agregarFavorito(
    menuItemId: number,
    alias?: string | null,
    orden?: number | null
  ): Observable<FavoritoMenuItem> {
    const session = this.getSession();
    if (!session?.usuario?.id) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }
    const payload: FavoritoCreatePayload = {
      menu_item_id: menuItemId,
      alias: alias ?? null,
      orden: orden ?? null
    };
    const rolId = session.rol?.id;
    return this.apiService
      .crearFavorito(session.usuario.id, payload, rolId)
      .pipe(
        tap(favorito => {
          const actualizados = [...this.getFavoritos(), favorito];
          this.actualizarFavoritosLocales(actualizados, true);
        })
      );
  }

  actualizarFavorito(
    favoritoId: number,
    cambios: FavoritoUpdatePayload
  ): Observable<FavoritoMenuItem> {
    const session = this.getSession();
    if (!session?.usuario?.id) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }
    const rolId = session.rol?.id;
    return this.apiService
      .actualizarFavorito(session.usuario.id, favoritoId, cambios, rolId)
      .pipe(
        tap(favoritoActualizado => {
          const actualizados = this.getFavoritos().map(f =>
            f.id === favoritoActualizado.id ? favoritoActualizado : f
          );
          this.actualizarFavoritosLocales(actualizados, true);
        })
      );
  }

  eliminarFavorito(favoritoId: number): Observable<{ mensaje: string }> {
    const session = this.getSession();
    if (!session?.usuario?.id) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }
    return this.apiService.eliminarFavorito(session.usuario.id, favoritoId).pipe(
      tap(() => {
        const restantes = this.getFavoritos().filter(f => f.id !== favoritoId);
        this.actualizarFavoritosLocales(restantes, true);
      })
    );
  }

  private establecerSesion(session: SessionData, persistir: boolean): void {
    this.sessionSubject.next(session);
    this.favoritosSubject.next(session.favoritos ?? []);
    if (persistir && this.esBrowser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    this.actualizarPermisos(session.menu ?? []);
  }

  private actualizarFavoritosLocales(favoritos: FavoritoMenuItem[], persistir: boolean): void {
    this.favoritosSubject.next(favoritos);
    const session = this.getSession();
    if (!session) {
      return;
    }
    const nuevaSesion: SessionData = {
      ...session,
      favoritos
    };
    this.sessionSubject.next(nuevaSesion);
    if (persistir && this.esBrowser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nuevaSesion));
    }
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
      const session = JSON.parse(stored) as SessionData;
      session.favoritos = session.favoritos ?? [];
      return session;
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

