import { Component } from '@angular/core';
import { TripPlannerComponent } from './trip-planner/trip-planner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TripPlannerComponent],
  template: `<app-trip-planner></app-trip-planner>`
})
export class AppComponent {}
