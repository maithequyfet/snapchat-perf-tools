import React from 'react';
const { DateTime } = require('luxon');
import { CampaignDTO } from '@models/Campaign';

interface Props {
  modalID: string;
  campaigns: CampaignDTO[];
  loading: boolean;
}
const CampaignModal = ({ modalID, campaigns, loading }: Props) => {
  return (
    <React.Fragment>
      <input type="checkbox" id={modalID} className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Campaigns (total: {campaigns.length})</h3>
          <div className="pt-4">
            {loading ? (
              'Loading...'
            ) : (
              <table className="table table-compact w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Start time</th>
                    <th>End time</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <th>{campaign.name}</th>
                      <th>{campaign.status}</th>
                      <th>{campaign.start_time ? DateTime.fromISO(campaign.start_time).toFormat('ff') : ''}</th>
                      <th>{campaign.end_time ? DateTime.fromISO(campaign.end_time).toFormat('ff') : ''}</th>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="modal-action">
            <label htmlFor={modalID} className="btn">
              Close
            </label>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default CampaignModal;
