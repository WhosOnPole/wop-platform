import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createStorageHelpers(supabase: SupabaseClient<Database>): {
  uploadFile: (bucket: string, path: string, file: File) => Promise<{ data: any; error: any }>;
  downloadFile: (bucket: string, path: string) => Promise<{ data: Blob | null; error: any }>;
  deleteFile: (bucket: string, path: string) => Promise<{ data: any; error: any }>;
  getPublicUrl: (bucket: string, path: string) => string;
  listFiles: (bucket: string, path?: string) => Promise<{ data: any; error: any }>;
} {
  return {
    async uploadFile(bucket: string, path: string, file: File) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);
      return { data, error };
    },

    async downloadFile(bucket: string, path: string) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);
      return { data, error };
    },

    async deleteFile(bucket: string, path: string) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      return { data, error };
    },

    getPublicUrl(bucket: string, path: string) {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      return data.publicUrl;
    },

    async listFiles(bucket: string, path?: string) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);
      return { data, error };
    },
  };
}
