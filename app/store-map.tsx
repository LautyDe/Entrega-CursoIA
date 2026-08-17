"use client";

import { useEffect, useRef } from "react";
import type { Coordinates, NearbyStore } from "../lib/nearby-stores";

export function StoreMap({ location, stores }: { location: Coordinates; stores: NearbyStore[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    void import("leaflet").then((leaflet) => {
      if (disposed || !containerRef.current) return;
      map = leaflet.map(containerRef.current, { zoomControl: true }).setView([location.latitude, location.longitude], 14);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      leaflet.circleMarker([location.latitude, location.longitude], {
        radius: 9, color: "#7b2638", fillColor: "#7b2638", fillOpacity: 1,
      }).bindPopup("Tu ubicación aproximada").addTo(map);
      stores.forEach((store) => {
        leaflet.circleMarker([store.latitude, store.longitude], {
          radius: 7, color: "#315b3a", fillColor: "#dcebd7", fillOpacity: 1,
        }).bindPopup(`<strong>${store.name}</strong><br>${store.distanceKm.toFixed(1)} km`).addTo(map!);
      });
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [location, stores]);

  return <div className="store-map" ref={containerRef} aria-label="Mapa de supermercados cercanos" />;
}
