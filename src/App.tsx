import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ArticleImageLightbox } from './components/CodeBlock';
import ErrorBoundary from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const WritePage = lazy(() => import('./pages/WritePage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const ToolStressPage = lazy(() => import('./pages/ToolStressPage'));
const ToolBalancePage = lazy(() => import('./pages/ToolBalancePage'));
const ToolResourcesPage = lazy(() => import('./pages/ToolResourcesPage'));
const ToolWippfPage = lazy(() => import('./pages/ToolWippfPage'));

// RSS 不需要 lazy（体积小）
import RssFeedPage from './pages/RssPage';

/**
 * 应用启动：清理旧版 GitHub Gist 同步遗留的本地凭据
 * 备份已改为服务器本地备份（src/utils/backupSync.ts），这里只做一次性清场
 */
function SyncInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem('xuanya-blog-github-pat');
      localStorage.removeItem('xuanya-blog-gist-id');
    } catch {
      /* 隐私模式或 localStorage 不可用时忽略 */
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEFAF9] dark:bg-[#0A0E1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#DA583F]/20 dark:border-[#3B82F6]/20 border-t-[#DA583F] dark:border-t-[#60A5FA] rounded-full animate-spin" />
          <span className="text-sm text-[#767693] dark:text-[#94A3B8] animate-pulse">加载中…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#FEFAF9] dark:bg-[#0A0E1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#DA583F]/20 dark:border-[#3B82F6]/20 border-t-[#DA583F] dark:border-t-[#60A5FA] rounded-full animate-spin" />
        <span className="text-sm text-[#767693] dark:text-[#94A3B8]">加载中…</span>
      </div>
    </div>
  );
}

/** 页面切换时自动滚回顶部 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <SyncInitializer>
        <BrowserRouter>
        <ScrollToTop />
        <ArticleImageLightbox />
        <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/category/:key" element={<CategoryPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/write" element={<WritePage />} />
            <Route path="/write/:id" element={<WritePage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/tools/stress" element={<ToolStressPage />} />
            <Route path="/tools/balance" element={<ToolBalancePage />} />
            <Route path="/tools/resources" element={<ToolResourcesPage />} />
            <Route path="/tools/wippf" element={<ToolWippfPage />} />
            <Route path="/rss.xml" element={<RssFeedPage />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </SyncInitializer>
    </HelmetProvider>
  );
}
