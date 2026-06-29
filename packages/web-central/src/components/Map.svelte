<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Map, Marker, Polyline } from 'leaflet';

  let mapElement: HTMLDivElement;
  let map: Map;
  let driverMarkers: Map<string, Marker> = new Map();
  let routeLine: Polyline | null = null;

  export let drivers: Array<{ id: string; lat: number; lon: number; status: string }> = [];
  export let activeRide: any = null;

  onMount(async () => {
    // Dynamically import Leaflet (client-side only)
    const L = await import('leaflet');
    
    // Initialize map centered on Mexico City
    map = L.map(mapElement).setView([19.4326, -99.1332], 12);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add driver markers
    updateDriverMarkers(drivers);
  });

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });

  function updateDriverMarkers(newDrivers: Array<{ id: string; lat: number; lon: number; status: string }>) {
    if (!map) return;

    // Clear existing markers
    driverMarkers.forEach(marker => marker.remove());
    driverMarkers.clear();

    // Add new markers
    newDrivers.forEach(driver => {
      const L = require('leaflet');
      const marker = L.marker([driver.lat, driver.lon])
        .addTo(map)
        .bindPopup(`Conductor: ${driver.id}<br>Estado: ${driver.status}`);
      
      driverMarkers.set(driver.id, marker);
    });
  }

  function updateRoute(pickup: { lat: number; lon: number }, destination: { lat: number; lon: number }) {
    if (!map) return;

    // Remove existing route
    if (routeLine) {
      routeLine.remove();
    }

    // Draw new route
    const L = require('leaflet');
    routeLine = L.polyline(
      [[pickup.lat, pickup.lon], [destination.lat, destination.lon]],
      { color: '#1a1a2e', weight: 4 }
    ).addTo(map);

    // Fit map to route bounds
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
  }

  $: updateDriverMarkers(drivers);
  $: if (activeRide && activeRide.pickup && activeRide.destination) {
    updateRoute(activeRide.pickup, activeRide.destination);
  }
</script>

<div class="map-wrapper">
  <div bind:this={mapElement} class="map-container"></div>
  
  {#if drivers.length === 0}
    <div class="no-drivers">
      <p>No hay conductores en línea</p>
    </div>
  {/if}
</div>

<style>
  .map-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .map-container {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    z-index: 1;
  }

  .no-drivers {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 1rem 2rem;
    border-radius: 8px;
    z-index: 2;
  }
</style>
