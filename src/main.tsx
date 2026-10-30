import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ForestArtPreview } from './components/ForestArtPreview'

const isForestPreview = new URLSearchParams(window.location.search).get('preview') === 'forest'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isForestPreview ? <ForestArtPreview /> : <App />}
  </StrictMode>,
)
