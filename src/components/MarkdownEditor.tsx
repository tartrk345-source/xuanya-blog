import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

const TOOLBAR_ACTIONS = [
  { label: '加粗', icon: 'B', action: (c: string) => `**${c || '粗体文字'}**` },
  { label: '斜体', icon: 'I', action: (c: string) => `_${c || '斜体文字'}_` },
  { label: '删除线', icon: 'S', action: (c: string) => `~~${c || '删除线文字'}~~` },
  { label: '标题1', icon: 'H1', action: () => '# 标题\n' },
  { label: '标题2', icon: 'H2', action: () => '## 标题\n' },
  { label: '标题3', icon: 'H3', action: () => '### 标题\n' },
  { label: '链接', icon: '🔗', action: () => '[链接文字](https://)' },
  { label: '图片', icon: '🖼', action: () => '![图片描述](图片链接)' },
  { label: '代码块', icon: '</>', action: () => '\n```\n代码\n```\n' },
  { label: '行内代码', icon: '`', action: (c: string) => `\`${c || '代码'}\`` },
  { label: '引用', icon: '❝', action: () => '> 引用文字\n' },
  { label: '无序列表', icon: '•', action: () => '- 列表项\n' },
  { label: '有序列表', icon: '1.', action: () => '1. 列表项\n' },
  { label: '分割线', icon: '—', action: () => '\n---\n' },
  { label: '表格', icon: '⊞', action: () => '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n' },
];

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>('split');
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  const handleToolbarAction = (actionFn: (sel: string) => string) => {
    const textarea = document.querySelector('textarea[data-markdown-editor]') as HTMLTextAreaElement;
    if (!textarea) {
      const added = actionFn('');
      onChange(content + added);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const added = actionFn(selected);

    let result: string;
    let cursorPos: number;

    if (selected) {
      if (added.startsWith('**')) {
        result = content.substring(0, start) + `**${selected}**` + content.substring(end);
        cursorPos = start + `**${selected}**`.length;
      } else if (added.startsWith('_')) {
        result = content.substring(0, start) + `_${selected}_` + content.substring(end);
        cursorPos = start + `_${selected}_`.length;
      } else if (added.startsWith('~~')) {
        result = content.substring(0, start) + `~~${selected}~~` + content.substring(end);
        cursorPos = start + `~~${selected}~~`.length;
      } else if (added.startsWith('`') && !added.startsWith('``')) {
        result = content.substring(0, start) + `\`${selected}\`` + content.substring(end);
        cursorPos = start + `\`${selected}\``.length;
      } else {
        result = content.substring(0, start) + added + content.substring(end);
        cursorPos = start + added.length;
      }
    } else {
      result = content.substring(0, start) + added + content.substring(end);
      cursorPos = start + added.length;
    }

    onChange(result);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const previewOnly = activeTab === 'preview';
  const editOnly = activeTab === 'edit';

  return (
    <div className="border border-[#ECD8D9] dark:border-[#2A2020] rounded-xl overflow-hidden bg-white dark:bg-[#141012] shadow-sm">
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#ECD8D9] dark:border-[#2A2020] bg-[#FDF7F6] dark:bg-[#1A1516] flex-wrap">
        {/* 移动端 Tab 切换 */}
        <div className="flex md:hidden mr-2 bg-[#F4EAE8] dark:bg-[#231D1E] rounded-lg p-0.5">
          {(['edit', 'split', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-[#2A2020] text-[#DA583F] shadow-sm'
                  : 'text-[#767693] dark:text-[#8A8688]'
              }`}
            >
              {tab === 'edit' ? '编辑' : tab === 'split' ? '分屏' : '预览'}
            </button>
          ))}
        </div>

        {/* 格式化按钮 */}
        {TOOLBAR_ACTIONS.map((btn, i) => (
          <button
            key={i}
            onClick={() => handleToolbarAction(btn.action)}
            title={btn.label}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-[#4F4F4F] dark:text-[#B8B4B0] hover:bg-[#F4EAE8] dark:hover:bg-[#231D1E] hover:text-[#DA583F] transition-all"
          >
            {btn.icon}
          </button>
        ))}

        <div className="w-px h-5 bg-[#ECD8D9] dark:bg-[#2A2020] mx-1" />

        {/* Markdown 语法参考按钮 */}
        <button
          onClick={() => setShowCheatsheet(!showCheatsheet)}
          title="Markdown 语法参考"
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all ${
            showCheatsheet
              ? 'bg-[#DA583F] text-white'
              : 'text-[#4F4F4F] dark:text-[#B8B4B0] hover:bg-[#F4EAE8] dark:hover:bg-[#231D1E] hover:text-[#DA583F]'
          }`}
        >
          ?
        </button>

        {/* 桌面端 Tab 切换 */}
        <div className="hidden md:flex ml-auto bg-[#F4EAE8] dark:bg-[#231D1E] rounded-lg p-0.5">
          {([
            { key: 'edit' as const, label: '编辑' },
            { key: 'split' as const, label: '分屏' },
            { key: 'preview' as const, label: '预览' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-[#2A2020] text-[#DA583F] shadow-sm'
                  : 'text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 编辑区域 */}
      <div className={`flex ${previewOnly ? 'hidden' : ''} ${editOnly ? '' : 'md:border-r md:border-[#ECD8D9] dark:md:border-[#2A2020]'} ${editOnly || activeTab === 'split' ? 'min-h-[500px]' : ''}`}>
        {/* 编辑区 */}
        {(!previewOnly) && (
          <div className={`${activeTab === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="px-4 py-2 bg-[#FDF7F6] dark:bg-[#1A1516] border-b border-[#ECD8D9] dark:border-[#2A2020]">
              <span className="text-xs text-[#767693] dark:text-[#8A8688] font-medium">Markdown</span>
            </div>
            <textarea
              data-markdown-editor
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="在这里写 Markdown…&#10;&#10;支持：标题、加粗、**粗体**、*斜体*、> 引用、```代码块```、[链接](url)、![图片](url)"
              className="w-full flex-1 min-h-[460px] p-4 resize-none outline-none font-mono text-[14px] leading-[1.8] text-[#313131] dark:text-[#E8E4E1] placeholder-[#B8B4B0] bg-transparent"
              style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
            />
          </div>
        )}

        {/* 预览区 */}
        {(!editOnly) && (
          <div className={`${activeTab === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <div className="px-4 py-2 bg-[#FDF7F6] dark:bg-[#1A1516] border-b border-[#ECD8D9] dark:border-[#2A2020]">
              <span className="text-xs text-[#767693] dark:text-[#8A8688] font-medium">预览</span>
            </div>
            <div className="flex-1 min-h-[460px] p-4 overflow-y-auto markdown-preview">
              {content.trim() ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-[#313131] dark:text-[#E8E4E1] mb-4 mt-6 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-[#313131] dark:text-[#E8E4E1] mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-[#313131] dark:text-[#E8E4E1] mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-[#4F4F4F] dark:text-[#B8B4B0] leading-relaxed mb-3">{children}</p>,
                    a: ({ href, children }) => <a href={href} className="text-[#DA583F] hover:underline" target="_blank" rel="noreferrer">{children}</a>,
                    strong: ({ children }) => <strong className="font-semibold text-[#313131] dark:text-[#E8E4E1]">{children}</strong>,
                    em: ({ children }) => <em className="text-[#4F4F4F] dark:text-[#B8B4B0]">{children}</em>,
                    code: ({ children }) => <code className="text-[#DA583F] bg-[#FDF7F6] dark:bg-[#1A1516] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                    pre: ({ children }) => <pre className="bg-[#1A1516] dark:bg-[#0F0D0E] rounded-lg p-4 overflow-x-auto mb-3 text-sm">{children}</pre>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-[#DA583F] pl-4 py-1 my-3 text-[#767693] dark:text-[#8A8688] italic">{children}</blockquote>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-3 text-[#4F4F4F] dark:text-[#B8B4B0]">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 text-[#4F4F4F] dark:text-[#B8B4B0]">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-lg shadow-sm my-3 max-w-full" />,
                    hr: () => <hr className="border-[#ECD8D9] dark:border-[#2A2020] my-4" />,
                    table: ({ children }) => <table className="border border-[#ECD8D9] dark:border-[#2A2020] rounded-lg overflow-hidden my-3 w-full">{children}</table>,
                    thead: ({ children }) => <thead className="bg-[#FDF7F6] dark:bg-[#1A1516]">{children}</thead>,
                    th: ({ children }) => <th className="px-3 py-2 text-left text-sm font-semibold text-[#313131] dark:text-[#E8E4E1] border-b border-[#ECD8D9] dark:border-[#2A2020]">{children}</th>,
                    td: ({ children }) => <td className="px-3 py-2 text-sm border-t border-[#ECD8D9] dark:border-[#2A2020] text-[#4F4F4F] dark:text-[#B8B4B0]">{children}</td>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-[#B8B4B0] italic">在左侧输入 Markdown，这里会实时预览…</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Markdown 语法参考面板 */}
      {showCheatsheet && (
        <div className="border-t border-[#ECD8D9] dark:border-[#2A2020] bg-[#FDF9F8] dark:bg-[#110E0F] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#313131] dark:text-[#E8E4E1]">Markdown 语法速查</h4>
            <button
              onClick={() => setShowCheatsheet(false)}
              className="text-xs text-[#767693] dark:text-[#8A8688] hover:text-[#DA583F] transition-colors"
            >
              ✕ 收起
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            {[
              { syntax: '# 标题1', desc: '一级标题' },
              { syntax: '## 标题2', desc: '二级标题' },
              { syntax: '### 标题3', desc: '三级标题' },
              { syntax: '**粗体**', desc: '加粗文字' },
              { syntax: '*斜体*', desc: '斜体文字' },
              { syntax: '~~删除~~', desc: '删除线' },
              { syntax: '> 引用', desc: '引用块' },
              { syntax: '- 项目', desc: '无序列表' },
              { syntax: '1. 项目', desc: '有序列表' },
              { syntax: '[文字](url)', desc: '链接' },
              { syntax: '![描述](url)', desc: '图片' },
              { syntax: '`行内代码`', desc: '行内代码' },
              { syntax: '```\n代码块\n```', desc: '代码块' },
              { syntax: '---', desc: '分割线' },
              { syntax: '| 表头 |', desc: '表格' },
              { syntax: '[ ] 任务', desc: '任务列表' },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => {
                  onChange(content + '\n' + item.syntax + '\n');
                }}
                className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1A1516] border border-[#ECD8D9] dark:border-[#2A2020] hover:border-[#DA583F] hover:bg-[#FDF7F6] dark:hover:bg-[#1A1516] cursor-pointer transition-all group"
              >
                <code className="text-[#DA583F] text-xs whitespace-nowrap font-mono group-hover:text-[#C43F30]">{item.syntax}</code>
                <span className="text-[#767693] dark:text-[#8A8688] text-xs">{item.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-white dark:bg-[#1A1516] rounded-lg border border-[#ECD8D9] dark:border-[#2A2020]">
            <span className="text-xs text-[#767693] dark:text-[#8A8688]">表格示例：</span>
            <pre className="mt-1 text-xs text-[#4F4F4F] dark:text-[#B8B4B0] font-mono whitespace-pre-wrap">{"| 左对齐 | 居中 | 右对齐 |\n| :--- | :---: | ---: |\n| 内容 | 内容 | 内容 |"}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
