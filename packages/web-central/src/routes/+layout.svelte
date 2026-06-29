<script>
  import '../app.css';
</script>

<div class="app">
  <header>
    <nav>
      <a href="/" class="logo">🚕 CYTAXI</a>
      <div class="nav-links">
        <a href="/dashboard">Dashboard</a>
        <a href="/rides">Viajes</a>
        <a href="/drivers">Conductores</a>
        <a href="/analytics">Estadísticas</a>
      </div>
    </nav>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <p>CYTAXI © 2026 - Plataforma de Transporte</p>
  </footer>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  header {
    background: #1a1a2e;
    color: white;
    padding: 1rem;
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
  }

  .nav-links a {
    color: white;
    text-decoration: none;
    transition: color 0.2s;
  }

  .nav-links a:hover {
    color: #ffd700;
  }

  main {
    flex: 1;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  footer {
    background: #1a1a2e;
    color: white;
    text-align: center;
    padding: 1rem;
    margin-top: auto;
  }
</style>
