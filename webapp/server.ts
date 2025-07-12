import { createServer, IncomingMessage, request, ServerResponse } from "node:http";
import next from "next";
import { Server, Socket } from "socket.io";

const dev: boolean = process.env.NODE_ENV !== "production";
const hostname: string = "localhost";
const port: number = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io: Server = new Server(httpServer);

  io.on("connection", (socket: Socket) => {
    
    socket.on('hello', (msg) => {
        console.log('Received:', msg);
        // Emit a response back to the client
        socket.emit('responseFromServer', 'Hello from server!');
      });
    
    
    socket.on('position', (msg) => {
        console.log('Position:', msg);
        // Emit a response back to the client
        socket.emit('responseFromServer', 'Position from server!');
      });
    
    
  });
  
  

  httpServer
    .once("error", (err: Error) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});