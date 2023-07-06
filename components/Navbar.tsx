import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useMemo } from 'react';

interface Link {
  title: string;
  link?: string;
  subLinks?: Link[];
}

const menu: Link[] = [
  {
    title: 'Home',
    link: '/',
  },
  {
    title: 'Ad Accounts',
    link: '/tools/adaccounts',
  },
  {
    title: 'Campaigns',
    subLinks: [
      {
        title: 'Creation',
        link: '/tools/campaigns/creation',
      },
      {
        title: 'Deletion',
        link: '/tools/campaigns/deletion',
      },
    ],
  },
  {
    title: 'Scripts',
    link: '/tools/scripts',
  },
  {
    title: 'Me',
    link: '/tools/me',
  },
];

interface Props {
  theme: 'dark' | 'light';
  onThemeChange: (isDark: boolean) => void;
}

export default function Header({ theme, onThemeChange }: Props) {
  const { data: session } = useSession();

  const onSignIn = (e: any): void => {
    e.preventDefault();
    signIn();
  };

  const onSignOut = (e: any): void => {
    e.preventDefault();
    signOut();
  };

  const renderLinks = useMemo(
    () =>
      menu.map(({ link, title, subLinks }) => {
        if (link) {
          return (
            <li key={link}>
              <Link href={link}>{title}</Link>
            </li>
          );
        }

        if (subLinks?.length) {
          return (
            <li key={title} tabIndex={0}>
              <a className="flex justify-between">
                {title}
                <svg
                  className="fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                </svg>
              </a>
              <ul className="z-10	bg-neutral text-neutral-content">
                {subLinks.map((subLink) => (
                  <li key={subLink.link}>
                    <Link href={subLink.link || ''}>{subLink.title}</Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        }
        return <li key={title}></li>;
      }),
    [],
  );

  return (
    <div className="navbar bg-neutral text-neutral-content">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
            {renderLinks}
          </ul>
        </div>
        <a className="btn btn-ghost normal-case text-xl">Just4tech</a>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">{renderLinks}</ul>
      </div>
      <div className="navbar-end">
        <label className="swap swap-rotate p-2">
          <input
            type="checkbox"
            onChange={(e) => {
              const isDark = e.target.checked;
              onThemeChange(isDark);
            }}
          />
          <svg className="swap-on fill-current w-10 h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
          <svg className="swap-off fill-current w-10 h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>
        {!session && (
          <button className="btn" onClick={onSignIn}>
            Sign in
          </button>
        )}
        {session?.user && (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-active bt-sm normal-case text-md gap-2">
              {session.user.email ?? session.user.name}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 text-neutral rounded-box w-52"
            >
              <li>
                <a className="justify-between">
                  Profile
                  <span className="badge">New</span>
                </a>
              </li>
              <li>
                <a onClick={onSignOut}>Logout</a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
