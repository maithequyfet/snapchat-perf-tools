import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Column } from 'react-table';
import PromisePool from '@supercharge/promise-pool';
import Layout from '@components/Layout';
import AccessDenied from '@components/AccessDenied';
import { AdAccountDTO } from '@models/AdAccount';
import useTable from '@hooks/useTable';
import { CampaignDTO, CampaignCreateDTO } from '@models/Campaign';
import CampaignModal from '@components/CampaignModal';
import { AdSquadCreateDTO, AdSquadDTO, AdTargeting } from '@models/AdSquad';
import { CreativeDTO } from '@models/Creative';
import { AdsCreateDTO, AdsDTO } from '@models/Ads';
import {
  ChildAdType,
  EAdSquadType,
  EAdType,
  EBidStrategy,
  EDeliveryConstraint,
  EObjective,
  EOptimizationGoal,
  EStatus,
} from '@models/enums';

interface AdAccountWithAction extends AdAccountDTO {
  _status: 'text-neutral-400' | 'text-neutral-800' | 'text-red-500' | 'text-emerald-500';
  _statusMessage: string;
}

const MILLION = 1_000_000;
const minAgeOptions = Array.from({ length: 35 - 13 + 1 }, (_, i) => i + 13);
const maxAgeOptions = Array.from({ length: 49 - 13 + 1 }, (_, i) => i + 13);

