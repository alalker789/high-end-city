# 🏙️ HIGH-END CITY — Open-World Driving Sandbox

A browser-based, **GTA-style 3D open-world driving game** built with pure
HTML, CSS, and JavaScript using the [Three.js](https://threejs.org) 3D engine.
No build tools, no frameworks — just three files you can open and play.

Pick a ride from the garage, tear through a neon city, dodge (or cause) chaos,
outrun the cops, and even take to the skies in a helicopter.

---

## 🎮 What is this?

**HIGH-END CITY** is a lightweight, single-page 3D game that runs entirely in the
browser. It procedurally builds a small open world — a downtown full of skyscrapers
surrounded by desert, beach, hills and ocean — and drops you into it behind the
wheel (or the rotor) of your chosen vehicle.

It's a learning / hobby project that shows how far you can get with plain web tech:
real-time 3D, shadows, physics, AI, audio and a full HUD, all in ~1,500 lines.

---

## ✨ Features

### 🚗 Vehicles & Garage

- **5 selectable vehicles**, each with unique speed, acceleration & handling:
  - **Comet GT** — fast & agile sports car
  - **Bolt R** — heavy muscle car
  - **Ranger X** — balanced SUV
  - **Hauler** — slow, tanky truck
  - **Sky Hawk** — a fully **flyable helicopter**
- **Stylish car design** (Asphalt / Free Fire vibe): sleek body, rear spoiler,
  side skirts, racing stripe, alloy rims and **pulsing neon underglow**.
- Open the garage any time with **V** to switch vehicles.

### 🌍 Open World & Biomes

- Procedurally generated **downtown** with a road grid and traffic.
- **Hi-tech skyscrapers**: neon edge-strips, glowing crowns, blinking antenna
  beacons and holographic billboards.
- Five explorable regions with a live location label:
  **Downtown · The Dunes (desert) · Sunset Beach · Ocean · Highland Hills · Great Plains**
- Biome props: cacti, sand dunes, palm trees, pine forests, rolling hills, rocks
  and an **animated wavy ocean**.

### 👮 Wanted System & Police

- Commit a crime — **crash into a building** or **run over a pedestrian** — and you
  instantly get a **WANTED** level.
- **Police cars spawn and chase you** with flashing lights and a siren.
- Escalating **5-star wanted system** — more stars = more cops.
- **BUSTED mechanic**: if the cops corner you while you're stopped, a
  "BUSTING…" meter fills and you get busted, then respawn.
- Escape their line of sight and the stars fade away.

### 🚶 Living City

- **~40 walking pedestrians** with animated arms & legs that wander the streets
  and **flee from your car**.
- **22 AI traffic cars** driving the road grid.
- **3 ambient AI helicopters** circling the skyline.

### 🎥 Camera Views (press **C**)

Cycle through 5 camera modes, Dr. Driving style:

- **CHASE** — classic behind-the-car view
- **FAR** — pulled-back cinematic
- **TOP** — bird's-eye, rotates with your heading
- **HOOD** — low bumper/hood cam
- **COCKPIT** — first-person inside view (car body hides)

### 🔊 Sound

- Live **engine synth** whose pitch rises with speed + sub-bass rumble
- Distinct **helicopter rotor** sound
- Horn, crash thuds, police **siren**, and UI stings
- (Audio starts on the first click — browser requirement.)

### 💥 Effects

- Real-time **shadows** and soft lighting (bright daytime)
- **Tire smoke** particles when braking / drifting
- **Screen flash** on crashes, red tint when busted
- **Speed vignette** and **FOV kick** at high speed
- Pulsing neon, glowing head/tail-lights

### 🖥️ HUD / UI

- Glassmorphism panels with a racing-game font (Orbitron / Rajdhani)
- Canvas **speedometer** (switches to **altimeter** in the helicopter)
- Rotating **minimap** with biome colors, traffic (blue) & police (red) dots
- Wanted stars, gear indicator, in-game clock and location name
- Animated neon main menu & garage

### 📱 Mobile Support

- Fully **responsive** layout that rescales the HUD for phones.
- **On-screen touch controls** appear automatically on touch devices:
  steering, gas, brake, reverse, up/down, view, horn and garage buttons.

---

## ⌨️ Controls

| Action                      | Keyboard       | Touch      |
| --------------------------- | -------------- | ---------- |
| Drive / accelerate          | `W` or ↑       | **GAS**    |
| Brake (car) / Ascend (heli) | `Space`        | **BRK/UP** |
| Reverse (car)               | `S` or ↓       | **REV**    |
| Descend (heli)              | `Shift`        | **DN**     |
| Steer left / right          | `A` `D` or ← → | **◀ ▶**    |
| Change camera view          | `C`            | **VIEW**   |
| Look around                 | `Q` `E`        | —          |
| Horn                        | `H`            | **HORN**   |
| Open garage                 | `V`            | **CARS**   |
| Reset position              | `R`            | —          |

---

## ▶️ How to Run

This game loads Three.js as an ES module, so it needs to be served over **HTTP**
(opening the file directly with `file://` will not work).

### Easiest — VS Code Live Server

1. Install the **Live Server** extension (by Ritwick Dey).
2. Right-click `index.html` → **Open with Live Server**.
3. Click **SPAWN VEHICLE** and play.

### Alternative — any local server

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000
```

> ⚠️ Needs an internet connection the first time — Three.js and the fonts load
> from a CDN.

### 📱 Play on your phone

Make sure your phone and computer are on the **same Wi-Fi**, find your computer's
local IP (e.g. `192.168.1.7`), and open `http://192.168.1.7:5500/` on the phone.

---

## 📁 Project Structure

```text
high-end-city/
├── index.html   # page layout + HUD elements
├── style.css    # all styling, HUD, menu, responsive + touch controls
├── game.js      # the entire game (world, vehicles, physics, audio, UI)
└── README.md    # this file
```

---

## 🛠️ Built With

- **[Three.js](https://threejs.org)** — WebGL 3D rendering
- **Web Audio API** — procedural engine & sound effects
- **HTML5 Canvas** — speedometer & minimap
- Plain **HTML / CSS / JavaScript** — no build step

---

## 🧠 Notes & Limitations

This is a **prototype**, not a commercial game. It is _inspired by_ GTA / Asphalt /
Dr. Driving but contains **no copyrighted assets** — every model is built from
simple 3D shapes in code. A real AAA open-world game is a studio-scale effort;
this is a fun, educational slice of that idea.

## 🚀 Possible Next Features

- Money / score & missions
- Police helicopters at 4+ stars
- Car damage & health
- Enter-able buildings
- Night mode so the neon really glows

---

_Made for fun and learning. Drive safe(ish). 🚔_
