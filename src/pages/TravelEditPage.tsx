/**
 * 旅行攻略在线编辑器 — 管理员专用
 *
 * 左面板：JSON 编辑器（textarea）
 * 右面板：实时预览（TravelGuideRenderer）
 * 保存到 Supabase travel_guides 表，网站即时更新
 */
import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdminLogin from '../components/AdminLogin';
import TravelGuideRenderer from '../components/travel/TravelGuideRenderer';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { getTravelById, getTravelList, saveTravelGuide, type TravelGuideMeta } from '../storage/travelGuideStore';
import { northwest2026 } from '../data/northwest2026';
import type { TravelGuideData } from '../data/travelTypes';

/** JSON 格式化（2空格缩进） */
function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/** 校验 JSON 并返回数据或错误信息 */
function parseJson(raw: string): { data: TravelGuideData | null; error: string | null } {
  try {
    const parsed = JSON.parse(raw);
    // 基础校验：必须有 meta.title
    if (!parsed?.meta?.title) {
      return { data: null, error: '缺少 meta.title 字段' };
    }
    return { data: parsed as TravelGuideData, error: null };
  } catch (e: any) {
    return { data: null, error: `JSON 解析错误: ${e.message}` };
  }
}

export default function TravelEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAdminAuth();

  const [guides, setGuides] = useState<TravelGuideMeta[]>([]);
  const [jsonText, setJsonText] = useState('');
  const [previewData, setPreviewData] = useState<TravelGuideData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadedId, setLoadedId] = useState<string>('');
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // 导航守卫：未保存提醒
  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate]);

  // 加载攻略列表（侧边栏）
  useEffect(() => {
    if (!isAdmin) return;
    getTravelList().then(setGuides);
  }, [isAdmin]);

  // 加载指定攻略数据
  const loadGuide = useCallback(async (guideId: string) => {
    // 先尝试 Supabase
    let data = await getTravelById(guideId);
    // Fallback: 本地数据
    if (!data && guideId === 'northwest-2026') {
      data = northwest2026;
    }
    if (data) {
      const text = formatJson(data);
      setJsonText(text);
      setPreviewData(data);
      setParseError(null);
      setLoadedId(guideId);
      setHasUnsaved(false);
    }
  }, []);

  // 初次加载
  useEffect(() => {
    if (id && isAdmin) {
      loadGuide(id);
    }
  }, [id, isAdmin, loadGuide]);

  // 实时预览（debounce 500ms）
  useEffect(() => {
    if (!jsonText.trim()) {
      setPreviewData(null);
      setParseError(null);
      return;
    }
    const timer = setTimeout(() => {
      const { data, error } = parseJson(jsonText);
      setPreviewData(data);
      setParseError(error);
    }, 500);
    return () => clearTimeout(timer);
  }, [jsonText]);

  // 标记未保存
  const handleJsonChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    setHasUnsaved(true);
  };

  // 格式化 JSON
  const handleFormat = () => {
    const { data } = parseJson(jsonText);
    if (data) {
      setJsonText(formatJson(data));
    }
  };

  // 保存
  const handleSave = async () => {
    const { data, error } = parseJson(jsonText);
    if (error || !data) {
      setParseError(error || '数据无效');
      return;
    }
    if (!loadedId) return;

    setSaving(true);
    try {
      const meta = data.meta;
      // 从数据中提取列表字段
      const existing = guides.find(g => g.id === loadedId);
      await saveTravelGuide({
        id: loadedId,
        data,
        title: meta.title,
        subtitle: meta.subtitle,
        date: meta.stats?.[0]?.label || existing?.date || '',
        emoji: existing?.emoji || '🏜️',
        tags: existing?.tags || [],
        color: existing?.color || '#c88a3d',
      });
      setHasUnsaved(false);
      setParseError(null);
      // 刷新列表缓存
      const updatedList = await getTravelList();
      setGuides(updatedList);
      alert('✅ 保存成功！网站即时生效');
    } catch (e: any) {
      alert(`❌ 保存失败: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0A0E1A]">
      <Helmet>
        <title>编辑攻略 · 玄牙管理</title>
      </Helmet>

      {/* 顶栏 */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#1E293B] border-b border-[#E8E5DF] dark:border-[#334155] shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/travels')}
              className="text-xs text-[#767693] dark:text-[#94A3B8] hover:text-[#DA583F] transition-colors flex items-center gap-1"
            >
              ← 返回
            </button>
            <span className="text-[#E8E5DF] dark:text-[#334155]">|</span>
            <h1 className="text-sm font-bold text-[#313131] dark:text-[#E2E8F0]">
              🛠️ 攻略编辑器
            </h1>
            {hasUnsaved && (
              <span className="text-[11px] text-amber-500 font-medium">● 未保存</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFormat}
              className="px-3 py-1.5 text-xs font-medium text-[#4F4F4F] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] border border-[#E8E5DF] dark:border-[#334155] rounded-md hover:bg-[#F8F7F4] dark:hover:bg-[#0A0E1A] transition-all"
            >
              格式化
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !previewData || !loadedId}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#DA583F] rounded-md hover:bg-[#C43F30] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? '保存中…' : '保存到网站'}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容：双栏布局 */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* 左侧：攻略列表 + JSON 编辑器 */}
        <div className="w-[45%] min-w-[400px] border-r border-[#E8E5DF] dark:border-[#334155] flex flex-col">
          {/* 攻略选择器 */}
          <div className="p-3 border-b border-[#E8E5DF] dark:border-[#334155] flex items-center gap-2">
            <label className="text-xs font-medium text-[#767693] dark:text-[#94A3B8] whitespace-nowrap">
              选择攻略：
            </label>
            <select
              value={loadedId}
              onChange={e => {
                const newId = e.target.value;
                if (newId && hasUnsaved) {
                  if (!confirm('当前有未保存的修改，确定切换？')) return;
                }
                if (newId) {
                  navigate(`/admin/travels/${newId}`, { replace: true });
                  loadGuide(newId);
                }
              }}
              className="flex-1 px-2.5 py-1.5 text-sm border border-[#E8E5DF] dark:border-[#334155] rounded-md bg-white dark:bg-[#1E293B] text-[#313131] dark:text-[#E2E8F0] outline-none focus:border-[#DA583F]"
            >
              <option value="">— 选择攻略 —</option>
              {guides.map(g => (
                <option key={g.id} value={g.id}>{g.emoji} {g.title}</option>
              ))}
            </select>
          </div>

          {/* JSON 编辑器 */}
          <div className="flex-1 relative">
            {/* 错误提示 */}
            {parseError && (
              <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 font-mono">{parseError}</p>
              </div>
            )}
            <textarea
              value={jsonText}
              onChange={handleJsonChange}
              placeholder="选择攻略后在此编辑 JSON…"
              spellCheck={false}
              className={`w-full h-full p-4 font-mono text-[13px] leading-relaxed bg-[#FAFAF5] dark:bg-[#0F1117] text-[#313131] dark:text-[#E2E8F0] outline-none resize-none border-0 ${
                parseError ? 'pt-12' : ''
              }`}
            />
          </div>
        </div>

        {/* 右侧：实时预览 */}
        <div className="flex-1 overflow-y-auto bg-[#F8F7F4] dark:bg-[#0A0E1A]">
          {previewData ? (
            <TravelGuideRenderer data={previewData} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-sm text-[#B8B4B0] dark:text-[#94A3B8]">
                  {jsonText.trim()
                    ? parseError
                      ? 'JSON 格式错误，请检查左侧编辑器'
                      : '解析中…'
                    : '选择一个攻略开始编辑'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminLogin />
    </div>
  );
}
