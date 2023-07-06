import _ from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getHeaders } from '@libs/headers';
import { AdsCreateDTO } from '@models/Ads';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ad_squad_id } = req.query;

  const token = await getToken({ req });
  if (!token) {
    return res.status(403);
  }

  if (req.method === 'POST') {
    const { creative_id, name, status, type } = req.body as AdsCreateDTO;

    try {
      const headers = getHeaders(token);
      const body = JSON.stringify({
        ads: [{ ad_squad_id, creative_id, name, status, type }],
      });
      const requestOptions = { method: 'POST', headers, body, redirect: 'follow' };
      const response = await fetch(`https://adsapi.snapchat.com/v1/adsquads/${ad_squad_id}/ads`, requestOptions as any);
      const result = await response.json();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json(error);
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
