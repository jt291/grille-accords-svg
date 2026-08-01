/**
 * Boots the React application and attaches it to the document root.
 *
 * @packageDocumentation
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Élément racine #root introuvable')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
