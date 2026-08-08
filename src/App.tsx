import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LandingPage } from '@/components/landing/LandingPage';
import { CreatePage } from '@/components/card-editor/CreatePage';
import { GalleryPage } from '@/components/gallery/GalleryPage';
import { AboutPage } from '@/components/about/AboutPage';
import { RulebookPage } from '@/components/rulebook/RulebookPage';
import { ResourcesPage } from '@/components/resources/ResourcesPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  const prevRootRef = useRef(pathname.split('/')[1]);
  useEffect(() => {
    const root = pathname.split('/')[1];
    if (root !== prevRootRef.current) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    prevRootRef.current = root;
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/:cardId" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/rulebook" element={<RulebookPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
