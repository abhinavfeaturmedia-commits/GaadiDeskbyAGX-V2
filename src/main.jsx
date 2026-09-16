import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initNativeAndroidBridge } from './services/nativeInit'

// Initialize native Android hardware & styling (StatusBar, Keyboard, Network)
initNativeAndroidBridge();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