export default function CampaignPage() {
  const { data: session } = useSession();
  const [synchronously, setSynchronously] = useState<'sync' | 'async'>('sync');
  const [parallel, setParallel] = useState<number>(5);
  const [sleep, setSleep] = useState(1);
  const [isLoading, setLoading] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdAccountWithAction[]>([]);
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
          setAccounts(
            data.adaccounts.map(
              ({ adaccount }: any) =>
                ({
                  ...adaccount,
                  _status: 'text-neutral-400',
                  _statusMessage: '<No action>',
                } as AdAccountWithAction),
            ),
          );
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

  const onViewCampaign = (ad_account_id: string): void => {
    setViewCampaignCtx((pre) => ({ ...pre, ad_account_id }));
  };

  const onSelectOrg = (event: any) => {
    setOrganizationID(event.target.value);
  };

  const columns: Column<AdAccountWithAction>[] = useMemo(
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
      {
        Header: 'Actions',
        accessor: '_statusMessage',
        Cell: ({ value, row }) => <p className={`w-full ${row.original._status}`}>{value}</p>,
      },
    ],
    [],
  );

  const { renderTable, selectedFlatRows } = useTable({
    columns,
    data: accounts,
    sortBy: [{ desc: true, id: 'name' }],
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const ad_account_ids = selectedFlatRows.map((account: AdAccountDTO) => account.id);

    // Campaign data
    const campaign_name: string = event.target.campaign_name.value;
    const campaign_objective: EObjective = event.target.campaign_objective.value;
    const campaign_status: EStatus = event.target.campaign_status.value;
    const campaign_start_time = event.target.campaign_start_time.value
      ? new Date(event.target.campaign_start_time.value).toISOString()
      : undefined;
    const campaign_end_time = event.target.campaign_end_time.value
      ? new Date(event.target.campaign_end_time.value).toISOString()
      : undefined;
    const campaign_daily_budget_micro = event.target.campaign_daily_budget_micro.value
      ? Number(event.target.campaign_daily_budget_micro.value) * MILLION
      : undefined;
    const campaign_lifetime_spend_cap_micro = event.target.campaign_lifetime_spend_cap_micro.value
      ? Number(event.target.campaign_lifetime_spend_cap_micro.value) * MILLION
      : undefined;

    // Ad Squad data
    const ad_squad_name: string = event.target.ad_squad_name.value;
    const ad_squad_status: EStatus = event.target.ad_squad_status.value;
    const ad_squad_child_type: ChildAdType = event.target.ad_squad_child_type.value;
    const ad_squad_daily_budget_micro = event.target.ad_squad_daily_budget_micro.value
      ? Number(event.target.ad_squad_daily_budget_micro.value) * MILLION
      : undefined;
    const ad_squad_delivery_constraint: EDeliveryConstraint = event.target.ad_squad_delivery_constraint.value;
    const ad_squad_start_time = event.target.ad_squad_start_time.value
      ? new Date(event.target.ad_squad_start_time.value).toISOString()
      : undefined;
    const ad_squad_end_time = event.target.ad_squad_end_time.value
      ? new Date(event.target.ad_squad_end_time.value).toISOString()
      : undefined;
    const ad_squad_age_min_age: number = event.target.ad_squad_age_min_age.value;
    const ad_squad_age_max_age: number = event.target.ad_squad_age_max_age.value;
    const ad_squad_gender: 'MALE' | 'FEMALE' | 'ALL' = event.target.ad_squad_gender.value;
    const ad_squad_os_type: 'iOS' | 'Android' | 'ALL' = event.target.ad_squad_os_type.value;
    const ad_squad_connection_type: 'CELL' | 'WIFI' | 'ALL' = event.target.ad_squad_connection_type.value;
    const ad_squad_placement_v2 = { config: 'AUTOMATIC' };

    const ad_squad_type = EAdSquadType.SNAP_ADS;
    const ad_squad_auto_bid = true;
    const ad_squad_target_bid = false;
    const ad_squad_bid_strategy = EBidStrategy.AUTO_BID;
    const ad_squad_billing_event = 'IMPRESSION';
    const ad_squad_child_ad_type = ad_squad_child_type;
    const ad_squad_optimization_goal = EOptimizationGoal.SWIPES;
    // TOD: Validate the form inputs
    if (ad_account_ids.length === 0) {
      return;
    }

    const targeting: AdTargeting = {
      demographics: [{ min_age: ad_squad_age_min_age }],
      devices: [{}],
      geos: [{ country_code: 'us' }],
    };

    if (ad_squad_gender !== 'ALL') {
      targeting.demographics[0].gender = ad_squad_gender;
    }

    if (ad_squad_age_max_age < 50) {
      targeting.demographics[0].max_age = ad_squad_age_max_age;
    }

    if (ad_squad_os_type !== 'ALL') {
      targeting.devices[0].os_type = ad_squad_os_type;
    }
    if (ad_squad_connection_type !== 'ALL') {
      targeting.devices[0].connection_type = ad_squad_connection_type;
    }

    const campaignPayload: CampaignCreateDTO = {
      ad_account_id: '',
      name: campaign_name,
      objective: campaign_objective,
      status: campaign_status,
      daily_budget_micro: campaign_daily_budget_micro,
      end_time: campaign_end_time,
      lifetime_spend_cap_micro: campaign_lifetime_spend_cap_micro,
      start_time: campaign_start_time,
    };

    const adSquadPayload: AdSquadCreateDTO = {
      campaign_id: '',
      ad_account_id: '',
      name: ad_squad_name,
      status: ad_squad_status,
      start_time: ad_squad_start_time,
      end_time: ad_squad_end_time,
      type: ad_squad_type,
      bid_strategy: ad_squad_bid_strategy,
      billing_event: ad_squad_billing_event,
      auto_bid: ad_squad_auto_bid,
      target_bid: ad_squad_target_bid,
      child_ad_type: ad_squad_child_ad_type,
      optimization_goal: ad_squad_optimization_goal,
      delivery_constraint: ad_squad_delivery_constraint,
      daily_budget_micro: ad_squad_daily_budget_micro,
      placement_v2: ad_squad_placement_v2,
      targeting,
    };

    if (synchronously === 'sync') {
      for await (const ad_account_id of ad_account_ids) {
        await createCampaign({ ...campaignPayload, ad_account_id }, { ...adSquadPayload, ad_account_id });
        await onSleep(sleep);
      }
    } else {
      await PromisePool.withConcurrency(parallel)
        .for(ad_account_ids)
        .process(async (ad_account_id: any) => {
          await createCampaign({ ...campaignPayload, ad_account_id }, { ...adSquadPayload, ad_account_id });
          await onSleep(sleep);
        });
    }
  };

  const deleteCampaign = useCallback(async (ad_account_id: string, campaign_id: string): Promise<void> => {
    const options = { method: 'DELETE', headers: { 'Content-Type': 'application/json' } };
    const response = await fetch(`/api/campaigns/${campaign_id}`, options);
    const result = await response.json();
    const status = _.get(result, 'request_status', 'failed');

    setAccounts((pre) =>
      pre.map((preAccount) => {
        if (preAccount.id !== ad_account_id) {
          return preAccount;
        }
        return {
          ...preAccount,
          _status: 'text-red-500',
          _statusMessage: `${preAccount._statusMessage} => ${
            status !== 'success' ? 'Campaign has been deleted' : 'Campaign delete failed'
          }`,
        };
      }),
    );
  }, []);

  const deleteAdSquad = useCallback(async (ad_account_id: string, ad_squad_id: string): Promise<void> => {
    const options = { method: 'DELETE', headers: { 'Content-Type': 'application/json' } };
    const response = await fetch(`/api/adsquads/${ad_squad_id}`, options);
    const result = await response.json();
    const status = _.get(result, 'request_status', 'failed');

    setAccounts((pre) =>
      pre.map((preAccount) => {
        if (preAccount.id !== ad_account_id) {
          return preAccount;
        }
        return {
          ...preAccount,
          _status: 'text-red-500',
          _statusMessage: `${preAccount._statusMessage} => ${
            status !== 'success' ? 'Ad squad has been deleted' : 'Ad Squad delete failed'
          }`,
        };
      }),
    );
  }, []);

  const getCreatives = useCallback(
    async (ad_account_id: string, ad_squad_id: string, campaign_id: string): Promise<void> => {
      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-neutral-800',
            _statusMessage: 'Getting the creatives...',
          };
        }),
      );

      const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
      const response = await fetch(`/api/adaccounts/${ad_account_id}/creatives`, options);
      const result = await response.json();

      const creatives: CreativeDTO[] = _.get(result, 'creatives', [])
        .map((creativeRes: any) => _.get(creativeRes, 'creative'))
        .filter((creative: CreativeDTO | null) => creative?.id)
        .sort((a: CreativeDTO, b: CreativeDTO) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (creatives.length) {
        await createAd(ad_squad_id, creatives[0]);
      } else {
        const _statusMessage = _.get(result, 'creatives[0].sub_request_error_reason') || 'No creative to create ads';
        setAccounts((pre) =>
          pre.map((preAccount) => {
            if (preAccount.id !== ad_account_id) {
              return preAccount;
            }
            return {
              ...preAccount,
              _status: 'text-red-500',
              _statusMessage,
            };
          }),
        );

        await deleteAdSquad(ad_account_id, ad_squad_id);
        await deleteCampaign(ad_account_id, campaign_id);
      }
    },
    [deleteAdSquad, deleteCampaign],
  );

  async function onSleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms * 1000));
  }

  const createAdSquad = useCallback(
    async (ad_account_id: string, payload: AdSquadCreateDTO): Promise<void> => {
      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-neutral-800',
            _statusMessage: 'Creating new ad squad...',
          };
        }),
      );

      const JSONdata = JSON.stringify(payload);
      const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSONdata };
      const response = await fetch(`/api/campaigns/${payload.campaign_id}/adsquads`, options);
      const result = await response.json();

      const newAdSquad: AdSquadDTO = _.get(result, 'adsquads[0].adsquad', null);
      if (newAdSquad) {
        await getCreatives(ad_account_id, newAdSquad?.id, payload.campaign_id);
      } else {
        const _statusMessage = _.get(result, 'adsquads[0].sub_request_error_reason') || 'Create ad squad failed';

        setAccounts((pre) =>
          pre.map((preAccount) => {
            if (preAccount.id !== ad_account_id) {
              return preAccount;
            }
            return {
              ...preAccount,
              _status: 'text-red-500',
              _statusMessage,
            };
          }),
        );

        await deleteCampaign(ad_account_id, payload.campaign_id);
      }
    },
    [deleteCampaign, getCreatives],
  );

  const createCampaign = useCallback(
    async (campaignPayload: CampaignCreateDTO, adSquadPayload: AdSquadCreateDTO): Promise<void> => {
      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== campaignPayload.ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-neutral-800',
            _statusMessage: 'Creating new campaign...',
          };
        }),
      );

      const JSONdata = JSON.stringify(campaignPayload);
      const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSONdata };
      const response = await fetch(`/api/adaccounts/${campaignPayload.ad_account_id}/campaigns`, options);
      const result = await response.json();
      const createdCampaign = _.get(result, 'campaigns[0].campaign', null);

      if (createdCampaign?.id) {
        await createAdSquad(campaignPayload.ad_account_id, { ...adSquadPayload, campaign_id: createdCampaign.id });
      } else {
        const _statusMessage = _.get(result, 'campaigns[0].sub_request_error_reason') || 'Create campaign failed';

        setAccounts((pre) =>
          pre.map((preAccount) => {
            if (preAccount.id !== campaignPayload.ad_account_id) {
              return preAccount;
            }
            return {
              ...preAccount,
              _status: 'text-red-500',
              _statusMessage,
            };
          }),
        );
      }
    },
    [createAdSquad],
  );

  const createAd = async (ad_squad_id: string, creative: CreativeDTO): Promise<void> => {
    setAccounts((pre) =>
      pre.map((preAccount) => {
        if (preAccount.id !== creative.ad_account_id) {
          return preAccount;
        }
        return {
          ...preAccount,
          _status: 'text-neutral-800',
          _statusMessage: 'Creating new ads...',
        };
      }),
    );

    const payload: AdsCreateDTO = {
      ad_squad_id,
      creative_id: creative.id,
      name: creative.headline,
      status: EStatus.ACTIVE,
      type: EAdType.REMOTE_WEBPAGE,
    };

    const JSONdata = JSON.stringify(payload);
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSONdata };
    const response = await fetch(`/api/adsquads/${ad_squad_id}/ads`, options);
    const result = await response.json();
    const createdAd: AdsDTO | null = _.get(result, 'ads[0].ad', null);

    if (createdAd) {
      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== creative.ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-emerald-500',
            _statusMessage: 'Campaign + Ad Squad + Ads has been created',
          };
        }),
      );
    } else {
      const _statusMessage = _.get(result, 'ads[0].sub_request_error_reason') || 'Create campaign failed';
      setAccounts((pre) =>
        pre.map((preAccount) => {
          if (preAccount.id !== creative.ad_account_id) {
            return preAccount;
          }
          return {
            ...preAccount,
            _status: 'text-red-500',
            _statusMessage,
          };
        }),
      );
    }
  };

  const onSyncChange = (event: any) => {
    setSynchronously(event.target.value);
  };

  const onBatchChange = (event: any) => {
    setParallel(Number(event.target.value));
  };

  const onSleepChange = (event: any) => {
    setSleep(Number(event.target.value));
  };

  const disabledSubmit = useMemo(() => selectedFlatRows.length === 0, [selectedFlatRows]);

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
          <span className="label label-text">Create multiple campaigns</span>
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

  const CampaignSection = (
    <div className="bg-gray-300 gap-2 p-4 rounded-lg">
      <p className="text-2xl">Campaign Details</p>
      <span className="label label-text">Name (Required)</span>
      <input type="text" id="campaign_name" placeholder="Name" className="input input-bordered input-sm w-full" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="label label-text">Objective (Required)</span>
          <select className="select select-bordered select-sm" id="campaign_objective">
            <option value="WEB_CONVERSION">WEB CONVERSION</option>
            <option value="BRAND_AWARENESS">BRAND AWARENESS</option>
            <option value="VIDEO_VIEW">VIDEO VIEW</option>
          </select>
        </div>
        <div className="flex flex-col">
          <span className="label label-text">Status (Required)</span>
          <select className="select select-bordered select-sm" id="campaign_status">
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <span className="label label-text">Start time (Required)</span>
          <input type="datetime-local" id="campaign_start_time" className="input input-bordered input-sm w-full" />
        </div>
        <div className="flex-1">
          <span className="label label-text">End time (Optional)</span>
          <input type="datetime-local" id="campaign_end_time" className="input input-bordered input-sm w-full" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <span className="label label-text">Daily Spend Cap (Optional)</span>
          <input
            type="number"
            id="campaign_daily_budget_micro"
            placeholder="No cap"
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="flex-1">
          <span className="label label-text">Lifetime Spend Cap (Optional)</span>
          <input
            type="number"
            id="campaign_lifetime_spend_cap_micro"
            placeholder="No cap"
            className="input input-bordered input-sm w-full"
          />
        </div>
      </div>
    </div>
  );

  const AdSquadSection = (
    <div className="bg-gray-300 gap-2 p-4 rounded-lg">
      <p className="text-2xl">Ad Set Details</p>
      <span className="label label-text">Ad Set Name (Required)</span>
      <input
        type="text"
        id="ad_squad_name"
        placeholder="Ad Set Name"
        className="input input-bordered input-sm w-full"
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="label label-text">Status (Required)</span>
          <select className="select select-bordered select-sm" id="ad_squad_status">
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
          </select>
        </div>
        <div className="flex flex-col">
          <span className="label label-text">Ad Type (Required)</span>
          <select className="select select-bordered select-sm" id="ad_squad_child_type">
            <option value="SNAP_AD">SNAP AD</option>
            <option value="REMOTE_WEBPAGE">REMOTE WEBPAGE</option>
            <option value="DEEP_LINK">DEEP LINK</option>
          </select>
        </div>
      </div>

      <p className="text-1xl pt-4">Budget & Schedule</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex-1">
          <span className="label label-text">Daily Budget Micro (Required)</span>
          <input
            type="number"
            id="ad_squad_daily_budget_micro"
            placeholder="No cap"
            className="input input-bordered input-sm w-full"
            defaultValue={500}
          />
        </div>
        <div className="flex flex-col">
          <span className="label label-text">Delivery constraint (Required)</span>
          <select className="select select-bordered select-sm" id="ad_squad_delivery_constraint">
            <option value="DAILY_BUDGET">DAILY BUDGET</option>
            <option disabled value="LIFETIME_BUDGET">
              LIFETIME BUDGET
            </option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <span className="label label-text">Start time (Required)</span>
          <input type="datetime-local" id="ad_squad_start_time" className="input input-bordered input-sm w-full" />
        </div>
        <div className="flex-1">
          <span className="label label-text">End time (Optional)</span>
          <input type="datetime-local" id="ad_squad_end_time" className="input input-bordered input-sm w-full" />
        </div>
      </div>

      <p className="text-1xl pt-4 pb-2">Demographics</p>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <span className="label label-text">Ages (Required)</span>
          <div className="flex items-center w-full">
            <select className="select select-bordered select-sm" id="ad_squad_age_min_age">
              {minAgeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <div className="divider-horizontal">to</div>
            <select className="select select-bordered select-sm" id="ad_squad_age_max_age">
              <option value={50}>{`50+`}</option>
              {maxAgeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <span className="label label-text">Genders (Required)</span>
          <select className="select select-bordered select-sm" id="ad_squad_gender">
            <option value="ALL">ALL</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
        </div>
      </div>

      <p className="text-1xl pt-4 pb-2">Demographics</p>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col">
          <span className="label label-text">Operating Systems (Required)</span>
          <select className="select select-bordered select-sm" id="ad_squad_os_type">
            <option value="ALL">ALL</option>
            <option value="iOS">iOS</option>
            <option value="Android">Android</option>
          </select>
        </div>
        <div className="flex flex-1 flex-col">
          <span className="label label-text">Operating Systems (Required)</span>
          <select className="select select-bordered select-sm" id="ad_squad_connection_type">
            <option value="ALL">ALL</option>
            <option value="CELL">CELL</option>
            <option value="WIFI">WIFI</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Layout>
        <div className="flex border border-base-300 rounded-box items-center justify-between gap-4 p-4 m-4">
          <div className="text-xl">
            <span>CAMPAIGN CREATION / </span>
            {isLoading
              ? 'Loading...'
              : organizationID
              ? `Org ${selectedOrgName} has ${accounts.length} accounts.`
              : 'Please select your organization'}
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
        {organizationID?.length > 0 && (
          <form noValidate className="form-control flex flex-col gap-4 m-4" onSubmit={handleSubmit}>
            <div tabIndex={0} className="collapse collapse-arrow border border-base-300 rounded-box">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title text-xl font-medium">Campaign & Ad Form</div>
              <div className="collapse-content">
                <div className="grid grid-cols-2 gap-4">
                  {CampaignSection}
                  {AdSquadSection}
                </div>
              </div>
            </div>

            <div tabIndex={0} className="collapse collapse-arrow border border-base-300 rounded-box">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title text-xl font-medium">
                Ad accounts ({selectedFlatRows.length}/{accounts.length} selected)
              </div>
              <div className="collapse-content">
                {isAccountLoading ? <div className="text-2xl p-4">Loading ad accounts...</div> : renderTable()}
              </div>
            </div>

            <div className="flex">
              <button className="btn btn-active btn-primary" type="submit" disabled={disabledSubmit}>
                {`Create campaigns for selected accounts`}
              </button>
            </div>
          </form>
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
