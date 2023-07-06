import { EAdType } from './enums';

export interface CreativeDTO {
  id: string;
  ad_account_id: string;
  brand_name: string;
  call_to_action?: any;
  headline: string;
  shareable?: boolean;
  name: string;
  top_snap_media_id: string;
  top_snap_crop_position?: string;
  type: EAdType;
  forced_view_eligibility?: 'FULL_DURATION' | 'SIX_SECONDS' | 'NONE';
  preview_creative_id: string;
  playback_type: 'AUTO_ADVANCING' | 'LOOPING';
  ad_product?: string;
  profile_properties?: any;
  created_at: string;
  updated_at: string;
}
