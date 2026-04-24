import React from 'react'
import ChatWidget from './components/ChatWidget'

export default function App() {
  return (
    <>
      {/* Your existing website goes here */}
      {/* The ChatWidget floats independently at bottom-right */}
      <div style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
        color: '#0A2540'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, marginBottom: 12 }}>
            Simzzy eSIM Platform
          </h1>
          <p style={{ color: '#64748B', fontSize: 16 }}>
            Click the chat button at the bottom-right to open support.
          </p>
        </div>
      </div>

      {/* Floating chat widget — works on any page */}
      <ChatWidget />
    </>
  )
}
