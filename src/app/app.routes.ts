import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./trip-planner/trip-planner.component').then(m => m.TripPlannerComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/auth-login.component').then(m => m.AuthLoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
  }
];
