import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { Storage } from '@angular/fire/storage';
import { MatDialog } from '@angular/material/dialog';
import { ImagePopupComponent } from '../image-popup/image-popup.component';
import { MarkerService } from '../marker.service';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
interface Marker {
  id?: string;
  url: string;
  latitude: number;
  longitude: number;
}
//kartan cacheaminen
function cacheTiles(url: any) {
  return caches.open('map-data').then((cache) => {
    return cache.match(url).then((response) => {
      if (response) {
        return response;
      }
      return fetch(url).then((networkResponse) => {
        cache.put(url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}
//tehdään karttaluokka joka cahceaa kartan
class CachingTileLayer extends L.TileLayer {
  override createTile(coords: any, done: any) {
    const tile = document.createElement('img');
    const url = this.getTileUrl(coords);

    cacheTiles(url)
      .then((response) => response.blob())
      .then((blob) => {
        tile.src = URL.createObjectURL(blob);
        done(null, tile);
      })
      .catch((error) => {
        done(error);
      });

    return tile;
  }
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, AfterViewInit {
  //kartan attribuuttit
  private map!: L.Map;
  latitude!: number;
  longitude!: number;
  userLocationMarker!: L.Marker;
  private markersLayer!: L.LayerGroup;
  uploading = false;
  uploadValue = 0;
  constructor(
    private dialog: MatDialog,
    private markerService: MarkerService,
    public authService: AuthService
  ) {}
  private readonly storage: Storage = inject(Storage);
  private readonly db: Firestore = inject(Firestore);
  ngOnInit() {
    // katsotaan ollaanko offline vai ei
    window.addEventListener('online', () => this.handleConnectionStatus());
    window.addEventListener('offline', () => this.handleConnectionStatus());
  }
  ngAfterViewInit(): void {
    this.initMap();
    this.handleConnectionStatus();
  }

  //jos online, karttamerkit firebasesta, jos ei cachesta
  private handleConnectionStatus(): void {
    if (navigator.onLine) {
      this.getMarkersFromFirestore();
    } else {
      this.getMarkersFromCache();
    }
  }
  //käyttäjän jäljitys
  public locateUser(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          this.userLocationMarker = L.marker([latitude, longitude], {}).addTo(
            this.map
          );

          this.userLocationMarker.bindPopup('Here You Are').openPopup();
          return [latitude, longitude];
        },
        (error) => {
          console.error('Error in retrieving user location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }
  public removeUserLocation() {
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }
  }
  //kartan initializointi
  private initMap(): void {
    this.map = L.map('map').setView([60.1699, 24.9384], 13);

    this.markersLayer = new L.LayerGroup().addTo(this.map);
    const cachingTileLayer = new CachingTileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.map);
  }
  //metodi markerien hakemiseen firebasesta
  private getMarkersFromFirestore(): void {
    if (!this.authService.user) {
      this.getMarkersFromCache;
    } else {
      this.markerService.getMarkers().subscribe((markers) => {
        console.log(markers);
        this.markersLayer.clearLayers();
        markers.forEach((markerData) => this.addMarkerToMap(markerData));
        this.markerService
          .cacheMarkers(markers)
          .catch((error) => console.error(error));
      });
    }
  }

  private getMarkersFromCache(): void {
    this.markerService.getCachedMarkers().subscribe((markers) => {
      this.markersLayer.clearLayers();
      console.log(markers);
      markers.forEach((markerData) => this.addMarkerToMapOffline(markerData));
    });
  }
  //markerien hakeminen kartalle
  private addMarkerToMap(markerData: Marker): void {
    const customIcon = L.icon({
      iconUrl: 'assets/marker.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    const newMarker = L.marker([markerData.latitude, markerData.longitude], {
      icon: customIcon,
    }).addTo(this.markersLayer);

    newMarker.on('click', () => {
      console.log(markerData);
      this.displayImage(markerData.url);
    });
  }
  private addMarkerToMapOffline(markerData: Marker): void {
    const customIcon = L.icon({
      iconUrl: 'assets/marker.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    const newMarker = L.marker([markerData.latitude, markerData.longitude], {
      icon: customIcon,
    }).addTo(this.markersLayer);
  }

  //kun markeria klikataan, tämä avaa image-modalin
  private displayImage(imageUrl: string): void {
    this.dialog.open(ImagePopupComponent, {
      data: { imageUrl: imageUrl },
      panelClass: 'image-popup-dialog',
      height: '90%',
    });
  }

  //markerien varsinainen firebase-haku funktio
  getMarkers(): Observable<Marker[]> {
    const markersRef = collection(this.db, 'images');

    return collectionData(markersRef, { idField: 'id' }) as Observable<
      Marker[]
    >;
  }

  //kuvan latauksen käsittelijä

  connectHandle() {
    this.handleConnectionStatus();
  }
  logOut() {}
  // kuvan varsinainen lataaja
}
