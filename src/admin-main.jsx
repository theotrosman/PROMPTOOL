import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp'
import { Providers } from './Providers'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers><AdminApp /></Providers>
  </React.StrictMode>,
)
