import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import About from './pages/About'

export default function App() {
  return (
    <div className="min-h-screen bg-surface text-gray-100 font-body">
      <Navbar />
      <main>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/about"   element={<About />} />
        </Routes>
      </main>
    </div>
  )
}
