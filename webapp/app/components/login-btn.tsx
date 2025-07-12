"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { Session } from "next-auth";

const Component: React.FC = () => {
  const { data: session } = useSession() as { data: Session | null };

  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
};

export default Component;