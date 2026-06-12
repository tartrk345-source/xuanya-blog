import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import WritePage from './pages/WritePage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#fafafa]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/write" element={<WritePage />} />
          <Route path="/write/:id" element={<WritePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
