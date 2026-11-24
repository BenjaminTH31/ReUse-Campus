
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html'
})
export class Registro {
  private authService = inject(AuthService);
  private router = inject(Router);

  nombre = '';
  correo = '';
  password = '';
  error = '';
  mensaje = '';
  cargando = false;

  registrar(): void {
    this.error = '';
    this.mensaje = '';
    this.cargando = true;

    this.authService.registrar({
      nombre: this.nombre,
      correo: this.correo,
      password: this.password
    }).subscribe({
      next: (respuesta) => {
        this.mensaje = respuesta.mensaje;
        this.cargando = false;

        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'No se pudo completar el registro.';
        this.cargando = false;
      }
    });
  }
}
