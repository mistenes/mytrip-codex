import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { installApiAuthInterceptor } from './api';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  declare props: Readonly<AppErrorBoundaryProps>;

  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application render failed.', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <main className="app-error-boundary" role="alert">
          <div className="app-error-boundary-card">
            <span className="app-error-boundary-eyebrow">Runtime error</span>
            <h1>The app failed to render.</h1>
            <p>{this.state.error.message || 'An unexpected error occurred while loading the page.'}</p>
            <button type="button" className="btn btn-primary app-error-boundary-action" onClick={this.handleReload}>
              Reload page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

const renderBootstrapError = (message: string) => {
  const container = document.getElementById('root');
  if (!container) {
    return;
  }

  container.innerHTML = `
    <main class="app-error-boundary" role="alert">
      <div class="app-error-boundary-card">
        <span class="app-error-boundary-eyebrow">Bootstrap error</span>
        <h1>The app could not start.</h1>
        <p>${message}</p>
      </div>
    </main>
  `;
};

window.addEventListener('error', (event) => {
  const message = event.error?.message || event.message || 'An unexpected startup error occurred.';
  renderBootstrapError(message);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    (reason && typeof reason === 'object' && 'message' in reason && typeof reason.message === 'string' && reason.message) ||
    (typeof reason === 'string' ? reason : 'An unhandled async startup error occurred.');
  renderBootstrapError(message);
});

const container = document.getElementById('root');
if (container) {
  try {
    installApiAuthInterceptor();
    createRoot(container).render(
      <AppErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppErrorBoundary>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected startup error occurred.';
    renderBootstrapError(message);
  }
}
