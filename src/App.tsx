import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const WritePage = lazy(() => import('./pages/WritePage'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#FEFAF9] dark:bg-[#0F0D0E]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#DA583F]/20 border-t-[#DA583F] rounded-full animate-spin" />
        <span className="text-sm text-[#767693] dark:text-[#8A8688]">加载中…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/write" element={<WritePage />} />
          <Route path="/write/:id" element={<WritePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
