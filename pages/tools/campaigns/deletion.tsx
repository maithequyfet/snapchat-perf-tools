import _, { get } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Column } from 'react-table';
import PromisePool from '@supercharge/promise-pool';
import Layout from '@components/Layout';
import AccessDenied from '@components/AccessDenied';
import { AdAccountDTO } from '@models/AdAccount';
import useTable from '@hooks/useTable';
import { CampaignDTO } from '@models/Campaign';
import CampaignModal from '@components/CampaignModal';

interface AdAccountWithAction extends AdAccountDTO {
  _status: 'text-neutral-400' | 'text-neutral-800' | 'text-red-500' | 'text-emerald-500';
  _statusMessage: string;
}

interface CampaignWithAction extends CampaignDTO {
  _status: 'text-neutral-400' | 'text-neutral-800' | 'text-red-500' | 'text-emerald-500';
  _statusMessage: string;
}

export default function CampaignPage() {
  const { data: session } = useSession();
  const [synchronously, setSynchronously] = useState<'sync' | 'async'>('sync');
  const [parallel, setParallel] = useState<number>(1);
  const [sleep, setSleep] = useState(1);
  const [isLoading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdAccountWithAction[]>([]);
  const [campaigns, setCampaigns] = useState<{ [key: string]: CampaignWithAction[] }>({});
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [isCampaignLoading, setIsCampaignLoading] = useState(false);

  const [organizationID, setOrganizationID] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [viewCampaignCtx, setViewCampaignCtx] = useState<{
    loading: boolean;
    ad_account_id: string | null;
    campaigns: CampaignDTO[];
    modalID: string;
  }>({
    loading: false,
    ad_account_id: null,
    campaigns: [],
    modalID: 'view-campaign-modal',
  });

  useEffect(() => {
    if (session) {
      setLoading(true);
      fetch(`/api/organizations`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then((data) => {
          const orgs = _.get(data, 'organizations', []);
          setOrganizations(orgs.map(({ organization }: any) => organization));
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          console.error(error.message);
        });
    }
  }, [session]);

  useEffect(() => {
    setIsAccountLoading(true);
    if (organizationID) {
      fetch(`/api/organizations/${organizationID}/adaccounts`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then((data) => {
          setAccounts(data.adaccounts.map(({ adaccount }: any) => adaccount));
          setIsAccountLoading(false);
        })
        .catch((error) => {
          setIsAccountLoading(false);
          console.error(error.message);
        });
    }
  }, [organizationID]);

  useEffect(() => {
    if (viewCampaignCtx.ad_account_id) {
      setViewCampaignCtx((pre) => ({ ...pre, loading: true }));

      fetch(`/api/adaccounts/${viewCampaignCtx.ad_account_id}/campaigns`)
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then((data) => {
          const campaigns = data.campaigns.map(({ campaign }: any) => campaign as CampaignDTO);
          setViewCampaignCtx((pre) => ({ ...pre, campaigns, loading: false }));
        })
        .catch((error) => {
          setViewCampaignCtx((pre) => ({ ...pre, campaigns: [], loading: false }));
        });
    }
  }, [viewCampaignCtx.ad_account_id]);

  async function onSleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms * 1000));
  }

  const deleteCampaign = useCallback(async (ad_account_id: string, campaign_id: string): Promise<void> => {
    const options = { method: 'DELETE', headers: { 'Content-Type': 'application/json' } };
    const response = await fetch(`/api/campaigns/${campaign_id}`, options);
    const result = await response.json();
    const status = _.get(result, 'request_status', 'failed');

    if (status === 'SUCCESS') {
      setCampaigns((pre) => ({
        ...pre,
        [ad_account_id]: pre[ad_account_id].filter((cam) => cam.id !== campaign_id),
      }));
    }
  }, []);

  const onViewCampaign = (ad_account_id: string): void => {
    setViewCampaignCtx((pre) => ({ ...pre, ad_account_id }));
  };

  const onSelectOrg = (event: any) => {
    setOrganizationID(event.target.value);
  };

  const accountColumns: Column<AdAccountWithAction>[] = useMemo(
    () => [
      { Header: 'Account Name', accessor: 'name', sortType: 'basic' },
      { Header: 'Ad Account ID', accessor: 'id', sortType: 'basic' },
      { Header: 'Account Type', accessor: 'type', sortType: 'basic' },
      {
        Header: 'Account Status',
        accessor: 'status',
        sortType: 'basic',
        Cell: ({ value }) => (
          <div className={`badge badge-outline ${value === 'ACTIVE' ? 'badge-success' : ''}`}>{value}</div>
        ),
      },
      {
        Header: 'Campaigns',
        Cell: ({ row: { original } }: { row: { original: AdAccountWithAction } }) => {
          return (
            <label
              htmlFor="view-campaign-modal"
              className="btn btn-ghost btn-xs"
              onClick={() => onViewCampaign(original.id)}
            >
              View
            </label>
          );
        },
      },
    ],
    [],
  );

  const campaignColumns: Column<CampaignWithAction>[] = useMemo(
    () => [
      { Header: 'Name', accessor: 'name', sortType: 'basic' },
      {
        Header: 'Ad Account ID',
        accessor: 'ad_account_id',
        sortType: 'basic',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => (
          <div className={`badge badge-outline ${value === 'ACTIVE' ? 'badge-success' : ''}`}>{value}</div>
        ),
      },
      {
        Header: 'Actions',
        accessor: '_statusMessage',
        Cell: ({ value, row }) => <p className={`w-full ${row.original._status}`}>{value}</p>,
      },
    ],
    [],
  );

  const { renderTable: renderAccountTable, selectedFlatRows: selectedAccountFlatRows } = useTable({
    columns: accountColumns,
    data: accounts,
    sortBy: [{ desc: true, id: 'name' }],
  });

  const campaignList = useMemo(() => Object.values(campaigns).flat(), [campaigns]);

  const { renderTable: renderCampaignTable, selectedFlatRows: selectedCampaignFlatRows } = useTable({
    columns: campaignColumns,
    data: campaignList,
    sortBy: [{ desc: true, id: 'ad_account_id' }],
  });

  const getAllCampaigns = useCallback(async () => {
    setIsCampaignLoading(true);
    setCampaigns({});
    const selectedAccountIDs = selectedAccountFlatRows.map((row: AdAccountDTO) => row.id);
    await PromisePool.withConcurrency(10)
      .for(selectedAccountIDs)
      .onTaskFinished((user, pool) => {
        const percent = pool.processedPercentage();
        if (percent === 100) {
          setIsCampaignLoading(false);
        }
      })
      .process(async (ad_account_id: any) => {
        fetch(`/api/adaccounts/${ad_account_id}/campaigns`)
          .then((response) => {
            if (response.status === 200) {
              return response.json();
            }
            throw new Error(response.statusText);
          })
          .then((data) => {
            setCampaigns((pre) => {
              return {
                ...pre,
                [ad_account_id]: data.campaigns.map(
                  ({ campaign }: any) =>
                    ({
                      ...campaign,
                      _status: 'text-neutral-400',
                      _statusMessage: '<No action>',
                    } as CampaignWithAction),
                ),
              };
            });
          })
          .catch((error) => {
            console.warn(`[getAllCampaigns]:`, error);
          });
      });
  }, [selectedAccountFlatRows]);

  const onDeleteSelectedCampaigns = useCallback(async () => {
    if (synchronously === 'sync') {
      for await (const campaign of selectedCampaignFlatRows) {
        const { ad_account_id, id } = campaign;
        await deleteCampaign(ad_account_id, id);
        await onSleep(sleep);
      }
    } else {
      await PromisePool.withConcurrency(parallel)
        .for(campaignList)
        .process(async (campaign: CampaignDTO) => {
          const { ad_account_id, id } = campaign;
          await deleteCampaign(ad_account_id, id);
          await onSleep(sleep);
        });
    }
  }, [campaignList, deleteCampaign, parallel, selectedCampaignFlatRows, sleep, synchronously]);

  const onSyncChange = (event: any) => {
    setSynchronously(event.target.value);
  };

  const onBatchChange = (event: any) => {
    setParallel(Number(event.target.value));
  };

  const onSleepChange = (event: any) => {
    setSleep(Number(event.target.value));
  };

  const disabledGetCampaigns = useMemo(
    () => isCampaignLoading || selectedAccountFlatRows.length === 0,
    [selectedAccountFlatRows, isCampaignLoading],
  );
  const disabledDeleteCampaigns = useMemo(() => selectedCampaignFlatRows.length === 0, [selectedCampaignFlatRows]);

  const selectedOrgName = useMemo(() => {
    const selectOrg: any = organizations.find((org: any) => org.id === organizationID);
    return selectOrg?.name || '';
  }, [organizationID, organizations]);

  if (!session) {
    return (
      <Layout>
        <AccessDenied />
      </Layout>
    );
  }

  const ConfigSection = (
    <div className="bg-gray-300 p-4 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2">
          <span className="label label-text">Delete multiple campaigns</span>
          <select value={synchronously as any} onChange={onSyncChange} className="select select-sm">
            <option value="sync">sequentially</option>
            <option value="async">parallel</option>
          </select>
        </label>
        {synchronously === 'async' && (
          <label className="cursor-pointer flex items-center gap-2 justify-left select-none">
            <span className="label-text">Processes</span>
            <input type="number" value={parallel} onChange={onBatchChange} className="input input-bordered input-sm" />
            <span className="label-text">items in parallel.</span>
          </label>
        )}
        <label className="cursor-pointer flex items-center gap-2 justify-left select-none">
          <span className="label-text">Sleep</span>
          <input type="number" value={sleep} onChange={onSleepChange} className="input input-bordered input-sm" />
          <span className="label-text">seconds for each request.</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      <Layout>
        <div className="flex border border-base-300 rounded-box items-center justify-between gap-4 p-4 m-4">
          <div className="text-xl">
            <span>CAMPAIGN DELETION / </span>
            <span>
              {isLoading
                ? 'Loading...'
                : organizationID
                ? `Org ${selectedOrgName} has ${accounts.length} accounts.`
                : 'Please select your organization'}
            </span>
          </div>
          <select
            value={organizationID}
            onChange={onSelectOrg}
            disabled={organizations.length === 0}
            className="select select-bordered w-full max-w-xs"
          >
            <option value="">Select organization</option>
            {organizations.map((organization: any) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </div>
        <div tabIndex={0} className="collapse collapse-arrow border border-base-300 rounded-box m-4">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title text-xl font-medium">Configuration</div>
          <div className="collapse-content">{ConfigSection}</div>
        </div>
        {organizationID && (
          <>
            <div className="flex flex-col gap-4 m-4">
              <div tabIndex={0} className="collapse collapse-arrow border border-base-300 rounded-box">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title text-xl font-medium">
                  {`Accounts (${selectedAccountFlatRows.length}/${accounts.length})`}
                </div>
                <div className="collapse-content">
                  {isAccountLoading ? <div>Loading...</div> : renderAccountTable()}
                </div>
              </div>
              <div className="flex">
                <button
                  className="btn btn-active btn-primary"
                  onClick={getAllCampaigns}
                  disabled={disabledGetCampaigns}
                >
                  {`Get campaigns of selected accounts`}
                </button>
              </div>
              <div tabIndex={0} className="collapse collapse-arrow border border-base-300 rounded-box">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title text-xl font-medium">
                  Campaigns ({`${selectedCampaignFlatRows.length}/${campaignList.length}`})
                </div>
                <div className="collapse-content">
                  {isCampaignLoading ? <div>Loading...</div> : renderCampaignTable()}
                </div>
              </div>
              <div className="flex">
                <button
                  className="btn btn-active btn-danger"
                  onClick={onDeleteSelectedCampaigns}
                  disabled={disabledDeleteCampaigns}
                >
                  {`Delete selected campaigns`}
                </button>
              </div>
            </div>
          </>
        )}
      </Layout>
      <CampaignModal
        modalID={viewCampaignCtx.modalID}
        campaigns={viewCampaignCtx.campaigns}
        loading={viewCampaignCtx.loading}
      />
    </>
  );
}
