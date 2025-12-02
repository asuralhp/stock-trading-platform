'use client';
import { useSession, signIn, signOut } from "next-auth/react";
import React from 'react';


type AuthButtonProps = {
  iconSrc?: string;
  ariaLabel?: string;
  iconSize?: number;
};

const AuthButton: React.FC<AuthButtonProps> = ({ iconSrc, iconSize = 64, ariaLabel }) => {
  const { data: session, status } = useSession();
  
  
  const  handleButtonClick =  async () => {
    console.log(JSON.stringify(session, null, 4));
    if (session) {
      // User is authenticated, trigger sign-out
       signOut();
    } else {
      // User is not authenticated, trigger sign-in
       signIn("github");
    }
  };

  const buttonLabel = session ? 'Sign out' : 'Sign in with GitHub';

  const handleKeyDown = (event: React.KeyboardEvent<HTMLImageElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleButtonClick();
    }
  };

  return (
    <>
      {status === 'loading'
        ? 'Loading...'
        : iconSrc
        ? (
            <img
              src={iconSrc}
              width={iconSize}
              height={iconSize}
              alt={ariaLabel ?? buttonLabel}
              role="button"
              tabIndex={0}
              onClick={handleButtonClick}
              onKeyDown={handleKeyDown}
              style={{ cursor: 'pointer' }}
            />
          )
        : (
            <span onClick={handleButtonClick}>{buttonLabel}</span>
          )}
    </>
  );
};

const SignInDIV: React.FC = () => {
  const iconSize = 128;
  const { data: session } = useSession();
  const githubLogo = "/github-mark.svg";
  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AuthButton iconSrc={githubLogo} iconSize={iconSize} ariaLabel="Authenticate with GitHub" />
      </div>
      <div>
        {session?.user?.name && (
          <span>{session.user.name} ({JSON.stringify(session, null, 4)})</span>
        )}
      </div>
    </main>
  );
};

export default SignInDIV;