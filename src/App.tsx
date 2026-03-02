import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/components/landing/LandingPage';
import { CreatePage } from '@/components/card-editor/CreatePage';
import { GalleryPage } from '@/components/gallery/GalleryPage';
import { AboutPage } from '@/components/about/AboutPage';

function MobileBanner() {
  return (
    <div className="md:hidden bg-navy-800 text-gold-300 text-center text-sm py-2 px-4">
      Hop on a PC to enjoy the full boomer OpenZoo experience.
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MobileBanner />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/:cardId" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
