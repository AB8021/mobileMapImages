import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
interface Marker {
  id?: string;
  url: string;
  latitude: number;
  longitude: number;
}
@Injectable({
  providedIn: 'root',
})
export class MarkerService {
  constructor(private firestore: Firestore) {}
  //markerin haku
  getMarkers(): Observable<Marker[]> {
    const markersRef = collection(this.firestore, 'images');
    return collectionData(markersRef, { idField: 'id' }) as Observable<
      Marker[]
    >;
  }
  //markerin cahceaminen
  cacheMarkers(markers: Marker[]): Promise<void> {
    return caches.open('marker-data').then((cache) => {
      return cache.put('markers', new Response(JSON.stringify(markers)));
    });
  }
  //cachettujen markerien haku
  getCachedMarkers(): Observable<Marker[]> {
    return from(
      caches.open('marker-data').then((cache) =>
        cache.match('markers').then(async (response) => {
          if (response) {
            return await response.json();
          } else {
            return [];
          }
        })
      )
    );
  }
}
