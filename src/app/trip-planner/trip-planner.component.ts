import { Component, OnInit } from '@angular/core';
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
export class TripPlannerComponent implements OnInit {
  locations: string[] = [''];
  coordinates: { [location: string]: L.LatLng } = {};
  route: string[] = [];
  map: L.Map | undefined;
  loading = false;
  error = '';
  totalDistanceKm = 0;

  backgroundImages: string[] = [
    'assets/img1.jpg',
    'assets/img2.jpg',
    'assets/img3.jpg',
    'assets/img4.jpg',
    'assets/img5.jpg',
    'assets/img6.jpg',
    'assets/img7.jpg',
    'assets/img8.jpg',
    'assets/img9.jpg',
    'assets/img10.jpg'
  ];
  currentBackground: string = this.backgroundImages[0];
  bgIndex: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    setInterval(() => {
      this.bgIndex = (this.bgIndex + 1) % this.backgroundImages.length;
      this.currentBackground = this.backgroundImages[this.bgIndex];
    }, 3000); // rotate every 3s
  }

  addLocationField() {
    if (this.locations[this.locations.length - 1].trim() !== '') {
      this.locations.push('');
    } else {
      alert('Please enter a location before adding another.');
    }
  }

  removeLocationField(index: number) {
    if (this.locations.length > 1) {
      this.locations.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  async planTrip() {
    this.loading = true;
    this.error = '';
    this.route = [];
    this.coordinates = {};
    this.totalDistanceKm = 0;

    const coordsPromises = this.locations.map(location => this.getCoordinates(location.trim()));

    try {
      const resolved = await Promise.all(coordsPromises);

      resolved.forEach((coord, i) => {
        const name = this.locations[i].trim();
        if (coord && name.length > 0) {
          this.coordinates[name] = coord;
        } else {
          console.warn(`⚠️ Skipping invalid or empty location: "${this.locations[i]}"`);
        }
      });

      const validNames = Object.keys(this.coordinates);
      if (validNames.length < 2) {
        this.error = 'Please enter at least two valid locations.';
        return;
      }

      this.route = this.solveTSP(validNames);
      this.initMap();

    } catch (err: any) {
      this.error = err.message || 'Error fetching coordinates';
    } finally {
      this.loading = false;
    }
  }

  getCoordinates(location: string): Promise<L.LatLng | null> {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${environment.openCageApiKey}`;

    return this.http.get<any>(url).toPromise()
      .then(data => {
        if (data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry;
          return new L.LatLng(lat, lng);
        }
        return null;
      })
      .catch(() => null);
  }

  solveTSP(locations: string[]): string[] {
    const start = locations[0];
    const visited = new Set<string>([start]);
    const route = [start];
    let current = start;

    while (route.length < locations.length) {
      let next = '';
      let minDist = Infinity;

      for (const loc of locations) {
        if (!visited.has(loc)) {
          const dist = this.coordinates[current].distanceTo(this.coordinates[loc]);
          if (dist < minDist) {
            minDist = dist;
            next = loc;
          }
        }
      }

      if (next) {
        visited.add(next);
        route.push(next);
        current = next;
      }
    }

    return route;
  }

  initMap() {
    if (this.map) {
      this.map.remove();
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

      this.drawRoute();
    }, 100);
  }

  drawRoute() {
    if (!this.map || this.route.length < 2) return;

    const latlngs: L.LatLng[] = this.route.map(loc => this.coordinates[loc]);
    latlngs.push(latlngs[0]); // Optional loop

    L.polyline(latlngs, { color: 'green', weight: 4 }).addTo(this.map!);

    this.route.forEach((loc, i) => {
      const coord = this.coordinates[loc];

      const icon = L.divIcon({
        className: 'animated-pin',
        html: `<div class="pin-bounce"><span class="pin-number">${i + 1}</span></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      L.marker(coord, { icon })
        .addTo(this.map!)
        .bindPopup(`<b>${i + 1}. ${loc}</b>`);
    });

    this.totalDistanceKm = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
      const from = latlngs[i];
      const to = latlngs[i + 1];
      this.totalDistanceKm += this.getDistanceInKm(from.lat, from.lng, to.lat, to.lng);
    }
    this.totalDistanceKm = parseFloat(this.totalDistanceKm.toFixed(2));

    this.map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });

    console.log('✅ Route drawn on map:', latlngs);
    console.log('🛣️ Total Distance:', this.totalDistanceKm, 'km');
  }

  getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
