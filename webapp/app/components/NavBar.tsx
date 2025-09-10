import Image from 'next/image'
import Icon from '@/public/next.svg';
import './NavBar.scss';
function NavBar() {
    const navItems = [
            { href: '/', label: 'Home' },
            { href: '/stock', label: 'Stock' },
            { href: '/about', label: 'About' },
            { href: '/user', label: 'User' },
            { href: '/contact', label: 'Contact' },
        ];
        const navItems_right = [
            { href: '/signup', label: 'SignUp' },
            { href: '/signin', label: 'SignIn' },

        ];
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div>
            <Image src={Icon} alt="Logo" width={160} />
        </div>
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
        {navItems_right.map(({ href, label }) => (
            <li className="navbar-item" key={href}>
                <a href={href} className="navbar-link">{label}</a>
            </li>
        ))}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;