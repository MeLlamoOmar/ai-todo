export type Integration = {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
};

export type CreatedIntegration = Integration & { token: string };

// Internal RPC result. The HTTP adapter removes status before responding.
export type IntegrationResult = {
  status: number;
  code?: string;
  message?: string;
  retry_after?: number;
  transaction_id?: string;
  duplicate?: boolean;
};
