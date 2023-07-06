import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getHeaders } from '@libs/headers';
import { AdAccountCreateDTO } from '@models/AdAccount';
import _ from 'lodash';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { organization_id } = req.query;
  const token = await getToken({ req });
  if (!token) {
    return res.status(403);
  }
  const headers = getHeaders(token);

  if (req.method === 'GET') {
    const requestOptions = {
      method: 'GET',
      headers,
    };

    try {
      const response = await fetch(
        `https://adsapi.snapchat.com/v1/organizations/${organization_id}/adaccounts`,
        requestOptions,
      );
      const result = await response.json();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json(error);
    }
  } else if (req.method === 'POST') {
    const {
      name,
      advertiser,
      agency_representing_client,
      billing_center_id,
      billing_type,
      client_paying_invoices,
      currency,
      organization_id,
      status,
      timezone,
      type,
    } = req.body as AdAccountCreateDTO;

    try {
      let newAccount: AdAccountCreateDTO = {
        name,
        type,
        status,
        advertiser,
        organization_id,
        billing_type,
        billing_center_id,
        currency,
        timezone,
        agency_representing_client,
        client_paying_invoices,
      };

      const body = JSON.stringify({ adaccounts: [newAccount] });
      const requestOptions = { method: 'POST', headers, body, redirect: 'follow' };
      const response = await fetch(
        `https://adsapi.snapchat.com/v1/organizations/${organization_id}/adaccounts`,
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
