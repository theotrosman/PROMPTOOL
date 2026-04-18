import React from 'react'
import ReactDOM from 'react-dom/client'
import LeaderboardApp from './LeaderboardApp'
import { Providers } from './Providers'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Providers><LeaderboardApp /></Providers>
  </React.StrictMode>,
)
