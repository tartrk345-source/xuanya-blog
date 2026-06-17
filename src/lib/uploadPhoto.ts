/**
 * Supabase Storage 照片上传
 */
import { supabase } from './supabase';

const BUCKET = 'journal_photos';

/** 上传单张照片到 journal_photos bucket
 *
 * @param file - 要上传的图片文件
 * @param guideSlug - 攻略标识（如 "northwest-2026"）
 * @param dayNumber - 天号（1-14）
 * @returns 公开 URL 或 null
 */
export async function uploadJournalPhoto(
  file: File,
  guideSlug: string,
  dayNumber: number,
): Promise<string | null> {
  // 生成唯一文件名：{slug}/day{num}/{timestamp}_{original}
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${guideSlug}/day${String(dayNumber).padStart(2, '0')}/${timestamp}_${safeName}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000', // 1 年缓存
      upsert: false,
    });

  if (error) {
    console.error('[uploadPhoto] upload failed:', error);
    return null;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data?.path || path);
  return urlData?.publicUrl ?? null;
}

/** 删除已上传的照片 */
export async function deleteJournalPhoto(publicUrl: string): Promise<boolean> {
  // 从 public URL 提取 path
  // 格式: https://xxx.supabase.co/storage/v1/object/public/journal_photos/northwest-2026/day01/xxx.jpg
  const match = publicUrl.match(/\/journal_photos\/(.+?)(\?|$)/);
  if (!match) return false;

  const path = match[1];
  // Storage API 没有直接的 delete on bucket，用 fetch
  // 注意：轻量客户端的 StorageBucket 没有 delete 方法，需要手动 fetch
  const BASE_URL = 'https://twuvrrfzlynhehdxxtid.supabase.co';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dXJyZnpsbnloZWhkeHh0aWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4MTI3ODczNSwiZXhwIjoyMDk2ODU0NzM1fQ.-fPpl84I9IHuT-eAfkMJ6KqLXmeRKO08BDpy1mb7P7o';

  try {
    const res = await fetch(
      `${BASE_URL}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: 'DELETE',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** 批量上传照片 */
export async function uploadJournalPhotos(
  files: File[],
  guideSlug: string,
  dayNumber: number,
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadJournalPhoto(file, guideSlug, dayNumber);
    if (url) urls.push(url);
  }
  return urls;
}
