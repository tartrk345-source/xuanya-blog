import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white min-h-[480px]">
      {/* 左侧：编辑区 */}
      <div className="w-1/2 border-r border-gray-200">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Markdown</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="在这里写 Markdown…"
          className="w-full h-full min-h-[440px] p-4 resize-none outline-none font-mono text-[15px] leading-relaxed text-gray-800 placeholder-gray-300 bg-transparent"
        />
      </div>

      {/* 右侧：预览区 */}
      <div className="w-1/2">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">预览</span>
        </div>
        <div className="p-4 prose-container min-h-[440px] overflow-y-auto">
          {content.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-300 text-base italic">预览将在此显示…</p>
          )}
        </div>
      </div>
    </div>
  );
}
