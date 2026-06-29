<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Map from '../components/Map.svelte';

  let stats = {
    activeRides: 0,
    onlineDrivers: 0,
    completedToday: 0,
    totalPassengers: 0,
  };

  let drivers: Array<{ id: string; lat: number; lon: number; status: string }> = [];
  let activeRides: Array<{ id: string; passenger_id: string; status: string }> = [];
  let interval: ReturnType<typeof setInterval>;

  onMount(async () => {
    // Fetch initial data
    await fetchStats();
    await fetchDrivers();
    await fetchActiveRides();

    // Poll for updates every 5 seconds
    interval = setInterval(async () => {
      await fetchStats();
      await fetchDrivers();
      await fetchActiveRides();
    }, 5000);
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  async function fetchStats() {
    try {
      // TODO: Replace with real API calls
      stats = {
        activeRides: activeRides.length,
        onlineDrivers: drivers.filter(d => d.status === 'online').length,
        completedToday: 48,
        totalPassengers: 156,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchDrivers() {
    try {
      // TODO: Replace with real API call to driver service
      // For now, use mock data
      drivers = [
        { id: 'driver-1', lat: 19.4326, lon: -99.1332, status: 'online' },
        { id: 'driver-2', lat: 19.4426, lon: -99.1432, status: 'online' },
        { id: 'driver-3', lat: 19.4226, lon: -99.1232, status: 'busy' },
      ];
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  }

  async function fetchActiveRides() {
    try {
      // TODO: Replace with real API call to ride service
      // For now, use mock data
      activeRides = [
        { id: 'ride-1', passenger_id: 'passenger-1', status: 'in_progress' },
      ];
    } catch (error) {
      console.error('Error fetching active rides:', error);
    }
  }
</script>

<div class="dashboard">
  <h1>Dashboard de Control</h1>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon">🚗</div>
      <div class="stat-value">{stats.activeRides}</div>
      <div class="stat-label">Viajes Activos</div>
    </div>

    <div class="stat-card">
      <div class="stat-icon">👨‍✈️</div>
      <div class="stat-value">{stats.onlineDrivers}</div>
      <div class="stat-label">Conductores en Línea</div>
    </div>

    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-value">{stats.completedToday}</div>
      <div class="stat-label">Completados Hoy</div>
    </div>

    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-value">{stats.totalPassengers}</div>
      <div class="stat-label">Pasajeros Totales</div>
    </div>
  </div>

  <div class="content-grid">
    <div class="map-container">
      <h2>Mapa en Tiempo Real</h2>
      <div class="map-wrapper">
        <Map {drivers} activeRide={activeRides[0] || null} />
      </div>
    </div>

    <div class="rides-panel">
      <h2>Viajes Activos</h2>
      <div class="rides-list">
        {#if activeRides.length === 0}
          <p class="placeholder">No hay viajes activos</p>
        {:else}
          {#each activeRides as ride}
            <div class="ride-card">
              <div class="ride-header">
                <span class="ride-id">{ride.id}</span>
                <span class="ride-status">{ride.status}</span>
              </div>
              <div class="ride-details">
                <p>Pasajero: {ride.passenger_id}</p>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 1rem;
  }

  h1 {
    margin-bottom: 2rem;
    color: #1a1a2e;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    transition: transform 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-4px);
  }

  .stat-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: bold;
    color: #1a1a2e;
  }

  .stat-label {
    color: #666;
    margin-top: 0.5rem;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 900px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  .map-container,
  .rides-panel {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.2rem;
  }

  .map-wrapper {
    height: 500px;
    border-radius: 8px;
    overflow: hidden;
  }

  .rides-list {
    max-height: 500px;
    overflow-y: auto;
  }

  .ride-card {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .ride-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .ride-id {
    font-weight: bold;
    color: #1a1a2e;
  }

  .ride-status {
    background: #1a1a2e;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .ride-details {
    color: #666;
  }

  .placeholder {
    color: #999;
    text-align: center;
    padding: 2rem;
  }
</style>
