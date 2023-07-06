import { EAdType, EStatus } from './enums';

export interface AdsCreateDTO {
  ad_squad_id: string;
  creative_id: string;
  name: string;
  paying_advertiser_name?: string;
  status: EStatus;
  type: EAdType;
  lifetime_spend_cap_micro?: number;
}

export interface AdsDTO extends AdsCreateDTO {
  id: string;
  start_time?: string;
  updated_at?: string;
  created_at?: string;
  review_status?: string;
  review_status_reasons?: string;
  delivery_status: string;
  deleted?: boolean;
}
