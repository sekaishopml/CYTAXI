<script lang="ts">
  import { onMount } from 'svelte';

  let stats = {
    activeRides: 0,
    onlineDrivers: 0,
    completedToday: 0,
    totalPassengers: 0,
  };

  onMount(async () => {
    // TODO: Fetch real stats from API
    stats = {
      activeRides: 5,
      onlineDrivers: 12,
      completedToday: 48,
      totalPassengers: 156,
    };
  });
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
      <div id="map" class="map"></div>
    </div>

    <div class="rides-panel">
      <h2>Viajes Recientes</h2>
      <div class="rides-list">
        <p class="placeholder">Cargando viajes...</p>
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

  .map {
    height: 500px;
    background: #e0e0e0;
    border-radius: 8px;
  }

  .rides-list {
    max-height: 500px;
    overflow-y: auto;
  }

  .placeholder {
    color: #999;
    text-align: center;
    padding: 2rem;
  }
</style>
