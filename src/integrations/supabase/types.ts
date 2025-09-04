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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          bio: string | null
          created_at: string
          election_id: string
          full_name: string
          id: string
          image_url: string | null
          jhs_graduation_year: number | null
          jhs_school: string | null
          partylist: string | null
          position_id: string
          shs_graduation_year: number | null
          shs_school: string | null
          why_vote_me: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          election_id: string
          full_name: string
          id?: string
          image_url?: string | null
          jhs_graduation_year?: number | null
          jhs_school?: string | null
          partylist?: string | null
          position_id: string
          shs_graduation_year?: number | null
          shs_school?: string | null
          why_vote_me?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          election_id?: string
          full_name?: string
          id?: string
          image_url?: string | null
          jhs_graduation_year?: number | null
          jhs_school?: string | null
          partylist?: string | null
          position_id?: string
          shs_graduation_year?: number | null
          shs_school?: string | null
          why_vote_me?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["election_id"]
          },
          {
            foreignKeyName: "candidates_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "candidates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      elections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          eligible_voters: string | null
          end_date: string
          id: string
          show_results_to_voters: boolean
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          eligible_voters?: string | null
          end_date: string
          id?: string
          show_results_to_voters?: boolean
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          eligible_voters?: string | null
          end_date?: string
          id?: string
          show_results_to_voters?: boolean
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json | null
          id: string
          link_url: string | null
          message: string
          priority: string
          read_at: string | null
          recipient_user_id: string | null
          target_roles: Database["public"]["Enums"]["user_role"][] | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          link_url?: string | null
          message: string
          priority?: string
          read_at?: string | null
          recipient_user_id?: string | null
          target_roles?: Database["public"]["Enums"]["user_role"][] | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          link_url?: string | null
          message?: string
          priority?: string
          read_at?: string | null
          recipient_user_id?: string | null
          target_roles?: Database["public"]["Enums"]["user_role"][] | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pending_actions: {
        Row: {
          action_data: Json
          action_type: string
          admin_notes: string | null
          created_at: string
          id: string
          requested_at: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_data: Json
          action_type: string
          admin_notes?: string | null
          created_at?: string
          id?: string
          requested_at?: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          admin_notes?: string | null
          created_at?: string
          id?: string
          requested_at?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          description: string | null
          election_id: string
          id: string
          max_candidates: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          election_id: string
          id?: string
          max_candidates?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          election_id?: string
          id?: string
          max_candidates?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["election_id"]
          },
          {
            foreignKeyName: "positions_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_update_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_email: string | null
          current_year_level: string | null
          id: string
          requested_at: string
          requested_email: string | null
          requested_year_level: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_email?: string | null
          current_year_level?: string | null
          id?: string
          requested_at?: string
          requested_email?: string | null
          requested_year_level?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_email?: string | null
          current_year_level?: string | null
          id?: string
          requested_at?: string
          requested_email?: string | null
          requested_year_level?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          course: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          id_image_url: string | null
          registration_status: string | null
          role: Database["public"]["Enums"]["user_role"]
          student_id: string | null
          two_factor_enabled: boolean | null
          two_factor_recovery_codes: string[] | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
          year_level: string | null
        }
        Insert: {
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          id_image_url?: string | null
          registration_status?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_id?: string | null
          two_factor_enabled?: boolean | null
          two_factor_recovery_codes?: string[] | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
          year_level?: string | null
        }
        Update: {
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          id_image_url?: string | null
          registration_status?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          student_id?: string | null
          two_factor_enabled?: boolean | null
          two_factor_recovery_codes?: string[] | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
          year_level?: string | null
        }
        Relationships: []
      }
      step_up_verifications: {
        Row: {
          action_type: string
          created_at: string
          expires_at: string
          id: string
          session_token: string
          user_id: string
          verified_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token: string
          user_id: string
          verified_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vote_receipts: {
        Row: {
          created_at: string
          election_id: string
          election_title: string
          receipt_hash: string
          receipt_id: string
          selected_candidates: Json
          verification_token: string
          voting_date: string
        }
        Insert: {
          created_at?: string
          election_id: string
          election_title: string
          receipt_hash: string
          receipt_id: string
          selected_candidates: Json
          verification_token: string
          voting_date: string
        }
        Update: {
          created_at?: string
          election_id?: string
          election_title?: string
          receipt_hash?: string
          receipt_id?: string
          selected_candidates?: Json
          verification_token?: string
          voting_date?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          candidate_id: string
          created_at: string
          election_id: string
          id: string
          position_id: string
          voter_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          election_id: string
          id?: string
          position_id: string
          voter_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          election_id?: string
          id?: string
          position_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_votes_candidate"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_votes_candidate"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "fk_votes_election"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["election_id"]
          },
          {
            foreignKeyName: "fk_votes_election"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["election_id"]
          },
          {
            foreignKeyName: "votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_sessions: {
        Row: {
          created_at: string
          election_id: string
          expires_at: string
          has_voted: boolean
          id: string
          session_token: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          election_id: string
          expires_at?: string
          has_voted?: boolean
          id?: string
          session_token: string
          voter_id: string
        }
        Update: {
          created_at?: string
          election_id?: string
          expires_at?: string
          has_voted?: boolean
          id?: string
          session_token?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_voting_sessions_election"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["election_id"]
          },
          {
            foreignKeyName: "fk_voting_sessions_election"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voting_sessions_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "election_results"
            referencedColumns: ["election_id"]
          },
          {
            foreignKeyName: "voting_sessions_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      _vote_receipts_storage: {
        Row: {
          created_at: string | null
          election_id: string | null
          election_title: string | null
          receipt_hash: string | null
          receipt_id: string | null
          selected_candidates: Json | null
          verification_token: string | null
          voting_date: string | null
        }
        Insert: {
          created_at?: string | null
          election_id?: string | null
          election_title?: string | null
          receipt_hash?: string | null
          receipt_id?: string | null
          selected_candidates?: Json | null
          verification_token?: string | null
          voting_date?: string | null
        }
        Update: {
          created_at?: string | null
          election_id?: string | null
          election_title?: string | null
          receipt_hash?: string | null
          receipt_id?: string | null
          selected_candidates?: Json | null
          verification_token?: string | null
          voting_date?: string | null
        }
        Relationships: []
      }
      election_results: {
        Row: {
          candidate_id: string | null
          candidate_name: string | null
          election_id: string | null
          election_title: string | null
          position_id: string | null
          position_title: string | null
          vote_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_staff_profile_update: {
        Args: { p_email?: string; p_year_level?: string }
        Returns: Json
      }
      approve_pending_action: {
        Args: { p_action_id: string; p_admin_notes?: string }
        Returns: boolean
      }
      approve_profile_update_request: {
        Args: { p_admin_notes?: string; p_request_id: string }
        Returns: boolean
      }
      approve_user_registration: {
        Args: { p_admin_notes?: string; p_user_id: string }
        Returns: boolean
      }
      auto_update_election_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_user_vote_for_position: {
        Args: { p_position_title: string; p_user_id: string }
        Returns: boolean
      }
      can_user_vote_in_election: {
        Args: { p_election_id: string; p_user_id: string }
        Returns: boolean
      }
      cast_anonymous_vote: {
        Args: {
          p_candidate_id: string
          p_election_id: string
          p_position_id: string
          p_session_token: string
        }
        Returns: boolean
      }
      cast_multiple_anonymous_votes: {
        Args: { p_election_id: string; p_session_token: string; p_votes: Json }
        Returns: boolean
      }
      check_duplicate_user: {
        Args: { p_email: string; p_student_id: string }
        Returns: Json
      }
      check_user_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_step_up_verifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      comprehensive_totp_test: {
        Args: { p_secret_base32: string; p_user_code: string }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_data?: Json
          p_link_url?: string
          p_message: string
          p_priority?: string
          p_recipient_user_id?: string
          p_target_roles?: Database["public"]["Enums"]["user_role"][]
          p_title: string
          p_type: string
        }
        Returns: string
      }
      create_notification_any_role: {
        Args: {
          p_data?: Json
          p_link_url?: string
          p_message: string
          p_priority?: string
          p_recipient_user_id?: string
          p_target_roles?: Database["public"]["Enums"]["user_role"][]
          p_title: string
          p_type: string
        }
        Returns: string
      }
      create_voting_session: {
        Args: { p_election_id: string }
        Returns: string
      }
      create_voting_session_safe: {
        Args: { p_election_id: string }
        Returns: Json
      }
      debug_two_factor_setup: {
        Args: { p_secret: string }
        Returns: Json
      }
      disable_two_factor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      enable_two_factor: {
        Args: { p_backup_codes: string[]; p_secret: string }
        Returns: boolean
      }
      get_all_election_results_optimized: {
        Args: Record<PropertyKey, never>
        Returns: {
          candidate_id: string
          candidate_name: string
          election_id: string
          election_status: string
          election_title: string
          eligible_voters: string
          percentage: number
          position_eligible_voters_count: number
          position_id: string
          position_title: string
          show_results_to_voters: boolean
          total_eligible_voters_count: number
          total_votes_in_position: number
          vote_count: number
        }[]
      }
      get_election_blockchain_proofs: {
       Args: { p_election_id: string }  // function input
       Returns: {
          id: string
          election_id: string | null
          ipfs_cid: string
          results_hash: string
          tx_hash: string
          created_at: string  // ISO timestamp
        }[]
      }
      get_election_results: {
        Args: { p_election_id: string }
        Returns: {
          candidate_id: string
          candidate_name: string
          election_id: string
          election_title: string
          position_id: string
          position_title: string
          vote_count: number
        }[]
      }
      get_election_results_with_stats: {
        Args: { p_election_id: string }
        Returns: {
          candidate_id: string
          candidate_name: string
          election_id: string
          election_status: string
          election_title: string
          eligible_voters: string
          percentage: number
          position_id: string
          position_title: string
          show_results_to_voters: boolean
          total_eligible_voters_count: number
          total_votes_in_position: number
          vote_count: number
        }[]
      }
      get_email_by_student_id: {
        Args: { _student_id: string }
        Returns: string
      }
      get_position_analytics_with_demographics: {
        Args: { p_election_id?: string }
        Returns: {
          course: string
          election_id: string
          election_title: string
          gender: string
          position_id: string
          position_title: string
          total_eligible_voters: number
          unique_voters: number
        }[]
      }
      get_position_eligible_voters: {
        Args: { p_election_eligible_voters: string; p_position_title: string }
        Returns: number
      }
      get_position_voting_analytics: {
        Args: { p_election_id?: string }
        Returns: {
          election_id: string
          election_title: string
          position_id: string
          position_title: string
          total_eligible_voters: number
          unique_voters: number
        }[]
      }
      get_profile_update_requests_with_user_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_notes: string
          course: string
          created_at: string
          current_email: string
          current_year_level: string
          email: string
          full_name: string
          gender: string
          id: string
          id_image_url: string
          registration_status: string
          requested_at: string
          requested_email: string
          requested_year_level: string
          reviewed_at: string
          reviewed_by: string
          status: string
          student_id: string
          updated_at: string
          user_id: string
          year_level: string
        }[]
      }
      get_profiles_with_email_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          course: string
          created_at: string
          email: string
          email_confirmed_at: string
          full_name: string
          gender: string
          id: string
          id_image_url: string
          registration_status: string
          role: Database["public"]["Enums"]["user_role"]
          student_id: string
          two_factor_enabled: boolean
          two_factor_recovery_codes: string[]
          two_factor_secret: string
          updated_at: string
          user_id: string
          year_level: string
        }[]
      }
      get_voting_analytics_by_demographics: {
        Args: { p_election_id?: string }
        Returns: {
          course: string
          election_id: string
          election_title: string
          gender: string
          position_id: string
          position_title: string
          total_course_voters: number
          vote_count: number
          voter_count: number
        }[]
      }
      get_voting_analytics_by_unique_voters: {
        Args: { p_election_id?: string }
        Returns: {
          course: string
          election_id: string
          election_title: string
          gender: string
          total_course_voters: number
          unique_voters: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hotp: {
        Args: { code_secret: string; counter: number }
        Returns: number
      }
      insert_vote_receipt: {
        Args: {
          p_election_id: string
          p_election_title: string
          p_receipt_hash: string
          p_receipt_id: string
          p_selected_candidates: Json
          p_verification_token: string
          p_voting_date: string
        }
        Returns: boolean
      }
      log_audit_action: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_role: Database["public"]["Enums"]["user_role"]
          p_details?: Json
          p_resource_id?: string
          p_resource_type?: string
        }
        Returns: undefined
      }
      log_auth_event: {
        Args:
          | {
              p_action: string
              p_ip_address?: string
              p_user_agent?: string
              p_user_email?: string
              p_user_id: string
              p_user_name?: string
            }
          | {
              p_action: string
              p_user_email?: string
              p_user_id: string
              p_user_name?: string
            }
        Returns: undefined
      }
      log_voter_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      mark_notification_read: {
        Args: { p_id: string }
        Returns: boolean
      }
      notify_election_status_change: {
        Args: { p_election_id: string; p_status: string }
        Returns: undefined
      }
      notify_pending_action_created: {
        Args: { p_action_type: string; p_details?: string }
        Returns: undefined
      }
      notify_profile_update_status: {
        Args: { p_admin_notes?: string; p_request_id: string; p_status: string }
        Returns: undefined
      }
      notify_results_published: {
        Args: { p_election_id: string }
        Returns: undefined
      }
      notify_user_registration_approved: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      notify_user_registration_rejected: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      reject_pending_action: {
        Args: { p_action_id: string; p_admin_notes?: string }
        Returns: boolean
      }
      reject_profile_update_request: {
        Args: { p_admin_notes?: string; p_request_id: string }
        Returns: boolean
      }
      reject_user_registration: {
        Args: { p_admin_notes?: string; p_user_id: string }
        Returns: boolean
      }
      submit_user_appeal: {
        Args: {
          p_new_course: string
          p_new_full_name: string
          p_new_gender: string
          p_new_id_image_url: string
          p_new_student_id: string
          p_new_year_level: string
          p_user_id: string
        }
        Returns: boolean
      }
      test_totp_verification: {
        Args: { p_secret: string; p_test_code: string }
        Returns: Json
      }
      toggle_election_results_visibility: {
        Args: { p_election_id: string; p_show_results: boolean }
        Returns: boolean
      }
      totp: {
        Args: {
          code_secret: string
          digits: number
          period: number
          ts?: string
        }
        Returns: number
      }
      update_current_user_profile: {
        Args: { p_email?: string; p_year_level?: string }
        Returns: boolean
      }
      update_election_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_role: {
        Args: {
          p_admin_notes?: string
          p_new_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: { role_name: string }
        Returns: boolean
      }
      verify_step_up_auth: {
        Args: { p_action_type: string; p_user_id: string }
        Returns: boolean
      }
      verify_two_factor_code: {
        Args: { p_code: string }
        Returns: boolean
      }
      verify_vote_receipt: {
        Args: { p_receipt_id: string; p_verification_token: string }
        Returns: {
          created_at: string
          election_id: string
          election_title: string
          is_valid: boolean
          receipt_id: string
          selected_candidates: Json
          voting_date: string
        }[]
      }
    }
    Enums: {
      user_role: "Voter" | "Staff" | "Administrator"
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
      user_role: ["Voter", "Staff", "Administrator"],
    },
  },
} as const
