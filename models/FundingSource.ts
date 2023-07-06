export interface FundingSource {
  id: string;
  updated_at: string;
  created_at: string;
  type: 'LINE_OF_CREDIT' | 'CREDIT_CARD' | 'COUPON' | 'PAYPAL';
  card_type: 'AMEX' | 'DINERS_CLUB' | 'DISCOVER' | 'JCB' | 'MAESTRO' | 'MASTERCARD' | 'VISA' | 'UNKNOWN';
  name: string;
  last_4: string;
  expiration_month: string;
  expiration_year: string;
  daily_spend_limit_micro: 25000000;
  daily_spend_currency: 'USD' | 'CAD' | 'GBP' | 'AUD' | 'EUR';
}

export interface AssignPaymentMethodDTO {
  exclusive: boolean;
  type: 'LINE_OF_CREDIT' | 'CREDIT_CARD' | 'COUPON' | 'PAYPAL';
}
