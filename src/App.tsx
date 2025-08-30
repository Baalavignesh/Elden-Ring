import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Family from "./pages/Family";


function App() {
 

  return (
    <div className="min-h-screen text-white flex flex-col relative">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/familytree" element={<Family />} />
        </Routes>
    </div>
  );
}

export default App;
