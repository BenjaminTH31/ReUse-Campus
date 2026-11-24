
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Publicacion {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  modalidad: string;
  estado: string;
  fechaPublicacion: string;
  usuarioId: number;
  propietario: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private apiUrl = 'http://localhost:3000/api/publicaciones';

  constructor(private http: HttpClient) {}

  obtenerPublicaciones(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>(this.apiUrl);
  }
}
