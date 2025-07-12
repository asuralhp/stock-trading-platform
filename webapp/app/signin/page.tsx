'use client';
import { useSession, signIn, signOut } from "next-auth/react";
import React from 'react';


const AuthButton: React.FC = () => {
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

  return (
    <button onClick={handleButtonClick}>
      {status === 'loading' ? (
        'Loading...'
      ) : session ? (
        `Sign out`
        
      ) : (
        'Sign in with Github'
      )}
    </button>
  );
};

const SignInDIV: React.FC = () => {
  
  const { data: session, status } = useSession();
  return (
    <main>
      <AuthButton />
      <div>
        {session?.user?.name && (
          <span>{session.user.name} ({JSON.stringify(session, null, 4)})</span>
        )}
      </div>
    </main>
  );
};

export default SignInDIV;