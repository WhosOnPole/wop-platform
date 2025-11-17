// Database types will be generated from Supabase
// For now, we'll define the basic structure

export type AppRole = 'user' | 'admin'
export type GridType = 'driver' | 'team' | 'track'
export type ParentPageType = 'driver' | 'team' | 'track' | 'poll' | 'hot_take' | 'profile'
export type TargetType = 'post' | 'grid' | 'profile' | 'comment'
export type ReportStatus = 'pending' | 'resolved_removed' | 'resolved_ignored'
export type TipStatus = 'pending' | 'approved' | 'rejected'
export type ArticleCategory = 'FEATURE_FAN' | 'FEATURE_WOMEN' | 'FEATURE_INTERVIEW' | 'BEGINNER_GUIDE'
export type ArticleStatus = 'draft' | 'published'

// Placeholder for generated database types
export interface Database {
  public: {
    Tables: Record<string, any>
    Views: Record<string, any>
    Functions: Record<string, any>
  }
}

