import { useEffect } from 'react';
import { getPublishedArticles } from '../storage/articleStore';
import { getExcerpt } from '../utils/helpers';

export default function RssFeedPage() {
  useEffect(() => {
    const generate = async () => {
      const articles = await getPublishedArticles();
      const siteUrl = 'https://www.x2ya.com';
      const siteTitle = '玄牙个人世界 — x2ya.com';
      const siteDesc = '医学是主干，但枝叶蔓延至多个领域——精神医学、积极心理治疗、国学玄学、芳香疗法、写作随笔等多领域探索。';
      const now = new Date().toISOString();

      const items = articles
        .filter(a => a.status === 'published')
        .map(a => `
    <entry>
      <title type="html"><![CDATA[${a.title}]]></title>
      <id>${siteUrl}/article/${a.id}</id>
      <link href="${siteUrl}/article/${a.id}" rel="alternate" type="text/html" />
      <published>${new Date(a.createdAt).toISOString()}</published>
      <updated>${new Date(a.updatedAt).toISOString()}</updated>
      <author><name>玄牙</name></author>
      <summary type="html"><![CDATA[${getExcerpt(a.content, 200)}]]></summary>
      <content type="html"><![CDATA[${a.content}]]></content>
      ${a.tags && a.tags.length > 0 ? a.tags.map(t => `      <category term="${t}" />`).join('\n') : ''}
    </entry>`).join('');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="zh-CN">
  <title>${siteTitle}</title>
  <subtitle>${siteDesc}</subtitle>
  <link href="${siteUrl}/rss.xml" rel="self" type="application/atom+xml" />
  <link href="${siteUrl}" rel="alternate" type="text/html" />
  <id>${siteUrl}</id>
  <updated>${now}</updated>
  <author><name>玄牙</name></author>
  ${items}
</feed>`;

      // 替换整个页面为 XML
      document.open();
      document.write(xml);
      document.close();
    };

    generate();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0E1A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
    </div>
  );
}
