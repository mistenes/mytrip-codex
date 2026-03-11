import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { installApiAuthInterceptor } from './api';

const container = document.getElementById('root');
if (container) {
  installApiAuthInterceptor();
  createRoot(container).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
