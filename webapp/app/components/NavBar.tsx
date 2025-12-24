'use client';

import Image from 'next/image'
import Icon from '@/public/next.svg';
import './NavBar.scss';
import { useSession, signOut } from 'next-auth/react';

type NavAction = {
  label: string;
  href?: string;
  action?: () => void;
};

function NavBar() {
  const { status } = useSession();
    const navItems = [
            { href: '/', label: 'Home' },
            { href: '/stock', label: 'Stock' },
            { href: '/admin', label: 'Admin' },
            { href: '/user', label: 'User' },
            { href: '/api/guide', label: 'Guide' },
        ];
    const navItems_right: NavAction[] = status === 'authenticated'
      ? [
        { label: 'Sign Out', action: () => signOut({ callbackUrl: '/' }) },
      ]
      : [
        { href: '/signin', label: 'Sign In' },
      ];
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Image src={Icon} alt="Logo" width={100} />
          <div className='spacer'></div>

        <div className="navbar-list">
        {navItems.map(({ href, label }) => (
          <li className="navbar-item" key={href}>
                <a href={href} className="navbar-link">{label}</a>
            </li>
        ))}
        </div>
        <div className='spacer'></div>
        <div className='navbar-list-right'>
        {navItems_right.map(({ href, label, action }) => (
          <li className="navbar-item" key={label}>
                {href ? (
                  <a href={href} className="navbar-link">{label}</a>
                ) : (
                  <button type="button" className="navbar-link navbar-link-button" onClick={action}>{label}</button>
                )}
            </li>
        ))}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;