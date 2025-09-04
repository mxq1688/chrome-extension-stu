import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from '@components/Header'
import Navigation from '@components/Navigation'
import Home from './pages/Home'
import Settings from './pages/Settings'
import About from './pages/About'
import MessageToast from '@components/MessageToast'
import { useExtensionStore } from './store/extensionStore'
import './styles/App.css'

function App() {
  const { message, hideMessage } = useExtensionStore()

  return (
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
      
      <MessageToast
        visible={message.visible}
        type={message.type}
        title={message.title}
        message={message.text}
        onClose={hideMessage}
      />
    </div>
  )
}

export default App