import FamilyTree from "./pages/FamilyTree"
import Navbar from "./components/Navbar"

function App() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <FamilyTree />
      </main>
    </div>
  )
}

export default App