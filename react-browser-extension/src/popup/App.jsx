import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Settings from './pages/Settings'
import About from './pages/About'
import { ExtensionProvider } from './context/ExtensionContext'
import './styles/App.css'

function App() {
  return (
    <ExtensionProvider>
      <div className="app">
        <Header />
        <Navigation />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </ExtensionProvider>
  )
}

export default App