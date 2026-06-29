<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';

  let mapElement: HTMLDivElement;
  let map: any;
  let driverStatus: 'online' | 'offline' | 'busy' = 'offline';
  let currentRide: any = null;
  let driverLocation = { lat: -0.1807, lon: -78.4678 }; // Quito, Ecuador
  let interval: ReturnType<typeof setInterval>;

  onMount(async () => {
    // Check if logged in
    const driverId = localStorage.getItem('driverId');
    if (!driverId) {
      goto('/');
      return;
    }

    // Initialize map
    const L = await import('leaflet');
    map = L.map(mapElement).setView([driverLocation.lat, driverLocation.lon], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Start location tracking
    startLocationTracking();

    // Poll for ride requests
    interval = setInterval(checkForRideRequests, 5000);
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
    if (map) {
      map.remove();
    }
  });

  function startLocationTracking() {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.watchPosition(
      (position) => {
        driverLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        // Update map
        if (map) {
          map.setView([driverLocation.lat, driverLocation.lon]);
        }

        // Send to server
        updateDriverLocation();
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function updateDriverLocation() {
    const driverId = localStorage.getItem('driverId');
    if (!driverId) return;

    try {
      // TODO: Replace with real API call
      console.log('Updating location:', driverLocation);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  async function checkForRideRequests() {
    if (driverStatus !== 'online') return;

    try {
      // TODO: Replace with real API call
      // For now, simulate a ride request occasionally
      if (Math.random() < 0.1 && !currentRide) {
        currentRide = {
          id: 'ride-' + Date.now(),
          passenger: {
            name: 'Juan Pérez',
            phone: '+593 99 123 4567',
          },
          pickup: {
            lat: driverLocation.lat + 0.01,
            lon: driverLocation.lon + 0.01,
            address: 'Av. Amazonas y Naciones Unidas',
          },
          destination: {
            lat: driverLocation.lat - 0.01,
            lon: driverLocation.lon - 0.01,
            address: 'Centro Histórico de Quito',
          },
          estimatedDistance: '3.2 km',
          estimatedTime: '12 min',
          estimatedFare: '$5.00',
        };
      }
    } catch (error) {
      console.error('Error checking for rides:', error);
    }
  }

  async function toggleStatus() {
    if (driverStatus === 'offline') {
      driverStatus = 'online';
    } else {
      driverStatus = 'offline';
    }

    try {
      // TODO: Replace with real API call
      console.log('Status changed to:', driverStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function acceptRide() {
    if (!currentRide) return;

    try {
      // TODO: Replace with real API call
      console.log('Accepting ride:', currentRide.id);
      driverStatus = 'busy';
      currentRide = { ...currentRide, status: 'accepted' };
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  }

  async function rejectRide() {
    if (!currentRide) return;

    try {
      // TODO: Replace with real API call
      console.log('Rejecting ride:', currentRide.id);
      currentRide = null;
    } catch (error) {
      console.error('Error rejecting ride:', error);
    }
  }

  async function completeRide() {
    if (!currentRide) return;

    try {
      // TODO: Replace with real API call
      console.log('Completing ride:', currentRide.id);
      currentRide = null;
      driverStatus = 'online';
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  }

  function logout() {
    localStorage.removeItem('driverId');
    localStorage.removeItem('driverPhone');
    goto('/');
  }
</script>

<div class="driver-app">
  <header>
    <div class="header-content">
      <h1>🚕 CYTAXI</h1>
      <div class="status-toggle">
        <span class="status-label">Estado:</span>
        <button
          class="status-btn {driverStatus}"
          on:click={toggleStatus}
          disabled={currentRide}
        >
          {driverStatus === 'online' ? 'En Línea' : driverStatus === 'busy' ? 'Ocupado' : 'Fuera de Línea'}
        </button>
      </div>
      <button class="logout-btn" on:click={logout}>Salir</button>
    </div>
  </header>

  <main>
    <div class="map-section">
      <div bind:this={mapElement} class="map"></div>
    </div>

    {#if currentRide}
      <div class="ride-panel">
        <div class="ride-header">
          <h2>Solicitud de Viaje</h2>
          <span class="ride-id">{currentRide.id}</span>
        </div>

        <div class="ride-details">
          <div class="passenger-info">
            <h3>Pasajero</h3>
            <p>👤 {currentRide.passenger.name}</p>
            <p>📱 {currentRide.passenger.phone}</p>
          </div>

          <div class="route-info">
            <div class="route-point">
              <span class="point-icon">🟢</span>
              <div class="point-details">
                <p class="point-label">Recogida</p>
                <p class="point-address">{currentRide.pickup.address}</p>
              </div>
            </div>

            <div class="route-point">
              <span class="point-icon">🔴</span>
              <div class="point-details">
                <p class="point-label">Destino</p>
                <p class="point-address">{currentRide.destination.address}</p>
              </div>
            </div>
          </div>

          <div class="trip-info">
            <div class="info-item">
              <span class="info-label">Distancia</span>
              <span class="info-value">{currentRide.estimatedDistance}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tiempo</span>
              <span class="info-value">{currentRide.estimatedTime}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tarifa</span>
              <span class="info-value">{currentRide.estimatedFare}</span>
            </div>
          </div>
        </div>

        <div class="ride-actions">
          {#if currentRide.status === 'accepted'}
            <button class="btn btn-success" on:click={completeRide}>
              ✅ Completar Viaje
            </button>
          {:else}
            <button class="btn btn-success" on:click={acceptRide}>
              ✅ Aceptar
            </button>
            <button class="btn btn-danger" on:click={rejectRide}>
              ❌ Rechazar
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="waiting-panel">
        <div class="waiting-content">
          <div class="waiting-icon">
            {#if driverStatus === 'online'}
              🔄
            {:else if driverStatus === 'busy'}
              🚗
            {:else}
              💤
            {/if}
          </div>
          <h2>
            {#if driverStatus === 'online'}
              Buscando viajes...
            {:else if driverStatus === 'busy'}
              Viaje en curso
            {:else}
              Estás fuera de línea
            {/if}
          </h2>
          <p>
            {#if driverStatus === 'online'}
              Te notificaremos cuando haya un viaje cerca
            {:else if driverStatus === 'busy'}
              Sigue las indicaciones del mapa
            {:else}
              Presiona "En Línea" para comenzar a recibir viajes
            {/if}
          </p>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .driver-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
  }

  header {
    background: #1a1a2e;
    color: white;
    padding: 1rem;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    font-size: 1.5rem;
  }

  .status-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-label {
    color: #aaa;
  }

  .status-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .status-btn.online {
    background: #2ecc71;
    color: white;
  }

  .status-btn.offline {
    background: #e74c3c;
    color: white;
  }

  .status-btn.busy {
    background: #f39c12;
    color: white;
  }

  .status-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .logout-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .map-section {
    flex: 1;
    min-height: 300px;
  }

  .map {
    width: 100%;
    height: 100%;
    min-height: 300px;
  }

  .ride-panel {
    background: white;
    padding: 1.5rem;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  }

  .ride-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .ride-header h2 {
    margin: 0;
    color: #1a1a2e;
  }

  .ride-id {
    background: #f0f0f0;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    color: #666;
  }

  .ride-details {
    margin-bottom: 1rem;
  }

  .passenger-info {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .passenger-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: #666;
  }

  .passenger-info p {
    margin: 0.25rem 0;
    color: #333;
  }

  .route-info {
    margin-bottom: 1rem;
  }

  .route-point {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .point-icon {
    font-size: 1.25rem;
    margin-top: 0.25rem;
  }

  .point-details {
    flex: 1;
  }

  .point-label {
    font-size: 0.75rem;
    color: #999;
    margin: 0;
  }

  .point-address {
    margin: 0.25rem 0 0 0;
    color: #333;
    font-weight: 500;
  }

  .trip-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
  }

  .info-item {
    text-align: center;
  }

  .info-label {
    display: block;
    font-size: 0.75rem;
    color: #999;
    margin-bottom: 0.25rem;
  }

  .info-value {
    font-weight: 600;
    color: #1a1a2e;
  }

  .ride-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .btn {
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .btn-success {
    background: #2ecc71;
    color: white;
  }

  .btn-danger {
    background: #e74c3c;
    color: white;
  }

  .waiting-panel {
    background: white;
    padding: 3rem;
    text-align: center;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  }

  .waiting-content {
    max-width: 300px;
    margin: 0 auto;
  }

  .waiting-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .waiting-panel h2 {
    margin: 0 0 0.5rem 0;
    color: #1a1a2e;
  }

  .waiting-panel p {
    color: #666;
    margin: 0;
  }
</style>
