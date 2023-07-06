import _ from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getHeaders } from '@libs/headers';
import { AdSquadCreateDTO } from '@models/AdSquad';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { campaign_id } = req.query;

  const token = await getToken({ req });
  if (!token || typeof campaign_id !== 'string') {
    return res.status(403);
  }

  if (req.method === 'POST') {
    const {
      bid_strategy,
      billing_event,
      delivery_constraint,
      name,
      status,
      optimization_goal,
      targeting,
      type,
      bid_micro,
      child_ad_type,
      daily_budget_micro,
      end_time,
      placement_v2,
      start_time,
      auto_bid,
      target_bid,
      ad_account_id,
    } = req.body as AdSquadCreateDTO;

    try {
      const headers = getHeaders(token);
      const pixelRequestOptions = { method: 'GET', headers };
      const pixelResponse = await fetch(
        `https://adsapi.snapchat.com/v1/adaccounts/${ad_account_id}/pixels`,
        pixelRequestOptions as any,
      );
      const pixelResult = await pixelResponse.json();
      const pixel_id = _.get(pixelResult, 'pixels[0].pixel.id', null);

      let newSquad: AdSquadCreateDTO = {
        bid_strategy,
        daily_budget_micro,
        name,
        status,
        campaign_id,
        type,
        targeting,
        billing_event,
        bid_micro,
        auto_bid,
        target_bid,
        start_time,
        end_time,
        optimization_goal,
        placement_v2,
        child_ad_type,
        delivery_constraint,
      };

      if (pixel_id) {
        newSquad = { ...newSquad, pixel_id };
      }

      const body = JSON.stringify({ adsquads: [newSquad] });
      const requestOptions = { method: 'POST', headers, body, redirect: 'follow' };
      const response = await fetch(
        `https://adsapi.snapchat.com/v1/campaigns/${campaign_id}/adsquads`,
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
