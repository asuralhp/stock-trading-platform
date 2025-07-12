'use client';
// import { auth } from "@/auth";
import { useSession } from "next-auth/react";
import { getUser, UserData } from "@/app/api/users/crud";
import { useEffect, useState } from "react";

const User = () => {
  // const session = await auth();
  const session_react = useSession();
  const userUid = session_react.data?.user?.userUid;

  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUser(); 
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

  }, [])

  return (
    <div>
      {/* <h1>Welcome, {session.data?.user?.name}</h1> */}
      <h2>
        nextauth session
        {JSON.stringify(session_react)}
      </h2>
      <h2>
        nextauth session
        {/* {JSON.stringify(session)} */}
      </h2>
      <div>
        User : {JSON.stringify(user)}  <br/>
        User UID :{userUid} <br/>
        User Name : {user?.name} <br/>
        User Email : {user?.email}
      </div>
      {/* Other protected content */}
    </div>
  );
};

export default User;