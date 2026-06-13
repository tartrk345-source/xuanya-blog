import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { getGistId } from './utils/gistSync';
import { ArticleImageLightbox } from './components/CodeBlock';
import ErrorBoundary from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const TravelsPage = lazy(() => import('./pages/TravelsPage'));
// ArticlePage 不用 lazy——手机上动态 chunk 下载经常失败导致白屏
import ArticlePage from './pages/ArticlePage';
const WritePage = lazy(() => import('./pages/WritePage'));

// RSS 不需要 lazy（体积小）
import RssFeedPage from './pages/RssPage';

/**
 * 应用启动时检查 Gist 配置状态（不再自动恢复，避免覆盖数据库）
 */
function SyncInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 仅检查 Gist 是否已配置，不执行恢复
    // 恢复操作由用户在设置中手动触发
    if (getGistId()) {
      console.log('[AutoSync] 检测到云端备份配置，如需恢复请在设置中手动操作');
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEFAF9] dark:bg-[#0F0D0E]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#DA583F]/20 border-t-[#DA583F] rounded-full animate-spin" />
          <span className="text-sm text-[#767693] dark:text-[#8A8688] animate-pulse">加载中…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

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
            <Route path="/travels" element={<TravelsPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/write" element={<WritePage />} />
            <Route path="/write/:id" element={<WritePage />} />
            <Route path="/rss.xml" element={<RssFeedPage />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </SyncInitializer>
    </HelmetProvider>
  );
}
