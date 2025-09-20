import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createRpcHelpers(supabase: SupabaseClient<Database>) {
  return {
    async callRpc<T = any>(functionName: keyof Database['public']['Functions'], args?: any) {
      const { data, error } = await supabase.rpc(functionName, args);
      return { data, error } as { data: T | null; error: any };
    },

    // Common RPC functions for the platform
    async getTrendingDrivers(limit = 10) {
      return this.callRpc('get_trending_drivers', {
        limit_count: limit,
      });
    },

    async searchAll(query: string) {
      return this.callRpc('search_all', {
        search_query: query,
      });
    },

    async getQualifyingEntities(limit = 10) {
      return this.callRpc('get_qualifying_entities', {
        limit_count: limit,
      });
    },

    async getTopFansForDriver(driverId: string, limit = 10) {
      return this.callRpc('get_top_fans_for_driver', {
        target_driver_id: driverId,
        limit_count: limit,
      });
    },
  };
}
