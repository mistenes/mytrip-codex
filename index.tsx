import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { installApiAuthInterceptor } from './api';
import './index.css';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
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

    const { children } = this as React.Component<AppErrorBoundaryProps, AppErrorBoundaryState>;
    return children;
  }
}

const container = document.getElementById('root');
if (container) {
  installApiAuthInterceptor();
  createRoot(container).render(
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
