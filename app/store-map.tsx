"use client";

import { useEffect, useRef } from "react";
import type { Coordinates, NearbyStore } from "../lib/nearby-stores";

export type StoreDeal = {
  day: string;
  discount: string;
  paymentLabels: string[];
  title: string;
};

export function StoreMap({ location, stores, dealsByStore }: { location: Coordinates; stores: NearbyStore[]; dealsByStore: Record<string, StoreDeal[]> }) {
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
        const deals = dealsByStore[store.id] ?? [];
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = store.name;
        popup.append(title, document.createElement("br"), document.createTextNode(`${store.distanceKm.toFixed(1)} km`));
        deals.forEach((deal) => {
          const benefit = document.createElement("p");
          benefit.className = "map-popup-deal";
          benefit.textContent = `${deal.day}: ${deal.discount} · ${deal.paymentLabels.join(", ")}`;
          popup.append(benefit);
        });
        if (!deals.length) {
          const noDeal = document.createElement("small");
          noDeal.textContent = "Sin descuento compatible cargado";
          popup.append(document.createElement("br"), noDeal);
        }
        leaflet.circleMarker([store.latitude, store.longitude], {
          radius: deals.length ? 10 : 6,
          color: deals.length ? "#315b3a" : "#7f817d",
          fillColor: deals.length ? "#75b668" : "#e2e1dc",
          fillOpacity: 1,
          weight: deals.length ? 3 : 1,
        }).bindPopup(popup).addTo(map!);
      });
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [dealsByStore, location, stores]);

  return <div className="store-map" ref={containerRef} aria-label="Mapa de supermercados cercanos" />;
}
