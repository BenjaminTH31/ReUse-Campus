import { Routes } from '@angular/router';

import { Inicio } from './pages/inicio/inicio';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Publicaciones } from './pages/publicaciones/publicaciones';
import { MisSolicitudes } from './pages/mis-solicitudes/mis-solicitudes';
import { Entregas } from './pages/entregas/entregas';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'publicaciones', component: Publicaciones },
  { path: 'mis-solicitudes', component: MisSolicitudes },
  { path: 'entregas', component: Entregas },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: '**', redirectTo: '' }
];