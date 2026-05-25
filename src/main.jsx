import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';

// Aquí podrías importar tus estilos globales si los tuvieras en un .css
// import './index.css';

window.TWEAK_DEFAULTS = {
  "theme": "indigo",
  "density": "regular",
  "defaultView": "grid",
  "dark": true
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
