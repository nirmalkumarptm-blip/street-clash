# STREET CLASH — Release Candidate 1.1

A browser-based 3D 1v1 fighting-game prototype featuring Nirmal (Red Dragon) and Priya (Pink Shadow).

## Features
- Three.js 3D underground arena and procedural character models.
- Offline practice against Priya AI.
- Punch, kick, block, jump, dodge, special attack, health and power meters.
- Best-of-three rounds, 180-second timer, knockout and result screen.
- Keyboard and touchscreen controls.
- English/Tamil menu toggle and sound settings.
- Private 4-digit online rooms using Socket.IO. Each player controls one fighter; movement and combat inputs are relayed by the server.

## Run locally
Requires Node.js 18+.

```bash
npm install
npm run dev
```
Open the Vite URL shown in the terminal.

To run the online server in a second terminal:
```bash
cd server
npm install
npm start
```
The server health endpoint is `http://localhost:3000/health`.

In the game, choose Create Online Room or Join Room. Enter `http://localhost:3000` as the server URL. For two devices outside the same network, deploy the `server/` folder to a Node hosting service (Render configuration is included in `render.yaml`) and enter its HTTPS URL in both clients.

## Controls
| Action | Keyboard | Mobile |
|---|---|---|
| Move | A/D or arrows | Left joystick |
| Punch | J | PUNCH |
| Kick | K | KICK |
| Block | Hold L | Hold BLOCK |
| Jump | Space | JUMP |
| Dodge | I | DODGE |
| Special | U | SPECIAL |

## Important release status
This is a **playable prototype / release candidate**, not a finished commercial-grade game. The 3D fighters are procedural prototype models, not final likeness-accurate rigged GLB characters. Online rooms and input relay are implemented in source, but the server is not hosted by this ZIP. Online synchronization is prototype-level and still needs real two-device network testing, latency handling, authoritative server-side hit validation, and synchronized round/result recovery. No claim is made that Android/Windows browser QA has been completed.

The original private reference photos are not included in this project.
