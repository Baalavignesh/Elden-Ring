import { useState } from "react"
import { motion } from "motion/react"
import FamilyTree from "./pages/FamilyTree"
import Navbar from "./components/Navbar"
import ParticlesBackground from "./components/ParticlesBackground"
import Sidebar from "./components/Sidebar"

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    console.log("Menu button clicked!")
    setSidebarOpen(true)
  }

  return (
    <div className="min-h-screen text-white flex flex-col relative">
      <ParticlesBackground />
      
      {/* Hamburger Menu Button */}
      {!sidebarOpen && (
        <motion.button
          onClick={handleMenuClick}
          className="fixed top-12 left-12 z-[60] text-white/60 hover:text-white transition-colors p-2 pointer-events-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ delay: 1, duration: 0.5 }}
          aria-label="Open menu"
          style={{ pointerEvents: 'auto' }}
        >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        </motion.button>
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Navbar />
      <main className="flex-1 relative">
        <FamilyTree />
      </main>
    </div>
  )
}

export default App