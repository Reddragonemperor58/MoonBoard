import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { MoodboardProvider } from './context/MoodboardContext'
import { ToastProvider } from './context/ToastContext'
import { TourProvider } from './context/TourContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <TourProvider>
        <MoodboardProvider>
          <App />
        </MoodboardProvider>
      </TourProvider>
    </ToastProvider>
  </React.StrictMode>,
)
