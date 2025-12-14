import getServerSession from "next-auth"
import { authOptions } from "../../auth"
import { NextApiRequest, NextApiResponse } from "next"; // Importing types


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req as any, res as any, authOptions as any);

  if (session) {
    res.send({
      content:
        "This is protected content. You can access this content because you are signed in.",
    });
  } else {
    res.send({
      error: "You must be signed in to view the protected content on this page.",
    });
  }
};

export default handler;