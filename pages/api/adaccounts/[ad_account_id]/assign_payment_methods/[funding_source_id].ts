import _ from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getHeaders } from '@libs/headers';
import { AssignPaymentMethodDTO } from '@models/FundingSource';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ad_account_id, funding_source_id } = req.query;
  const token = await getToken({ req });
  if (!token) {
    return res.status(403);
  }

  if (req.method === 'PUT') {
    const { type, exclusive } = req.body as AssignPaymentMethodDTO;
    try {
      const headers = getHeaders(token);
      const body = JSON.stringify({
        ads: [{ type, exclusive }],
      });
      const requestOptions = { method: 'PUT', headers, body, redirect: 'follow' };
      const response = await fetch(
        `https://adsapi.snapchat.com/v1/adaccounts/${ad_account_id}/assign_payment_methods/${funding_source_id}`,
        requestOptions as any,
      );
      const result = await response.json();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json(error);
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
