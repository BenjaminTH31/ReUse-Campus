import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  PublicacionesService,
  Publicacion,
  PublicacionDatos
} from '../../services/publicaciones.service';

import {
  SolicitudesService,
  Solicitud
} from '../../services/solicitudes.service';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-publicaciones',
  imports: [FormsModule],
  templateUrl: './publicaciones.html',
  styles: [`
    .catalogo { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
    .encabezado { margin-bottom: 25px; }
    .formulario, .tarjeta, .panel { background: white; padding: 22px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
    .formulario input, .formulario textarea, .formulario select, .panel textarea { width: 100%; padding: 11px; margin: 7px 0 15px; border: 1px solid #d1d5db; border-radius: 7px; box-sizing: border-box; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 18px; }
    .tarjeta h2 { color: #16834a; }
    .boton { border: 0; border-radius: 7px; padding: 10px 15px; margin: 5px 5px 5px 0; cursor: pointer; background: #16834a; color: white; }
    .secundario { background: #475569; }
    .peligro { background: #b91c1c; }
    .mensaje { padding: 12px; background: #ecfdf5; color: #166534; border-radius: 7px; margin: 12px 0; }
    .error { padding: 12px; background: #fef2f2; color: #b91c1c; border-radius: 7px; margin: 12px 0; }
    .acciones { margin-top: 15px; }
  `]
})
export class Publicaciones implements OnInit {
  private publicacionesService = inject(PublicacionesService);
  private solicitudesService = inject(SolicitudesService);
  authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  publicaciones: Publicacion[] = [];
  solicitudesRecibidas: Solicitud[] = [];

  cargando = false;
  error = '';
  mensaje = '';
  cargandoSolicitudes = false;
  enviandoSolicitud = false;

  mostrarFormulario = false;
  editandoId: number | null = null;

  publicacionSeleccionada: Publicacion | null = null;
  mensajeSolicitud = '';

  formulario: PublicacionDatos = this.formularioVacio();

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  formularioVacio(): PublicacionDatos {
    return {
      titulo: '',
      descripcion: '',
      categoria: '',
      modalidad: ''
    };
  }

  get usuarioActual() {
    return this.authService.usuarioActual;
  }

  esPropietario(publicacion: Publicacion): boolean {
    return !!this.usuarioActual &&
      publicacion.usuarioId === this.usuarioActual.id;
  }

    cargarPublicaciones(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.publicacionesService.obtenerPublicaciones().subscribe({
      next: datos => {
        this.publicaciones = datos;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar las publicaciones.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirFormulario(): void {
    this.formulario = this.formularioVacio();
    this.editandoId = null;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  editar(publicacion: Publicacion): void {
    this.formulario = {
      titulo: publicacion.titulo,
      descripcion: publicacion.descripcion,
      categoria: publicacion.categoria,
      modalidad: publicacion.modalidad
    };

    this.editandoId = publicacion.id;
    this.mostrarFormulario = true;
    this.error = '';
    this.mensaje = '';
  }

  guardarPublicacion(): void {
    this.error = '';
    this.mensaje = '';

    const operacion = this.editandoId
      ? this.publicacionesService.editarPublicacion(
          this.editandoId,
          this.formulario
        )
      : this.publicacionesService.crearPublicacion(this.formulario);

    operacion.subscribe({
      next: respuesta => {
        this.mensaje = respuesta?.mensaje ||
          'La publicación se guardó correctamente.';
        this.mostrarFormulario = false;
        this.cargarPublicaciones();
      },
      error: err => {
        this.error = err.error?.mensaje ||
          'No se pudo guardar la publicación.';
      }
    });
  }

  cancelarPublicacion(publicacion: Publicacion): void {
    if (!confirm(`¿Quieres cancelar "${publicacion.titulo}"?`)) {
      return;
    }

    this.publicacionesService.cancelarPublicacion(publicacion.id)
      .subscribe({
        next: respuesta => {
          this.mensaje = respuesta?.mensaje ||
            'Publicación cancelada correctamente.';
          this.cargarPublicaciones();
        },
        error: err => {
          this.error = err.error?.mensaje ||
            'No se pudo cancelar la publicación.';
        }
      });
  }

  solicitar(publicacion: Publicacion): void {
    this.publicacionSeleccionada = publicacion;
    this.mensajeSolicitud = '';
    this.solicitudesRecibidas = [];
    this.error = '';
  }

    enviarSolicitud(): void {
    if (!this.publicacionSeleccionada || this.enviandoSolicitud) {
      return;
    }

    this.enviandoSolicitud = true;
    this.error = '';
    this.mensaje = '';
    this.cdr.detectChanges();

    this.solicitudesService.crearSolicitud({
      publicacionId: this.publicacionSeleccionada.id,
      mensaje: this.mensajeSolicitud
    }).subscribe({
      next: respuesta => {
        this.mensaje = respuesta?.mensaje ||
          'Solicitud enviada correctamente.';

        this.publicacionSeleccionada = null;
        this.mensajeSolicitud = '';
        this.enviandoSolicitud = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = err.error?.mensaje ||
          'No se pudo enviar la solicitud.';

        this.enviandoSolicitud = false;
        this.cdr.detectChanges();
      }
    });
  }

    verSolicitudes(publicacion: Publicacion): void {
    this.publicacionSeleccionada = publicacion;
    this.error = '';
    this.solicitudesRecibidas = [];
    this.cargandoSolicitudes = true;
    this.cdr.detectChanges();

    this.solicitudesService
      .obtenerSolicitudesPorPublicacion(publicacion.id)
      .subscribe({
        next: datos => {
          this.solicitudesRecibidas = datos;
          this.cargandoSolicitudes = false;
          this.cdr.detectChanges();
        },
        error: err => {
          this.error = err.error?.mensaje ||
            'No se pudieron cargar las solicitudes.';
          this.cargandoSolicitudes = false;
          this.cdr.detectChanges();
        }
      });
  }

  aceptar(id: number): void {
    this.solicitudesService.aceptarSolicitud(id).subscribe({
      next: respuesta => {
        this.mensaje = respuesta?.mensaje ||
          'Solicitud aceptada. Se creó la entrega.';
        this.publicacionSeleccionada = null;
        this.cargarPublicaciones();
      },
      error: err => {
        this.error = err.error?.mensaje ||
          'No se pudo aceptar la solicitud.';
      }
    });
  }

  rechazar(id: number): void {
    this.solicitudesService.rechazarSolicitud(id).subscribe({
      next: respuesta => {
        this.mensaje = respuesta?.mensaje ||
          'Solicitud rechazada.';
        if (this.publicacionSeleccionada) {
          this.verSolicitudes(this.publicacionSeleccionada);
        }
      },
      error: err => {
        this.error = err.error?.mensaje ||
          'No se pudo rechazar la solicitud.';
      }
    });
  }

  cerrarPanel(): void {
    this.publicacionSeleccionada = null;
    this.solicitudesRecibidas = [];
  }
}