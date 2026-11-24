import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  SolicitudesService,
  Solicitud
} from '../../services/solicitudes.service';

@Component({
  selector: 'app-mis-solicitudes',
  imports: [DatePipe],
  templateUrl: './mis-solicitudes.html',
  styles: [`
    .contenedor { max-width: 1000px; margin: 40px auto; padding: 0 20px; }
    .tarjeta { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 15px 0; }
    .boton { background: #b91c1c; color: white; border: 0; border-radius: 7px; padding: 10px 15px; cursor: pointer; }
    .mensaje { padding: 12px; background: #ecfdf5; color: #166534; border-radius: 7px; }
    .error { padding: 12px; background: #fef2f2; color: #b91c1c; border-radius: 7px; }
  `]
})
export class MisSolicitudes implements OnInit {
  private solicitudesService = inject(SolicitudesService);
  private cdr = inject(ChangeDetectorRef);

  solicitudes: Solicitud[] = [];
  cargando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

    cargarSolicitudes(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.solicitudesService.obtenerMisSolicitudes().subscribe({
      next: datos => {
        this.solicitudes = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = err.error?.mensaje ||
          'No se pudieron cargar tus solicitudes.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelar(id: number): void {
    if (!confirm('¿Quieres cancelar esta solicitud?')) return;

    this.solicitudesService.cancelarSolicitud(id).subscribe({
      next: respuesta => {
        this.mensaje = respuesta?.mensaje ||
          'Solicitud cancelada correctamente.';
        this.cargarSolicitudes();
      },
      error: err => {
        this.error = err.error?.mensaje ||
          'No se pudo cancelar la solicitud.';
      }
    });
  }
}