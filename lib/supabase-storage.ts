import { createClient } from '@supabase/supabase-js';

export const DONOR_PHOTOS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'fotos-doadores';

export function getSupabaseStorageAdmin() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error('Supabase Storage não configurado.');
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseObjectUrl(path: string) {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error('Supabase Storage não configurado.');
  return `${url}/storage/v1/object/${DONOR_PHOTOS_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function isSupabaseObjectUrl(url: string | null | undefined) {
  return Boolean(url && process.env.SUPABASE_URL && url.startsWith(`${process.env.SUPABASE_URL}/storage/v1/object/`));
}

export async function downloadDonorPhoto(path: string) {
  const { data, error } = await getSupabaseStorageAdmin().storage.from(DONOR_PHOTOS_BUCKET).download(path);
  if (error || !data) return null;
  return data;
}
