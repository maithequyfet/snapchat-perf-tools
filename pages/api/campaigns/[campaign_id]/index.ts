import _ from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getHeaders } from '@libs/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { campaign_id } = req.query;

  const token = await getToken({ req });
  if (!token || typeof campaign_id !== 'string') {
    return res.status(403);
  }

  if (req.method === 'DELETE') {
    try {
      const headers = getHeaders(token);
      const requestOptions = { method: 'DELETE', headers, redirect: 'follow' };
      const response = await fetch(`https://adsapi.snapchat.com/v1/campaigns/${campaign_id}`, requestOptions as any);
      const result = await response.json();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json(error);
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
