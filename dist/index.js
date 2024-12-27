"use strict";
// require("dotenv").config();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const ws_1 = require("ws");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/get", (req, res) => {
    console.log("get activateed");
    res.send("get activateed");
});
const server = (0, http_1.createServer)(app);
const AudioStreamWss = new ws_1.WebSocketServer({ noServer: true });
const SensorDataWss = new ws_1.WebSocketServer({ noServer: true });
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
SensorDataWss.on("connection", (ws) => {
    console.log("client connected.");
    ws.on("error", (e) => {
        console.log(e);
    });
    ws.on("message", (data) => {
        if (Buffer.isBuffer(data)) {
            // Convert buffer to string
            const decodedMessage = data.toString();
            console.log(`Message received: ${decodedMessage}`);
            SensorDataWss.clients.forEach((client) => {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(decodedMessage);
                }
            });
        }
        else {
            // Already a string
            console.log("Message recieved : ", data);
            SensorDataWss.clients.forEach((client) => {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(data);
                }
            });
        }
    });
    ws.on("close", (code, reason) => {
        console.log("Client disconnected ", code, reason);
    });
});
server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url, `https://${request.headers.host}`)
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
