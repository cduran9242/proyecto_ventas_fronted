import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interfaces para Departamentos y Ciudades
export interface Departamento {
  id: number;
  nombre: string;
  codigo?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Ciudad {
  id: number;
  nombre: string;
  departamento_id: number;
  departamento_nombre?: string;
  codigo?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UbicacionesService {
  // URL base de la API de ubicaciones (puede ser diferente a la API principal)
  private baseUrl = 'http://localhost:3000'; // Cambia esto por la URL de tu API de ubicaciones
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  constructor(private http: HttpClient) {}

  // ========== DEPARTAMENTOS ==========
  
  /**
   * Obtiene todos los departamentos
   */
  getDepartamentos(): Observable<Departamento[]> {
    return this.http
      .get<{ resultado: Departamento[] } | Departamento[]>(`${this.baseUrl}/api/departamentos/getDepartamentos`)
      .pipe(
        map(response => {
          // Maneja diferentes formatos de respuesta
          if (Array.isArray(response)) {
            return response;
          }
          // Si viene como objeto con resultado
          if ((response as any)?.resultado) {
            return (response as any).resultado;
          }
          // Si viene como objeto con data
          if ((response as any)?.data) {
            return (response as any).data;
          }
          return [];
        })
      );
  }

  /**
   * Obtiene un departamento por ID
   */
  getDepartamento(id: number): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.baseUrl}/api/departamentos/getDepartamentoById/${id}`);
  }

  // ========== CIUDADES ==========
  /**
   * Obtiene todas las ciudades
   */
  getCiudades(): Observable<Ciudad[]> {
    return this.http
      .get<{ resultado: Ciudad[] } | Ciudad[]>(`${this.baseUrl}/api/ciudades/getCiudades`)
      .pipe(
        map(response => {
          // Maneja diferentes formatos de respuesta
          if (Array.isArray(response)) {
            return response;
          }
          // Si viene como objeto con resultado
          if ((response as any)?.resultado) {
            return (response as any).resultado;
          }
          // Si viene como objeto con data
          if ((response as any)?.data) {
            return (response as any).data;
          }
          return [];
        })
      );
  }

  /**
   * Obtiene una ciudad por ID
   */
  getCiudad(id: number): Observable<Ciudad> {
    return this.http.get<Ciudad>(`${this.baseUrl}/api/ciudades/getCiudadById/${id}`);
  }

  /**
   * Obtiene ciudades por departamento
   */
  getCiudadesPorDepartamento(departamentoId: number): Observable<Ciudad[]> {
    return this.http
      .get<{ resultado: Ciudad[] } | Ciudad[]>(`${this.baseUrl}/api/ciudades/getCiudadesByDepartamento/${departamentoId}`)
      .pipe(
        map(response => {
          // Maneja diferentes formatos de respuesta
          if (Array.isArray(response)) {
            return response;
          }
          // Si viene como objeto con resultado
          if ((response as any)?.resultado) {
            return (response as any).resultado;
          }
          // Si viene como objeto con data
          if ((response as any)?.data) {
            return (response as any).data;
          }
          return [];
        })
      );
  }

  /**
   * Obtiene solo los departamentos activos (filtra por estado)
   * Si no hay campo estado, devuelve todos los departamentos
   */
  getDepartamentosActivos(): Observable<Departamento[]> {
    return this.getDepartamentos().pipe(
      map(departamentos => {
        // Si los departamentos no tienen campo estado, devolver todos
        const tieneEstado = departamentos.some(dept => dept.estado !== undefined);
        if (!tieneEstado) {
          return departamentos;
        }
        // Si tienen estado, filtrar solo los activos
        return departamentos.filter(dept => !dept.estado || dept.estado === 'Activo');
      })
    );
  }

  /**
   * Obtiene ciudades activas por departamento (filtra por estado)
   */
  getCiudadesActivasPorDepartamento(departamentoId: number): Observable<Ciudad[]> {
    return this.getCiudadesPorDepartamento(departamentoId).pipe(
      map(ciudades => ciudades.filter(ciudad => !ciudad.estado || ciudad.estado === 'Activo'))
    );
  }


  // ========== UTILIDADES ==========

  /**
   * Configura la URL base de la API (útil para cambiar entre entornos)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Obtiene la URL base actual
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

