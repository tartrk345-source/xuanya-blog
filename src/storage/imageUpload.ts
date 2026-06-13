import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'blog-images';

/**
 * 上传图片到 Supabase Storage
 * @param file 图片文件
 * @returns 上传后的公开 URL
 */
export async function uploadImage(file: File): Promise<string> {
  // 限制文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('图片大小不能超过 5MB');
  }

  // 限制文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('仅支持 JPG、PNG、GIF、WebP、SVG 格式');
  }

  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '31536000',  // 1年缓存
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('[Supabase Storage] 上传失败', error);
    throw new Error('图片上传失败');
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return data.publicUrl;
}
