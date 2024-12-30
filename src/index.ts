import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const API_KEY = "123123";

const app = express();
app.use(express.json());

//This is just for example.
app.get("/get", (req, res) => {
  console.log("get activateed");
  res.send("get activateed");
});

const server = createServer(app);

const AudioStreamWss = new WebSocketServer({ noServer: true });
const SensorDataWss = new WebSocketServer({ noServer: true });

const clientMetaData = new Map<WebSocket, { isAuthorized: boolean }>();

SensorDataWss.on("connection", (ws, request) => {
  console.log("client connected.");

  ws.on("error", (e) => {
    console.log(e);
  });

  let lastUpdateTime = 0;

  ws.on("message", (data) => {
    //  Add Throttling for the data broadcast.

    const params = new URLSearchParams(
      new URL(request.url!, `https://${request.headers.host}`).searchParams
    );

    const clientKey = params.get("apikey");

    const isAuthorized = API_KEY === clientKey;

    clientMetaData.set(ws, { isAuthorized });
    const currentTime = Date.now();

    if (clientMetaData.get(ws)?.isAuthorized) {
      if (currentTime - lastUpdateTime >= 4000) {
        if (Buffer.isBuffer(data)) {
          // Convert buffer to string
          const decodedMessage = data.toString();
          console.log(`Message received: ${decodedMessage}`);
          SensorDataWss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(decodedMessage);
            }
            lastUpdateTime = currentTime;
          });
        } else {
          // Already a string
          console.log("Message recieved : ", data);
          SensorDataWss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(data);
            }
            lastUpdateTime = currentTime;
          });
        }
      }
    } else {
      ws.send("You are not authorized to broadcast data.");
      return;
    }
  });

  ws.on("close", (code, reason) => {
    clientMetaData.delete(ws);
    console.log("Client disconnected ", code, reason);
  });
});

AudioStreamWss.on("connection", (ws) => {
  console.log("client connected.");

  ws.on("error", (e) => {
    console.log(e);
  });

  ws.on("message", (data) => {
    console.log(data);
  });

  ws.on("close", (code, reason) => {
    console.log("Client disconnected ", code, reason);
  });
});

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url!, `https://${request.headers.host}`)
    .pathname;

  switch (pathname) {
    case "/audio-stream":
      AudioStreamWss.handleUpgrade(request, socket, head, (ws) => {
        AudioStreamWss.emit("connection", ws, request);
      });
      break;

    case "/sensor-data":
      SensorDataWss.handleUpgrade(request, socket, head, (ws) => {
        SensorDataWss.emit("connection", ws, request);
      });
      break;

    default:
      socket.destroy();
      console.log("Invalid pathname");
  }
});

server.listen(3000, () => {
  console.log("server started");
});

// require("dotenv").config();

// import express from "express";
// import { WebSocketServer, WebSocket } from "ws";

// const app = express();

// app.use(express.json());

// const port = process.env.PORT || 3000;

// const httpServer = app.listen(port, () => {
//   console.log(`Server has started at ${port}`);
// });

// console.log(process.env.PORT);

// const wss = new WebSocketServer({ server: httpServer });

// wss.on("connection", (ws) => {
//   console.log("New user connected ");

//   ws.on("error", (e) => {
//     console.error(e);
//   });

//   ws.on("message", (data) => {

//     if (Buffer.isBuffer(data)) {
//       // Convert buffer to string
//       const decodedMessage = data.toString();
//       console.log(`Message received: ${decodedMessage}`);
//       wss.clients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(decodedMessage);
//         }
//       });
//     } else {
//       // Already a string
//     console.log("Message recieved : ", data);
//       wss.clients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(data);
//         }
//       });
//     }
//   });
// });
