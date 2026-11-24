import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Solicitud {
  id: number;
  publicacionId: number;
  solicitanteId: number;
  mensaje: string;
  fechaSolicitud: string;
  estado: string;
  solicitante?: string;
  titulo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  private apiUrl = 'http://localhost:3000/api/solicitudes';

  constructor(private http: HttpClient) {}

  crearSolicitud(datos: {
    publicacionId: number;
    mensaje: string;
  }): Observable<any> {
    return this.http.post(this.apiUrl, datos);
  }

  obtenerMisSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(
      `${this.apiUrl}/mis-solicitudes`
    );
  }

  obtenerSolicitudesPorPublicacion(
    publicacionId: number
  ): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(
      `${this.apiUrl}/publicacion/${publicacionId}`
    );
  }

  aceptarSolicitud(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/aceptar`, {});
  }

  rechazarSolicitud(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/rechazar`, {});
  }

  cancelarSolicitud(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/cancelar`, {});
  }
}