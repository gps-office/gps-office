export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null;
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          description?: string | null;
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          description?: string | null;
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          case_id: string | null;
          changed_at: string;
          changed_by: string | null;
          changed_fields: string[] | null;
          client_id: string | null;
          id: number;
          new_data: Json | null;
          old_data: Json | null;
          record_id: string | null;
          record_key: string | null;
          table_name: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          case_id?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          changed_fields?: string[] | null;
          client_id?: string | null;
          id?: never;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          record_key?: string | null;
          table_name: string;
        };
        Update: {
          action?: string;
          case_id?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          changed_fields?: string[] | null;
          client_id?: string | null;
          id?: never;
          new_data?: Json | null;
          old_data?: Json | null;
          record_id?: string | null;
          record_key?: string | null;
          table_name?: string;
        };
        Relationships: [];
      };
      case_people: {
        Row: {
          case_id: string;
          client_id: string | null;
          created_at: string;
          date_of_birth: string | null;
          full_name: string;
          hebrew_name: string | null;
          id: string;
          is_main_applicant: boolean;
          nationality: string | null;
          notes: string | null;
          passport_expiry: string | null;
          passport_number: string | null;
          relationship: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          case_id: string;
          client_id?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          full_name: string;
          hebrew_name?: string | null;
          id?: string;
          is_main_applicant?: boolean;
          nationality?: string | null;
          notes?: string | null;
          passport_expiry?: string | null;
          passport_number?: string | null;
          relationship?: string | null;
          updated_at?: string;
        };
        Update: {
          case_id?: string;
          client_id?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          full_name?: string;
          hebrew_name?: string | null;
          id?: string;
          is_main_applicant?: boolean;
          nationality?: string | null;
          notes?: string | null;
          passport_expiry?: string | null;
          passport_number?: string | null;
          relationship?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_people_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "case_balances";
            referencedColumns: ["case_id"];
          },
          {
            foreignKeyName: "case_people_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_people_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      case_reference_counters: {
        Row: {
          last_value: number;
          year: number;
        };
        ComputedFields: never;
        Insert: {
          last_value: number;
          year: number;
        };
        Update: {
          last_value?: number;
          year?: number;
        };
        Relationships: [];
      };
      cases: {
        Row: {
          assigned_to: string | null;
          cipo_complete: boolean;
          client_id: string;
          closed_at: string | null;
          concerns: string | null;
          created_at: string;
          created_by: string | null;
          deadline: string | null;
          id: string;
          key_facts: string | null;
          last_activity_at: string;
          manager_id: string | null;
          next_action: string | null;
          opened_at: string;
          outstanding: string | null;
          priority: Database["public"]["Enums"]["case_priority"];
          ref_consulate: string | null;
          ref_hmpo: string | null;
          ref_home_office: string | null;
          ref_other: string | null;
          ref_uscis: string | null;
          reference: string;
          service_id: string;
          service_level: Database["public"]["Enums"]["service_level"];
          stage: Database["public"]["Enums"]["case_stage"];
          title: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          assigned_to?: string | null;
          cipo_complete?: boolean;
          client_id: string;
          closed_at?: string | null;
          concerns?: string | null;
          created_at?: string;
          created_by?: string | null;
          deadline?: string | null;
          id?: string;
          key_facts?: string | null;
          last_activity_at?: string;
          manager_id?: string | null;
          next_action?: string | null;
          opened_at?: string;
          outstanding?: string | null;
          priority?: Database["public"]["Enums"]["case_priority"];
          ref_consulate?: string | null;
          ref_hmpo?: string | null;
          ref_home_office?: string | null;
          ref_other?: string | null;
          ref_uscis?: string | null;
          reference?: string;
          service_id: string;
          service_level?: Database["public"]["Enums"]["service_level"];
          stage?: Database["public"]["Enums"]["case_stage"];
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          cipo_complete?: boolean;
          client_id?: string;
          closed_at?: string | null;
          concerns?: string | null;
          created_at?: string;
          created_by?: string | null;
          deadline?: string | null;
          id?: string;
          key_facts?: string | null;
          last_activity_at?: string;
          manager_id?: string | null;
          next_action?: string | null;
          opened_at?: string;
          outstanding?: string | null;
          priority?: Database["public"]["Enums"]["case_priority"];
          ref_consulate?: string | null;
          ref_hmpo?: string | null;
          ref_home_office?: string | null;
          ref_other?: string | null;
          ref_uscis?: string | null;
          reference?: string;
          service_id?: string;
          service_level?: Database["public"]["Enums"]["service_level"];
          stage?: Database["public"]["Enums"]["case_stage"];
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cases_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cases_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cases_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cases_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cases_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      cipo_checks: {
        Row: {
          case_id: string;
          checked: boolean;
          checked_at: string | null;
          checked_by: string | null;
          id: string;
          note: string | null;
          step: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          case_id: string;
          checked?: boolean;
          checked_at?: string | null;
          checked_by?: string | null;
          id?: string;
          note?: string | null;
          step: number;
          updated_at?: string;
        };
        Update: {
          case_id?: string;
          checked?: boolean;
          checked_at?: string | null;
          checked_by?: string | null;
          id?: string;
          note?: string | null;
          step?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cipo_checks_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "case_balances";
            referencedColumns: ["case_id"];
          },
          {
            foreignKeyName: "cipo_checks_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cipo_checks_checked_by_fkey";
            columns: ["checked_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      client_links: {
        Row: {
          client_id: string;
          created_at: string;
          id: string;
          notes: string | null;
          related_client_id: string;
          relationship: Database["public"]["Enums"]["relationship_type"];
        };
        ComputedFields: never;
        Insert: {
          client_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          related_client_id: string;
          relationship: Database["public"]["Enums"]["relationship_type"];
        };
        Update: {
          client_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          related_client_id?: string;
          relationship?: Database["public"]["Enums"]["relationship_type"];
        };
        Relationships: [
          {
            foreignKeyName: "client_links_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_links_related_client_id_fkey";
            columns: ["related_client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          address: string | null;
          created_at: string;
          created_by: string | null;
          date_of_birth: string | null;
          email: string | null;
          full_name: string;
          hebrew_name: string | null;
          id: string;
          nationality: string | null;
          notes: string | null;
          passport_expiry: string | null;
          passport_number: string | null;
          phone: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          email?: string | null;
          full_name: string;
          hebrew_name?: string | null;
          id?: string;
          nationality?: string | null;
          notes?: string | null;
          passport_expiry?: string | null;
          passport_number?: string | null;
          phone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          email?: string | null;
          full_name?: string;
          hebrew_name?: string | null;
          id?: string;
          nationality?: string | null;
          notes?: string | null;
          passport_expiry?: string | null;
          passport_number?: string | null;
          phone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      dn_entries: {
        Row: {
          author_id: string | null;
          body: string;
          case_id: string;
          created_at: string;
          entry_type: Database["public"]["Enums"]["dn_type"];
          id: string;
          occurred_at: string;
          pinned: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body: string;
          case_id: string;
          created_at?: string;
          entry_type?: Database["public"]["Enums"]["dn_type"];
          id?: string;
          occurred_at?: string;
          pinned?: boolean;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          case_id?: string;
          created_at?: string;
          entry_type?: Database["public"]["Enums"]["dn_type"];
          id?: string;
          occurred_at?: string;
          pinned?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dn_entries_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dn_entries_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "case_balances";
            referencedColumns: ["case_id"];
          },
          {
            foreignKeyName: "dn_entries_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      document_versions: {
        Row: {
          case_id: string;
          document_id: string;
          file_name: string;
          id: string;
          mime_type: string | null;
          size_bytes: number | null;
          storage_path: string;
          uploaded_at: string;
          uploaded_by: string | null;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          case_id: string;
          document_id: string;
          file_name: string;
          id?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          storage_path: string;
          uploaded_at?: string;
          uploaded_by?: string | null;
          version: number;
        };
        Update: {
          case_id?: string;
          document_id?: string;
          file_name?: string;
          id?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          storage_path?: string;
          uploaded_at?: string;
          uploaded_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_versions_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "case_balances";
            referencedColumns: ["case_id"];
          },
          {
            foreignKeyName: "document_versions_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_versions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          case_id: string;
          category: string;
          checklist_item_id: string | null;
          created_at: string;
          created_by: string | null;
          expires_on: string | null;
          id: string;
          is_original: boolean;
          name: string;
          notes: string | null;
          person_id: string | null;
          received_on: string | null;
          return_shipment_id: string | null;
          returned_on: string | null;
          returned_to_client: boolean;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          case_id: string;
          category?: string;
          checklist_item_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          expires_on?: string | null;
          id?: string;
          is_original?: boolean;
          name: string;
          notes?: string | null;
          person_id?: string | null;
          received_on?: string | null;
          return_shipment_id?: string | null;
          returned_on?: string | null;
          returned_to_client?: boolean;
          updated_at?: string;
        };
        Update: {
          case_id?: string;
          category?: string;
          checklist_item_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          expires_on?: string | null;
          id?: string;
          is_original?: boolean;
          name?: string;
          notes?: string | null;
          person_id?: string | null;
          received_on?: string | null;
          return_shipment_id?: string | null;
          returned_on?: string | null;
          returned_to_client?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "case_balances";
            referencedColumns: ["case_id"];
          },
          {
            foreignKeyName: "documents_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_checklist_item_id_fkey";
            columns: ["checklist_item_id"];
            isOneToOne: false;
            referencedRelation: "service_checklist_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "case_people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_return_shipment_id_fkey";
            columns: ["return_shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          },
        ];
      };
      finance_lines: {
        Row: {
          amount: number;
          case_id: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          description: string | null;
          id: string;
          line_date: string;
          line_type: Database["public"]["Enums"]["finance_type"];
          payment_method: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          case_id: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          line_date?: string;
          line_type: Database["public"]["Enums"]["finance_type"];
          payment_method?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          case_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          line_date?: string;
          line_type?: Database["public"]["Enums"]["finance_type"];
          payment_method?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "finance_lines_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "case_balances";
            referencedColumns: ["case_id"];
          },
          {
            foreignKeyName: "finance_lines_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "finance_lines_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      service_checklist_items: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          id: string;
          label: string;
          required: boolean;
          service_id: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          label: string;
          required?: boolean;
          service_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          label?: string;
          required?: boolean;
          service_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_checklist_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          active: boolean;
          category: string;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          price_premium: number | null;
          price_standard: number | null;
          price_urgent: number | null;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          category?: string;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          price_premium?: number | null;
          price_standard?: number | null;
          price_urgent?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          price_premium?: number | null;
          price_standard?: number | null;
          price_urgent?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      shipments: {
        Row: {
          carrier: string;
          case_id: string;
          created_at: string;
          created_by: string | null;
          delivered_on: string | null;
          direction: Database["public"]["Enums"]["shipment_direction"];
          id: string;
          notes: string | null;
          sent_on: string | null;
          status: Database["public"]["Enums"]["shipment_status"];
          tracking_number: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          carrier: string;
          case_id: string;
          created_at?: string;
          created_by?: string | null;
          delivered_on?: string | null;
          direction: Database["public"]["Enums"]["shipment_direction"];
          id?: string;
          notes?: string | null;
          sent_on?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          tracking_number?: string | null;
          updated_at?: string;
        };
        Update: {
          carrier?: string;
          case_id?: string;
          created_at?: string;
          created_by?: string | null;
          delivered_on?: string | null;
          direction?: Database["public"]["Enums"]["shipment_direction"];
          id?: string;
          notes?: string | null;
          sent_on?: string | null;
          status?: Database["public"]["Enums"]["shipment_status"];
          tracking_number?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipments_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "case_balances";
            referencedColumns: ["case_id"];
          },
          {
            foreignKeyName: "shipments_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shipments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          active: boolean;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["staff_role"];
          specialisms: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["staff_role"];
          specialisms?: string[];
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["staff_role"];
          specialisms?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          case_id: string | null;
          created_at: string;
          created_by: string | null;
          details: string | null;
          done: boolean;
          done_at: string | null;
          done_by: string | null;
          due_date: string | null;
          due_time: string | null;
          id: string;
          task_type: Database["public"]["Enums"]["task_type"];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          assigned_to?: string | null;
          case_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          details?: string | null;
          done?: boolean;
          done_at?: string | null;
          done_by?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          id?: string;
          task_type?: Database["public"]["Enums"]["task_type"];
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          case_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          details?: string | null;
          done?: boolean;
          done_at?: string | null;
          done_by?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          id?: string;
          task_type?: Database["public"]["Enums"]["task_type"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "case_balances";
            referencedColumns: ["case_id"];
          },
          {
            foreignKeyName: "tasks_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_done_by_fkey";
            columns: ["done_by"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      case_balances: {
        Row: {
          balance: number | null;
          case_id: string | null;
          charged: number | null;
          paid: number | null;
          quoted: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      is_active_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      stage_label: { Args: { s: Database["public"]["Enums"]["case_stage"] }; Returns: string };
    };
    Enums: {
      case_priority: "low" | "normal" | "high" | "urgent";
      case_stage:
        | "new_enquiry"
        | "cipo_intake"
        | "documents_outstanding"
        | "application_preparation"
        | "submitted"
        | "approved"
        | "closed";
      dn_type: "note" | "email" | "whatsapp" | "call" | "event" | "concern" | "submission";
      finance_type:
        | "quotation"
        | "invoice"
        | "government_fee"
        | "solicitor_fee"
        | "courier_charge"
        | "deposit"
        | "payment"
        | "refund";
      relationship_type:
        "spouse" | "partner" | "child" | "parent" | "sibling" | "grandparent" | "grandchild" | "other";
      service_level: "standard" | "premium" | "urgent";
      shipment_direction: "from_client" | "to_client" | "to_authority" | "from_authority";
      shipment_status: "pending" | "in_transit" | "delivered" | "returned" | "lost";
      staff_role: "admin" | "staff";
      task_type:
        | "general"
        | "client_reply"
        | "document_chase"
        | "embassy_appointment"
        | "home_office_deadline"
        | "submission"
        | "courier"
        | "payment_follow_up";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      case_priority: ["low", "normal", "high", "urgent"],
      case_stage: [
        "new_enquiry",
        "cipo_intake",
        "documents_outstanding",
        "application_preparation",
        "submitted",
        "approved",
        "closed",
      ],
      dn_type: ["note", "email", "whatsapp", "call", "event", "concern", "submission"],
      finance_type: [
        "quotation",
        "invoice",
        "government_fee",
        "solicitor_fee",
        "courier_charge",
        "deposit",
        "payment",
        "refund",
      ],
      relationship_type: [
        "spouse",
        "partner",
        "child",
        "parent",
        "sibling",
        "grandparent",
        "grandchild",
        "other",
      ],
      service_level: ["standard", "premium", "urgent"],
      shipment_direction: ["from_client", "to_client", "to_authority", "from_authority"],
      shipment_status: ["pending", "in_transit", "delivered", "returned", "lost"],
      staff_role: ["admin", "staff"],
      task_type: [
        "general",
        "client_reply",
        "document_chase",
        "embassy_appointment",
        "home_office_deadline",
        "submission",
        "courier",
        "payment_follow_up",
      ],
    },
  },
} as const;
