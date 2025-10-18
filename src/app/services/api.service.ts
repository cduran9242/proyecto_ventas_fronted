import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces para tipado
export interface Usuario {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion?: string;
  rol: string;
  fechaNacimiento?: string;
  genero?: string;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoria: string;
  marca: string;
  codigo: string;
  fechaVencimiento?: string;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface Venta {
  id?: number;
  cliente: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  total: number;
  fecha: string;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface Rol {
  id?: number;
  nombre: string;
  descripcion?: string;
  permisos: string[];
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000'; // URL de tu FastAPI
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer ' + token // Para autenticación futura
  });

  constructor(private http: HttpClient) {}

  // ========== USUARIOS ==========
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuarios/`);
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/usuarios/${id}`);
  }

  crearUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/usuarios/`, usuario, { headers: this.headers });
  }

  actualizarUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/usuarios/${id}`, usuario, { headers: this.headers });
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/usuarios/${id}`);
  }

  // ========== PRODUCTOS ==========
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.baseUrl}/productos/`);
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/productos/${id}`);
  }

  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.baseUrl}/productos/`, producto, { headers: this.headers });
  }

  actualizarProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id}`, producto, { headers: this.headers });
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/productos/${id}`);
  }

  // ========== VENTAS ==========
  getVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.baseUrl}/ventas/`);
  }

  getVenta(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.baseUrl}/ventas/${id}`);
  }

  crearVenta(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(`${this.baseUrl}/ventas/`, venta, { headers: this.headers });
  }

  actualizarVenta(id: number, venta: Venta): Observable<Venta> {
    return this.http.put<Venta>(`${this.baseUrl}/ventas/${id}`, venta, { headers: this.headers });
  }

  eliminarVenta(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ventas/${id}`);
  }

  // ========== ROLES ==========
  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.baseUrl}/roles/`);
  }

  getRol(id: number): Observable<Rol> {
    return this.http.get<Rol>(`${this.baseUrl}/roles/${id}`);
  }

  crearRol(rol: Rol): Observable<Rol> {
    return this.http.post<Rol>(`${this.baseUrl}/roles/`, rol, { headers: this.headers });
  }

  actualizarRol(id: number, rol: Rol): Observable<Rol> {
    return this.http.put<Rol>(`${this.baseUrl}/roles/${id}`, rol, { headers: this.headers });
  }

  eliminarRol(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/roles/${id}`);
  }

  // ========== REPORTES ==========
  getReportes(filtros?: any): Observable<any[]> {
    let url = `${this.baseUrl}/reportes/`;
    if (filtros) {
      const params = new URLSearchParams(filtros).toString();
      url += `?${params}`;
    }
    return this.http.get<any[]>(url);
  }

  // ========== AUTENTICACIÓN (Para implementar en el futuro) ==========
  login(credenciales: { usuario: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, credenciales, { headers: this.headers });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, { headers: this.headers });
  }

  // ========== UTILIDADES ==========
  private handleError(error: any): Observable<never> {
    console.error('Error en API:', error);
    throw error;
  }
}
