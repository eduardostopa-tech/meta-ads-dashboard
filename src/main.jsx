import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Remove a tela de loading nativa após o React montar
if (typeof window.__hideAppLoader === 'function') {
  window.__hideAppLoader()
}
