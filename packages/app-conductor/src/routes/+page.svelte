<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let phone = '';
  let password = '';
  let loading = false;
  let error = '';

  onMount(() => {
    // Check if already logged in
    const driverId = localStorage.getItem('driverId');
    if (driverId) {
      goto('/dashboard');
    }
  });

  async function handleLogin() {
    if (!phone || !password) {
      error = 'Por favor, completa todos los campos';
      return;
    }

    loading = true;
    error = '';

    try {
      // TODO: Replace with real API call
      // For now, simulate login
      const mockDriverId = 'driver-' + Date.now();
      localStorage.setItem('driverId', mockDriverId);
      localStorage.setItem('driverPhone', phone);
      goto('/dashboard');
    } catch (err) {
      error = 'Error al iniciar sesión. Intenta de nuevo.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="logo">🚕</div>
    <h1>CYTAXI Conductor</h1>
    <p class="subtitle">Inicia sesión para comenzar a trabajar</p>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="phone">Teléfono</label>
        <input
          type="tel"
          id="phone"
          bind:value={phone}
          placeholder="+593 99 123 4567"
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      <button type="submit" class="btn btn-primary" disabled={loading}>
        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
      </button>
    </form>

    <p class="register-link">
      ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
    </p>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 1rem;
  }

  .login-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    width: 100%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  .logo {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h1 {
    color: #1a1a2e;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #666;
    margin-bottom: 2rem;
  }

  .error {
    background: #fee;
    color: #c00;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
    text-align: left;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.875rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #1a1a2e;
  }

  input:disabled {
    background: #f5f5f5;
  }

  .btn {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    margin-top: 1rem;
  }

  .btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #ffd700;
    color: #1a1a2e;
  }

  .register-link {
    margin-top: 1.5rem;
    color: #666;
  }

  .register-link a {
    color: #1a1a2e;
    font-weight: 600;
    text-decoration: none;
  }

  .register-link a:hover {
    text-decoration: underline;
  }
</style>
