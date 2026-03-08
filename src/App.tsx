import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/components/landing/LandingPage';
import { CreatePage } from '@/components/card-editor/CreatePage';
import { GalleryPage } from '@/components/gallery/GalleryPage';
import { AboutPage } from '@/components/about/AboutPage';

function App() {
  return (
    <BrowserRouter>
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
