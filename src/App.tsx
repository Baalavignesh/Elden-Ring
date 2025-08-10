import FamilyTree from "./pages/FamilyTree"
import Navbar from "./components/Navbar"
import ParticlesBackground from "./components/ParticlesBackground"

function App() {
  return (
    <div className="min-h-screen text-white flex flex-col relative">
      <ParticlesBackground />
      <Navbar />
      <main className="flex-1 relative">
        <FamilyTree />
      </main>
    </div>
  )
}

export default App