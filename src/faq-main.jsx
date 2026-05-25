import React from 'react'
import ReactDOM from 'react-dom/client'
import FaqApp from './FaqApp'
import { Providers } from './Providers'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers><FaqApp /></Providers>
  </React.StrictMode>,
)
