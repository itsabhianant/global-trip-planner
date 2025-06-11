import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as L from 'leaflet';

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './trip-planner.component.html',
  styleUrls: ['./trip-planner.component.css']
})
export class TripPlannerComponent {
  cities: string[] = [''];
  coordinates: { [city: string]: L.LatLng } = {};
  route: string[] = [];
  map: L.Map | undefined;
  loading = false;
  error = '';

  constructor(private http: HttpClient) {}

  addCityField() {
    if (this.cities[this.cities.length - 1].trim() !== '') {
      this.cities.push('');
    } else {
      alert('Please enter a city name before adding another.');
    }
  }

  trackByIndex(index: number, item: string): number {
    return index;
  }

  async planTrip() {
    this.loading = true;
    this.error = '';
    this.route = [];
    this.coordinates = {};

    const coordsPromises = this.cities.map(city => this.getCoordinates(city.trim()));

    try {
      const resolved = await Promise.all(coordsPromises);

      resolved.forEach((coord, i) => {
        const name = this.cities[i].trim();
        if (coord && name.length > 0) {
          this.coordinates[name] = coord;
        } else {
          console.warn(`⚠️ Skipping invalid or empty city: "${this.cities[i]}"`);
        }
      });

      console.log('🧭 Coordinates:', this.coordinates);

      const validCityNames = Object.keys(this.coordinates);
      if (validCityNames.length < 2) {
        this.error = 'Please enter at least two valid cities.';
        console.error('❌ Not enough valid cities.');
        return;
      }

      this.route = this.solveTSP(validCityNames);
      console.log('📌 Final route:', this.route);

      if (this.route.length >= 2) {
        this.initMap(); // drawRoute is called after map init
      } else {
        this.error = 'Route too short. Need at least 2 valid cities.';
        console.error('❌ Route too short:', this.route);
      }

    } catch (err: any) {
      this.error = err.message || 'Error fetching coordinates';
      console.error('❌ Trip planning error:', err);
    } finally {
      this.loading = false;
    }
  }

  getCoordinates(city: string): Promise<L.LatLng | null> {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${environment.openCageApiKey}`;
    console.log('🔍 Fetching coordinates for:', city);

    return this.http.get<any>(url).toPromise()
      .then(data => {
        console.log('✅ Geocode result for', city, data);
        if (data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry;
          return new L.LatLng(lat, lng);
        }

        console.warn(`⚠️ No results found for: ${city}`);
        return null;
      })
      .catch(err => {
        console.error(`❌ API error for ${city}:`, err);
        return null;
      });
  }

  solveTSP(cities: string[]): string[] {
    if (cities.length === 0) return [];

    const start = cities[0];
    const visited = new Set<string>();
    const route = [start];
    visited.add(start);

    let current = start;
    while (route.length < cities.length) {
      let nextCity = '';
      let minDist = Infinity;
      for (let city of cities) {
        if (!visited.has(city)) {
          const dist = this.coordinates[current].distanceTo(this.coordinates[city]);
          if (dist < minDist) {
            minDist = dist;
            nextCity = city;
          }
        }
      }
      route.push(nextCity);
      visited.add(nextCity);
      current = nextCity;
    }

    return route;
  }

  initMap() {
    if (this.map) {
      this.map.remove(); // Remove previous map instance
    }

    setTimeout(() => {
      const firstCoord = this.coordinates[this.route[0]];
      const mapContainer = document.getElementById('map');

      if (!mapContainer) {
        console.error('❌ Map container #map not found in DOM.');
        return;
      }

      this.map = L.map('map').setView(firstCoord, 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      // ✅ Only draw after map is ready
      this.drawRoute();
    }, 100); // small delay to ensure map container is in the DOM
  }

  drawRoute() {
    if (!this.map || this.route.length < 2) {
      console.warn('⚠️ Map not initialized or route too short to draw.');
      return;
    }

    const latlngs: L.LatLng[] = [];

    for (const city of this.route) {
      const coord = this.coordinates[city];
      if (!coord) {
        console.error(`❌ Missing coordinates for city: ${city}`);
        return;
      }
      latlngs.push(coord);
    }

    latlngs.push(latlngs[0]); // close the loop

    // Draw polyline
    L.polyline(latlngs, { color: 'green', weight: 4 }).addTo(this.map);

    // Add markers
    this.route.forEach((city, i) => {
      const marker = L.marker(this.coordinates[city])
        .bindPopup(`${i + 1}. ${city}`)
        .addTo(this.map!);
    });

    // Fit map to bounds
    const bounds = L.latLngBounds(latlngs);
    this.map.fitBounds(bounds, { padding: [50, 50] });

    console.log('✅ Route drawn on map:', latlngs);
  }
}
