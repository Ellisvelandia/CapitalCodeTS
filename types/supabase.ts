export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string | null;
};

export type ConversationRow = {
  id: string;
  customer_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  message_metadata: Record<string, unknown> | null;
  created_at: string;
};

export type SiteContentRow = {
  id: string;
  title: string | null;
  keywords: string | null;
  content: string | null;
  embeddings: number[] | null;
  search_vector: unknown | null;
  created_at: string;
};

export type ErrorLogRow = {
  id: string;
  endpoint: string;
  error_code: string;
  message: string;
  customer_id: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: CustomerRow;
        Insert: Omit<CustomerRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CustomerRow, "id" | "created_at">>;
      };
      conversations: {
        Row: ConversationRow;
        Insert: Omit<ConversationRow, "id" | "created_at"> & {
          message_metadata?: Record<string, unknown>;
        };
        Update: Partial<Omit<ConversationRow, "id" | "created_at">>;
      };
      site_content: {
        Row: SiteContentRow;
        Insert: Omit<SiteContentRow, "id" | "created_at" | "search_vector">;
        Update: Partial<Omit<SiteContentRow, "id" | "created_at">>;
      };
      error_logs: {
        Row: ErrorLogRow;
        Insert: Omit<ErrorLogRow, "id" | "created_at">;
        Update: Partial<Omit<ErrorLogRow, "id" | "created_at">>;
      };
    };
    Functions: {
      update_search_vector: {
        Args: Record<string, never>;
        Returns: Trigger;
      };
    };
  };
};
