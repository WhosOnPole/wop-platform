export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      driver_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_comment_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_comment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          driver_id: string
          id: string
          is_hidden_from_profile: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          driver_id: string
          id?: string
          is_hidden_from_profile?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          driver_id?: string
          id?: string
          is_hidden_from_profile?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_comments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_fan_points: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          last_decay_applied: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          last_decay_applied?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          last_decay_applied?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          bio: string | null
          country: string
          created_at: string
          headshot_url: string | null
          id: string
          name: string
          number: number | null
          quote: string | null
          quote_author: string | null
          search_vector: unknown | null
          short_bio: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          country: string
          created_at?: string
          headshot_url?: string | null
          id?: string
          name: string
          number?: number | null
          quote?: string | null
          quote_author?: string | null
          search_vector?: unknown | null
          short_bio?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          country?: string
          created_at?: string
          headshot_url?: string | null
          id?: string
          name?: string
          number?: number | null
          quote?: string | null
          quote_author?: string | null
          search_vector?: unknown | null
          short_bio?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "predefined_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_point_activities: {
        Row: {
          activity_reference_id: string | null
          activity_type: string
          created_at: string
          driver_id: string
          id: string
          metadata: Json | null
          points_awarded: number
          user_id: string
        }
        Insert: {
          activity_reference_id?: string | null
          activity_type: string
          created_at?: string
          driver_id: string
          id?: string
          metadata?: Json | null
          points_awarded: number
          user_id: string
        }
        Update: {
          activity_reference_id?: string | null
          activity_type?: string
          created_at?: string
          driver_id?: string
          id?: string
          metadata?: Json | null
          points_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      fan_post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          fan_post_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          fan_post_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          fan_post_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fan_post_drivers: {
        Row: {
          created_at: string
          driver_id: string
          fan_post_id: string
          id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          fan_post_id: string
          id?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          fan_post_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fan_post_drivers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fan_post_drivers_fan_post_id_fkey"
            columns: ["fan_post_id"]
            isOneToOne: false
            referencedRelation: "fan_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_post_likes: {
        Row: {
          created_at: string
          fan_post_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fan_post_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fan_post_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      fan_posts: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_spotlight: boolean
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_spotlight?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_spotlight?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_entities: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean
          position: number
          tag: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean
          position: number
          tag: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          position?: number
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      grid_likes: {
        Row: {
          created_at: string
          grid_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grid_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grid_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      grids: {
        Row: {
          created_at: string
          id: string
          items: Json
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          label: string
          metadata: Json | null
          poll_id: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          label: string
          metadata?: Json | null
          poll_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: string
          label?: string
          metadata?: Json | null
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      predefined_tags: {
        Row: {
          category: string
          color_class: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          color_class: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          color_class?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          favorite_driver: string | null
          favorite_driver_id: string | null
          favorite_team: string | null
          favorite_team_id: string | null
          favorite_track_ids: Json | null
          id: string
          region: string | null
          setup_completed: boolean | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_driver?: string | null
          favorite_driver_id?: string | null
          favorite_team?: string | null
          favorite_team_id?: string | null
          favorite_track_ids?: Json | null
          id?: string
          region?: string | null
          setup_completed?: boolean | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_driver?: string | null
          favorite_driver_id?: string | null
          favorite_team?: string | null
          favorite_team_id?: string | null
          favorite_track_ids?: Json | null
          id?: string
          region?: string | null
          setup_completed?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_driver_id_fkey"
            columns: ["favorite_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_comment_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_comment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_hidden_from_profile: boolean | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_hidden_from_profile?: boolean | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_hidden_from_profile?: boolean | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      team_principal_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_principal_comment_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_comment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_principal_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_hidden_from_profile: boolean | null
          status: string
          team_principal_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_hidden_from_profile?: boolean | null
          status?: string
          team_principal_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_hidden_from_profile?: boolean | null
          status?: string
          team_principal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_principal_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      team_principals: {
        Row: {
          bio: string | null
          country: string
          created_at: string
          id: string
          name: string
          photo_url: string | null
          quote: string | null
          quote_author: string | null
          search_vector: unknown | null
          team_id: string | null
          updated_at: string
          years_with_team: number | null
        }
        Insert: {
          bio?: string | null
          country: string
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          quote?: string | null
          quote_author?: string | null
          search_vector?: unknown | null
          team_id?: string | null
          updated_at?: string
          years_with_team?: number | null
        }
        Update: {
          bio?: string | null
          country?: string
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          quote?: string | null
          quote_author?: string | null
          search_vector?: unknown | null
          team_id?: string | null
          updated_at?: string
          years_with_team?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_principals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          bio: string | null
          championship_standing: number | null
          country: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          quote: string | null
          quote_author: string | null
          search_vector: unknown | null
          short_bio: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          championship_standing?: number | null
          country: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          quote?: string | null
          quote_author?: string | null
          search_vector?: unknown | null
          short_bio?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          championship_standing?: number | null
          country?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          quote?: string | null
          quote_author?: string | null
          search_vector?: unknown | null
          short_bio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      track_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      track_comment_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_comment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      track_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_hidden_from_profile: boolean | null
          status: string
          track_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_hidden_from_profile?: boolean | null
          status?: string
          track_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_hidden_from_profile?: boolean | null
          status?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tracks: {
        Row: {
          country: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          length_km: number | null
          name: string
          quote: string | null
          quote_author: string | null
          search_vector: unknown | null
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          length_km?: number | null
          name: string
          quote?: string | null
          quote_author?: string | null
          search_vector?: unknown | null
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          length_km?: number | null
          name?: string
          quote?: string | null
          quote_author?: string | null
          search_vector?: unknown | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_grid_ranking_points: {
        Args: { grid_position: number }
        Returns: number
      }
      create_notification: {
        Args: {
          notification_kind: string
          notification_payload?: Json
          target_user_id: string
        }
        Returns: string
      }
      get_driver_comment_like_count: {
        Args: { target_comment_id: string }
        Returns: number
      }
      get_driver_fan_growth: {
        Args: { driver_uuid: string }
        Returns: {
          growth_percentage: number
          previous_fans: number
          recent_fans: number
        }[]
      }
      get_driver_regions_with_fans: {
        Args: { target_driver_id: string }
        Returns: {
          fan_count: number
          region: string
          top_fan_points: number
        }[]
      }
      get_fan_post_comment_count: {
        Args: { target_post_id: string }
        Returns: number
      }
      get_fan_post_like_count: {
        Args: { target_post_id: string }
        Returns: number
      }
      get_follow_counts: {
        Args: { user_uuid: string }
        Returns: {
          follower_count: number
          following_count: number
        }[]
      }
      get_grid_like_count: {
        Args: { target_grid_id: string }
        Returns: number
      }
      get_qualifying_entities: {
        Args: { limit_count?: number }
        Returns: {
          additional_info: string
          comment_count: number
          country: string
          entity_type: string
          fan_count: number
          grid_count: number
          id: string
          image_url: string
          name: string
          tags: Json
          trending_score: number
        }[]
      }
      get_regional_fan_leaders: {
        Args: { target_user_id: string }
        Returns: {
          driver_id: string
          driver_name: string
          is_tied: boolean
          region: string
          total_points: number
        }[]
      }
      get_regional_top_fans_for_driver: {
        Args: {
          limit_count?: number
          target_driver_id: string
          target_region: string
        }
        Returns: {
          avatar_url: string
          display_name: string
          rank_position: number
          region: string
          total_points: number
          user_id: string
          username: string
        }[]
      }
      get_team_comment_like_count: {
        Args: { target_comment_id: string }
        Returns: number
      }
      get_team_principal_comment_like_count: {
        Args: { target_comment_id: string }
        Returns: number
      }
      get_top_fans_for_driver: {
        Args: { limit_count?: number; target_driver_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          rank_position: number
          region: string
          total_points: number
          user_id: string
          username: string
        }[]
      }
      get_track_comment_like_count: {
        Args: { target_comment_id: string }
        Returns: number
      }
      get_trending_drivers: {
        Args: { limit_count?: number }
        Returns: {
          avg_stars: number
          country: string
          fan_count: number
          headshot_url: string
          id: string
          name: string
          number: number
          recent_grids: number
          team_name: string
          trending_score: number
        }[]
      }
      get_unread_notification_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_regional_rank_for_driver: {
        Args: { target_driver_id: string; target_user_id: string }
        Returns: {
          rank_position: number
          region: string
          total_points: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      remove_spotlight_post: {
        Args: { post_id: string }
        Returns: undefined
      }
      search_all: {
        Args: { search_query: string }
        Returns: {
          additional_info: string
          country: string
          id: string
          name: string
          rank: number
          type: string
        }[]
      }
      set_spotlight_post: {
        Args: { post_id: string }
        Returns: undefined
      }
      update_driver_fan_points: {
        Args: {
          activity_metadata?: Json
          activity_ref_id?: string
          activity_type: string
          points_to_add: number
          target_driver_id: string
          target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
