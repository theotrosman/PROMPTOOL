import React from 'react'
import ReactDOM from 'react-dom/client'
import AboutApp from './AboutApp'
import { Providers } from './Providers'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers><AboutApp /></Providers>
  </React.StrictMode>,
)
