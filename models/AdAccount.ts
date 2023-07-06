import { EAccountType, EBillingType, ECurrency, EStatus } from './enums';

export interface AdAccountCreateDTO {
  advertiser: string; //Name of the Advertiser
  currency: ECurrency;
  billing_type: EBillingType;
  billing_center_id: string;
  name: string;
  organization_id: string;
  test?: boolean; //Indicates Ad Account is a test ad account, test ad accounts can never serve live ads
  timezone: string;
  type: EAccountType;
  lifetime_spend_cap_micro?: number;
  paying_advertiser_name?: string;
  agency_representing_client: boolean;
  client_paying_invoices: boolean;
  status: EStatus;

  // For assigning payment methods
  funding_source_ids?: string[]; // Array of Funding Source IDs
  funding_source_type?: 'LINE_OF_CREDIT' | 'CREDIT_CARD' | 'COUPON' | 'PAYPAL';
}

export interface AdAccountDTO extends AdAccountCreateDTO {
  id: string;
  updated_at?: string;
  created_at?: string;
  delivery_status?: string;
}
