'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import './UserPage.scss';

type ExtendedUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  provider?: string | null;
  userUid?: string | null;
  userId?: string | null;
};

type DbUser = {
  userUid: string;
  username?: string;
  email?: string;
  avatar?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null;
  status?: string;
  gender?: string | null;
  language?: string | null;
  timeZone?: string | null;
  residentId?: string | null;
  created_at?: string | null;
  last_login?: string | null;
};

// type for accountData
type AccountDataType = {
  userUid: string;
  account_balance: number;
  margin_limit: number;
  margin_used: number;
  interest_rate: number;
  created_at: string;
  last_updated: string;
  status: string;
};

type AccountSectionProps = {
  data: AccountDataType | null;
  loading: boolean;
  error: string | null;
};

const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—';

const formatPercent = (value?: number) =>
  typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '—';

const AccountSection = ({ data, loading, error }: AccountSectionProps) => {
  const accountFields = [
    { label: 'Account Balance', value: formatCurrency(data?.account_balance) },
    { label: 'Margin Limit', value: formatCurrency(data?.margin_limit) },
    { label: 'Margin Used', value: formatCurrency(data?.margin_used) },
    {
      label: 'Available Margin',
      value:
        data && typeof data.margin_limit === 'number' && typeof data.margin_used === 'number'
          ? formatCurrency(data.margin_limit - data.margin_used)
          : '—',
    },
    { label: 'Interest Rate', value: formatPercent(data?.interest_rate) },
    { label: 'Status', value: data?.status ?? 'pending' },
  ];

  const metaRows = [
    { label: 'Account UID', value: data?.userUid ?? '—' },
    { label: 'Created', value: data?.created_at ? new Date(data.created_at).toLocaleString() : '—' },
    { label: 'Last Updated', value: data?.last_updated ? new Date(data.last_updated).toLocaleString() : '—' },
  ];
  return (
    <section className="user-account-section">
      <header className="user-account-header">
        <div>
          <p className="user-account-label">Account Data</p>
          <h3>{data ? 'Margin Account' : 'No account linked'}</h3>
        </div>
        <span className={`user-status-pill user-status-pill--${data?.status ?? 'pending'}`}>
          {data?.status ?? 'pending'}
        </span>
      </header>

      {loading && <p className="user-hint">Loading account details…</p>}
      {error && <p className="user-error">{error}</p>}

      <div className="account-grid">
        {accountFields.map((field) => (
          <div className="account-field" key={field.label}>
            <label>{field.label}</label>
            <p>{field.value}</p>
          </div>
        ))}
      </div>

      <div className="account-meta">
        {metaRows.map((meta) => (
          <div key={meta.label}>
            <p className="account-meta__label">{meta.label}</p>
            <p className="account-meta__value">{meta.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const UserPage = () => {
  const { data: session, status } = useSession();

  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [accountData, setAccountData] = useState<AccountDataType | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;

    const fetchUserProfile = async () => {
      try {
        setDbLoading(true);
        const res = await fetch('/api/users', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Failed to fetch user profile: ${res.status}`);
        }
        const data = await res.json();
        if (active) {
          setDbUser(data.user);
          setDbError(null);
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setDbError('Unable to load profile data.');
        }
      } finally {
        if (active) {
          setDbLoading(false);
        }
      }
    };

    const fetchAccountData = async () => {
      try {
        setAccountLoading(true);
        const res = await fetch('/api/account', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Failed to fetch account data: ${res.status}`);
        }
        const data = await res.json();
        if (active) {
          setAccountData(data.account);
          setAccountError(null);
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setAccountError('Unable to load account data.');
        }
      } finally {
        if (active) {
          setAccountLoading(false);
        }
      }
    };

    fetchUserProfile();
    fetchAccountData();

    return () => {
      active = false;
    };
  }, [status]);

  const sessionProfile = useMemo(() => {
    const extended = session?.user as ExtendedUser | undefined;
    const name = extended?.name ?? 'Guest User';
    return {
      name,
      firstName: name.split(' ')[0] ?? name,
      email: extended?.email ?? '—',
      image:
        extended?.image ??
        'https://placehold.co/96x96/2563eb/ffffff?text=U',
      provider: extended?.provider ?? 'N/A',
      userUid: extended?.userUid ?? 'Not assigned',
      userId: extended?.userId ?? '—',
      status: 'Pending',
    };
  }, [session]);

  const profile = useMemo(() => {
    return {
      ...sessionProfile,
      name: dbUser?.username ?? sessionProfile.name,
      firstName: dbUser?.first_name ?? sessionProfile.firstName,
      email: dbUser?.email ?? sessionProfile.email,
      image: dbUser?.avatar ?? sessionProfile.image,
      userUid: dbUser?.userUid ?? sessionProfile.userUid,
      status:
        dbUser?.status ?? (status === 'authenticated' ? 'Active' : 'Pending'),
    };
  }, [sessionProfile, dbUser, status]);

  const infoFields = [
    { label: 'Full Name', value: profile.name },
    { label: 'First Name', value: profile.firstName },
    { label: 'Gender', value: dbUser?.gender ?? 'M' },
    { label: 'Status', value: profile.status },
    { label: 'Language', value: dbUser?.language ?? 'English' },
    { label: 'Time Zone', value: dbUser?.timeZone ?? 'UTC+08:00' },
  ];

  return (
    <div className="user-page">
      <div className="user-shell">


        <section className="user-card">
          <div className="user-card__hero" />
          <div className="user-card__body">
            <div className="user-card__profile">
              <img
                className="user-card__avatar"
                src={profile.image}
                alt={profile.name}
              />
              <div>
                <h2>{profile.name}</h2>
                <p>{profile.email}</p>
                <p className="user-card__meta">UID: {profile.userUid}</p>
              </div>
              {/* <button type="button" className="user-card__edit">
                Edit
              </button> */}
            </div>

            {dbLoading && (
              <p className="user-hint">Syncing account data…</p>
            )}
            {dbError && <p className="user-error">{dbError}</p>}

            <div className="user-grid">
              {infoFields.map((field) => (
                <div className="user-field" key={field.label}>
                  <label>{field.label}</label>
                  <div className="user-field__value">{field.value}</div>
                </div>
              ))}
            </div>

            <div className="user-email-card">
              <div>
                <p className="user-email-card__label">Primary email</p>
                <p className="user-email-card__value">{profile.email}</p>
                <p className="user-email-card__meta">
                  Linked via {profile.provider}
                </p>
              </div>
              {/* <button type="button" className="user-email-card__action">
                + Add Email Address
              </button> */}
            </div>
          </div>
        </section>
        <AccountSection data={accountData} loading={accountLoading} error={accountError} />
      </div>
    </div>
  );
};

export default UserPage;