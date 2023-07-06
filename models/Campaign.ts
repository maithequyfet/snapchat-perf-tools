import { EObjective, EStatus } from './enums';

// https://marketingapi.snapchat.com/docs/#campaigns
export interface CampaignCreateDTO {
  ad_account_id: string;
  daily_budget_micro?: number;
  end_time?: string;
  name: string;
  start_time?: string;
  status: EStatus;
  lifetime_spend_cap_micro?: number;
  objective: EObjective;
}

export interface CampaignDTO extends CampaignCreateDTO {
  id: string;
  updated_at?: string;
  created_at?: string;
  delivery_status?: string;
  deleted?: string;
}
