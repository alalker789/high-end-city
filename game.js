import * as THREE from "three";

/* ============================================================
   HIGH-END CITY v5 — stylish cars, effects, bust system,
   crime-triggered police, multi-view camera (press C)
   ============================================================ */

const BLOCK = 42,
  ROAD = 16,
  CELL = BLOCK + ROAD,
  GRID = 7,
  HALF = (GRID * CELL) / 2;
const CITY_EDGE = HALF + 20,
  WORLD = 1500,
  OCEAN_Z = -720;

const NEONS = [0x00e5ff, 0xff2fd0, 0x39ff88, 0xffb300, 0x7a5cff];
const VEHICLES = [
  {
    id: "sport",
    name: "Comet GT",
    type: "ground",
    color: 0xe6203a,
    neon: 0xff2fd0,
    accel: 19,
    maxFwd: 44,
    handling: 2.1,
    desc: "Fast & agile",
  },
  {
    id: "muscle",
    name: "Bolt R",
    type: "ground",
    color: 0xf5c542,
    neon: 0xffb300,
    accel: 17,
    maxFwd: 40,
    handling: 1.9,
    desc: "Heavy hitter",
  },
  {
    id: "suv",
    name: "Ranger X",
    type: "ground",
    color: 0x2b8ad1,
    neon: 0x00e5ff,
    accel: 14,
    maxFwd: 34,
    handling: 1.7,
    desc: "All-rounder",
    scale: 1.15,
  },
  {
    id: "truck",
    name: "Hauler",
    type: "ground",
    color: 0x36b06a,
    neon: 0x39ff88,
    accel: 11,
    maxFwd: 27,
    handling: 1.4,
    desc: "Slow tank",
    scale: 1.35,
  },
  {
    id: "heli",
    name: "Sky Hawk",
    type: "air",
    color: 0x20242c,
    neon: 0x00e5ff,
    accel: 26,
    maxFwd: 56,
    handling: 1.7,
    desc: "Fly anywhere",
  },
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87c5ee);
scene.fog = new THREE.Fog(0x9fd0f0, 400, 1600);
const camera = new THREE.PerspectiveCamera(
  62,
  innerWidth / innerHeight,
  0.5,
  4000,
);
camera.position.set(0, 20, -30);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.getElementById("app").appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x88865f, 1.15);
scene.add(hemi);
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const sun = new THREE.DirectionalLight(0xfff4de, 2.7);
sun.position.set(220, 340, 160);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 1000;
const S = 360;
sun.shadow.camera.left = -S;
sun.shadow.camera.right = S;
sun.shadow.camera.top = S;
sun.shadow.camera.bottom = -S;
sun.shadow.bias = -0.0004;
scene.add(sun);
scene.add(sun.target);

// ---------- TERRAIN ----------
const base = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD * 2.4, WORLD * 2.4),
  new THREE.MeshStandardMaterial({ color: 0x5a8a43, roughness: 1 }),
);
base.rotation.x = -Math.PI / 2;
base.position.y = -0.05;
base.receiveShadow = true;
scene.add(base);
function flatPlane(color, w, d, x, z, y = 0) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
flatPlane(
  0xd9c18a,
  WORLD * 2,
  WORLD - CITY_EDGE,
  0,
  CITY_EDGE + (WORLD - CITY_EDGE) / 2,
  0.01,
);
flatPlane(
  0xe8d7a2,
  WORLD * 2,
  -OCEAN_Z - CITY_EDGE,
  0,
  (OCEAN_Z - CITY_EDGE) / 2,
  0.01,
);
flatPlane(
  0x4f7d3a,
  WORLD - CITY_EDGE,
  CITY_EDGE * 2,
  CITY_EDGE + (WORLD - CITY_EDGE) / 2,
  0,
  0.02,
);
const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD * 2.4, WORLD, 40, 20),
  new THREE.MeshStandardMaterial({
    color: 0x2a6f97,
    roughness: 0.25,
    metalness: 0.4,
    transparent: true,
    opacity: 0.92,
  }),
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.set(0, 0.2, OCEAN_Z - WORLD / 2);
ocean.receiveShadow = true;
scene.add(ocean);
const oceanBase = ocean.geometry.attributes.position.array.slice();

// ---------- CITY ----------
const colliders = [];
const cityGroup = new THREE.Group();
scene.add(cityGroup);
const techBeacons = [];
const asphalt = new THREE.Mesh(
  new THREE.PlaneGeometry(GRID * CELL + ROAD, GRID * CELL + ROAD),
  new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.95 }),
);
asphalt.rotation.x = -Math.PI / 2;
asphalt.position.y = 0.03;
asphalt.receiveShadow = true;
cityGroup.add(asphalt);
const markMat = new THREE.MeshStandardMaterial({
  color: 0xe0d75a,
  emissive: 0x3a3400,
  roughness: 0.6,
});
function laneStripe(x, z, len, horizontal) {
  const g = new THREE.BoxGeometry(
    horizontal ? len : 0.5,
    0.05,
    horizontal ? 0.5 : len,
  );
  const m = new THREE.Mesh(g, markMat);
  m.position.set(x, 0.06, z);
  cityGroup.add(m);
}
for (let i = -Math.floor(GRID / 2); i <= Math.floor(GRID / 2) + 1; i++) {
  const p = i * CELL - CELL / 2;
  laneStripe(0, p, GRID * CELL, true);
  laneStripe(p, 0, GRID * CELL, false);
}
const palettes = [
  0x8a8f9c, 0x6f7787, 0x9aa0ad, 0x5d6470, 0xb0a99a, 0x7d8a94, 0xa88f7a,
];
function makeWindowTexture(baseHex) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#" + baseHex.toString(16).padStart(6, "0");
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 128; y += 12)
    for (let x = 6; x < 64; x += 12) {
      ctx.fillStyle =
        Math.random() > 0.7 ? "rgba(180,210,235,0.95)" : "rgba(40,50,66,0.9)";
      ctx.fillRect(x, y, 7, 8);
    }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const windowTextures = palettes.map(makeWindowTexture);
function addBuilding(cx, cz, w, d, h, ci) {
  const tex = windowTextures[ci].clone();
  tex.needsUpdate = true;
  tex.repeat.set(
    Math.max(1, Math.round(w / 6)),
    Math.max(1, Math.round(h / 6)),
  );
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    color: palettes[ci],
    roughness: 0.72,
    metalness: 0.1,
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(cx, h / 2, cz);
  m.castShadow = true;
  m.receiveShadow = true;
  cityGroup.add(m);
  colliders.push({ x: cx, z: cz, hw: w / 2, hd: d / 2 });
}
function makeHoloTexture(text, col) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(4,10,20,0.9)";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = col;
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 116, 116);
  ctx.fillStyle = col;
  ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 64, 74);
  for (let y = 0; y < 128; y += 6) {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, y, 128, 2);
  }
  return new THREE.CanvasTexture(c);
}
const HOLO_WORDS = ["NEON", "CYBER", "APEX", "VOLT", "NOVA", "HALO"];
function addTechTower(cx, cz) {
  const w = BLOCK * 0.7,
    d = BLOCK * 0.7,
    h = 130 + Math.random() * 90;
  const glass = new THREE.MeshStandardMaterial({
    color: 0x0e1622,
    roughness: 0.12,
    metalness: 0.85,
    emissive: 0x08131f,
    emissiveIntensity: 0.5,
  });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glass);
  tower.position.set(cx, h / 2, cz);
  tower.castShadow = true;
  tower.receiveShadow = true;
  cityGroup.add(tower);
  const neon = NEONS[Math.floor(Math.random() * NEONS.length)];
  const stripMat = new THREE.MeshStandardMaterial({
    color: neon,
    emissive: neon,
    emissiveIntensity: 2.2,
  });
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, h * 0.96, 0.5),
      stripMat,
    );
    strip.position.set(cx + (sx * w) / 2, h / 2, cz + (sz * d) / 2);
    cityGroup.add(strip);
  }
  for (let y = 20; y < h; y += 22) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.3, 0.6, d + 0.3),
      stripMat,
    );
    band.position.set(cx, y, cz);
    cityGroup.add(band);
  }
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(w * 0.5, w * 0.7, 5, 6),
    new THREE.MeshStandardMaterial({
      color: neon,
      emissive: neon,
      emissiveIntensity: 2.6,
    }),
  );
  crown.position.set(cx, h + 2.5, cz);
  cityGroup.add(crown);
  const ant = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 22, 6),
    new THREE.MeshStandardMaterial({ color: 0x222 }),
  );
  ant.position.set(cx, h + 13, cz);
  cityGroup.add(ant);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 3,
  });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), beaconMat);
  beacon.position.set(cx, h + 24, cz);
  cityGroup.add(beacon);
  techBeacons.push({ mat: beaconMat, band: stripMat });
  const holo = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.8, w * 0.8),
    new THREE.MeshStandardMaterial({
      map: makeHoloTexture(
        HOLO_WORDS[Math.floor(Math.random() * HOLO_WORDS.length)],
        "#" + neon.toString(16).padStart(6, "0"),
      ),
      emissive: neon,
      emissiveIntensity: 1.1,
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );
  holo.position.set(cx, h * 0.55, cz + d / 2 + 0.6);
  cityGroup.add(holo);
  colliders.push({ x: cx, z: cz, hw: w / 2, hd: d / 2 });
}
(function buildCity() {
  const n = Math.floor(GRID / 2);
  for (let gx = -n; gx <= n; gx++)
    for (let gz = -n; gz <= n; gz++) {
      const cx = gx * CELL,
        cz = gz * CELL;
      const central = Math.abs(gx) <= 1 && Math.abs(gz) <= 1;
      if ((gx === 0 && gz === 0) || (central && Math.random() > 0.45)) {
        addTechTower(cx, cz);
        continue;
      }
      const sub = Math.random() > 0.5 ? 2 : 1,
        cell = BLOCK / sub;
      for (let sx = 0; sx < sub; sx++)
        for (let sz = 0; sz < sub; sz++) {
          const bx = cx - BLOCK / 2 + cell / 2 + sx * cell,
            bz = cz - BLOCK / 2 + cell / 2 + sz * cell;
          const w = cell * (0.6 + Math.random() * 0.3),
            d = cell * (0.6 + Math.random() * 0.3);
          const h =
            12 +
            Math.pow(Math.random(), 2) *
              95 *
              (1 - Math.hypot(gx, gz) / (n * 1.6) + 0.4);
          addBuilding(
            bx,
            bz,
            w,
            d,
            Math.max(10, h),
            Math.floor(Math.random() * palettes.length),
          );
        }
    }
})();

// ---------- BIOME PROPS ----------
const props = new THREE.Group();
scene.add(props);
const inCity = (x, z) => Math.abs(x) < CITY_EDGE && Math.abs(z) < CITY_EDGE;
function clearSpot(x, z, r) {
  for (const c of colliders) {
    const nx = Math.max(c.x - c.hw, Math.min(x, c.x + c.hw)),
      nz = Math.max(c.z - c.hd, Math.min(z, c.z + c.hd));
    const dx = x - nx,
      dz = z - nz;
    if (dx * dx + dz * dz < r * r) return false;
  }
  return true;
}
function addCactus(x, z) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3f7a3a,
    roughness: 0.9,
  });
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 6, 8), mat);
  trunk.position.y = 3;
  trunk.castShadow = true;
  g.add(trunk);
  for (const s of [-1, 1])
    if (Math.random() > 0.4) {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.4, 2.5, 6),
        mat,
      );
      arm.position.set(s * 0.9, 3.2, 0);
      arm.rotation.z = s * 0.9;
      arm.castShadow = true;
      g.add(arm);
    }
  g.position.set(x, 0, z);
  props.add(g);
  colliders.push({ x, z, hw: 1, hd: 1 });
}
function addDune(x, z) {
  const r = 8 + Math.random() * 16;
  const d = new THREE.Mesh(
    new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xcdb47c, roughness: 1 }),
  );
  d.position.set(x, -1, z);
  d.scale.y = 0.35;
  d.castShadow = true;
  d.receiveShadow = true;
  props.add(d);
  colliders.push({ x, z, hw: r * 0.7, hd: r * 0.7 });
}
function addRock(x, z) {
  const r = 1.5 + Math.random() * 3;
  const rock = new THREE.Mesh(
    new THREE.IcosahedronGeometry(r, 0),
    new THREE.MeshStandardMaterial({
      color: 0x8a7f70,
      roughness: 1,
      flatShading: true,
    }),
  );
  rock.position.set(x, r * 0.4, z);
  rock.castShadow = true;
  props.add(rock);
  colliders.push({ x, z, hw: r, hd: r });
}
function addPalm(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 8, 7),
    new THREE.MeshStandardMaterial({ color: 0x7a5a30, roughness: 1 }),
  );
  trunk.position.y = 4;
  trunk.rotation.z = 0.12;
  trunk.castShadow = true;
  g.add(trunk);
  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x3f9a4a,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5, 4), frondMat);
    f.position.set(0, 8, 0);
    f.rotation.z = Math.PI / 2.4;
    f.rotation.y = (i / 6) * Math.PI * 2;
    f.castShadow = true;
    g.add(f);
  }
  g.position.set(x, 0, z);
  props.add(g);
  colliders.push({ x, z, hw: 0.8, hd: 0.8 });
}
function addPine(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.55, 3, 6),
    new THREE.MeshStandardMaterial({ color: 0x5a3d24, roughness: 1 }),
  );
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(3 - i * 0.7, 3.5, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2f6d34,
        roughness: 1,
        flatShading: true,
      }),
    );
    cone.position.y = 3.5 + i * 2.2;
    cone.castShadow = true;
    g.add(cone);
  }
  g.position.set(x, 0, z);
  props.add(g);
  colliders.push({ x, z, hw: 1, hd: 1 });
}
function addHill(x, z) {
  const r = 20 + Math.random() * 40;
  const h = new THREE.Mesh(
    new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x4a7d38,
      roughness: 1,
      flatShading: true,
    }),
  );
  h.position.set(x, -2, z);
  h.scale.y = 0.5;
  h.castShadow = true;
  h.receiveShadow = true;
  props.add(h);
  colliders.push({ x, z, hw: r * 0.75, hd: r * 0.75 });
}
function scatter(count, fn, xr, zr) {
  let placed = 0,
    guard = 0;
  while (placed < count && guard < count * 12) {
    guard++;
    const x = xr[0] + Math.random() * (xr[1] - xr[0]),
      z = zr[0] + Math.random() * (zr[1] - zr[0]);
    if (inCity(x, z)) continue;
    fn(x, z);
    placed++;
  }
}
scatter(45, addCactus, [-WORLD, WORLD], [CITY_EDGE + 20, WORLD]);
scatter(28, addDune, [-WORLD, WORLD], [CITY_EDGE + 20, WORLD]);
scatter(22, addRock, [-WORLD, WORLD], [CITY_EDGE + 20, WORLD]);
scatter(34, addPalm, [-WORLD, WORLD], [OCEAN_Z + 20, -CITY_EDGE - 20]);
scatter(16, addRock, [-WORLD, WORLD], [OCEAN_Z + 40, -CITY_EDGE - 20]);
scatter(26, addHill, [CITY_EDGE + 40, WORLD], [-WORLD, WORLD]);
scatter(50, addPine, [CITY_EDGE + 20, WORLD], [-WORLD, WORLD]);
scatter(55, addPine, [-WORLD, -CITY_EDGE - 20], [-WORLD, WORLD]);
scatter(10, addHill, [-WORLD, -CITY_EDGE - 40], [-WORLD, WORLD]);

// ---------- STYLISH CAR ----------
function buildCar(bodyColor, neonColor = 0x00e5ff) {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.25,
    metalness: 0.75,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x0c0e12,
    roughness: 0.5,
    metalness: 0.4,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x0d141c,
    roughness: 0.05,
    metalness: 0.7,
    transparent: true,
    opacity: 0.72,
  });
  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 4.5), paint);
  lower.position.y = 0.6;
  lower.castShadow = true;
  lower.receiveShadow = true;
  car.add(lower);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.32, 1.5), paint);
  hood.position.set(0, 0.8, 1.45);
  hood.castShadow = true;
  car.add(hood);
  const mid = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 2.3), paint);
  mid.position.set(0, 0.92, -0.2);
  mid.castShadow = true;
  car.add(mid);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 1.7), paint);
  roof.position.set(0, 1.32, -0.4);
  roof.castShadow = true;
  car.add(roof);
  const wind = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 0.14), glass);
  wind.position.set(0, 1.24, 0.55);
  wind.rotation.x = -0.52;
  car.add(wind);
  const sideGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.52, 0.4, 1.55),
    glass,
  );
  sideGlass.position.set(0, 1.32, -0.4);
  car.add(sideGlass);
  const rear = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.14), glass);
  rear.position.set(0, 1.24, -1.28);
  rear.rotation.x = 0.55;
  car.add(rear);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.02, 4.3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
  );
  stripe.position.set(0, 1.16, -0.05);
  car.add(stripe);
  for (const s of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 3.5), dark);
    skirt.position.set(s * 1.05, 0.48, 0);
    car.add(skirt);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 0.55), dark);
  wing.position.set(0, 1.16, -2.25);
  car.add(wing);
  for (const s of [-0.8, 0.8]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.18), dark);
    strut.position.set(s, 0.98, -2.2);
    car.add(strut);
  }
  const hlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xbfefff,
    emissiveIntensity: 2,
  });
  for (const s of [-0.62, 0.62]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.1), hlMat);
    l.position.set(s, 0.78, 2.28);
    car.add(l);
  }
  const tlMat = new THREE.MeshStandardMaterial({
    color: 0x330000,
    emissive: 0xff2200,
    emissiveIntensity: 1,
  });
  for (const s of [-0.62, 0.62]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.08), tlMat);
    l.position.set(s, 0.86, -2.3);
    car.add(l);
  }
  const glowMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 2.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 4.6), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.16;
  car.add(glow);
  const wheels = [];
  const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.42, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.44, 6);
  rimGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0c,
    roughness: 0.9,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd2d8de,
    roughness: 0.25,
    metalness: 0.95,
  });
  for (const [dx, dz] of [
    [-1.02, 1.45],
    [1.02, 1.45],
    [-1.02, -1.5],
    [1.02, -1.5],
  ]) {
    const wg = new THREE.Group();
    wg.add(new THREE.Mesh(tireGeo, tireMat));
    wg.add(new THREE.Mesh(rimGeo, rimMat));
    wg.position.set(dx, 0.5, dz);
    wg.castShadow = true;
    car.add(wg);
    wheels.push(wg);
  }
  car.userData.wheels = wheels;
  car.userData.tailMat = tlMat;
  car.userData.glow = glowMat;
  return car;
}
function buildHeli(bodyColor) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.4,
    metalness: 0.5,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x2a3b4a,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.8,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), bodyMat);
  body.scale.set(1, 1, 1.9);
  body.position.y = 2.2;
  body.castShadow = true;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), glassMat);
  nose.scale.set(1, 0.9, 1.3);
  nose.position.set(0, 2.2, 2);
  g.add(nose);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.5), bodyMat);
  boom.position.set(0, 2.6, -3.2);
  boom.castShadow = true;
  g.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.9), bodyMat);
  fin.position.set(0, 3.2, -5.2);
  g.add(fin);
  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 3.6, 0.4);
  mainRotor.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x222 }),
    ),
  );
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.08, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    b.rotation.y = (i * Math.PI) / 2;
    mainRotor.add(b);
  }
  g.add(mainRotor);
  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.35, 3.2, -5.2);
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.4, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    b.rotation.z = (i * Math.PI) / 2;
    tailRotor.add(b);
  }
  g.add(tailRotor);
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x333 });
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 4), skidMat);
    skid.position.set(s * 1.2, 0.6, 0.2);
    g.add(skid);
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1.1, 0.15),
      skidMat,
    );
    strut.position.set(s * 1.1, 1.2, 0.2);
    g.add(strut);
  }
  g.userData.mainRotor = mainRotor;
  g.userData.tailRotor = tailRotor;
  return g;
}

// ---------- PLAYER ----------
let veh = VEHICLES[0];
let player = null;
const pstate = {
  pos: new THREE.Vector3(CELL / 2, 0, 0),
  heading: 0,
  speed: 0,
  steer: 0,
  vy: 0,
};
function makePlayer(def) {
  if (player) scene.remove(player);
  veh = def;
  player =
    def.type === "air" ? buildHeli(def.color) : buildCar(def.color, def.neon);
  if (def.scale) player.scale.setScalar(def.scale);
  scene.add(player);
  pstate.pos.set(CELL / 2, 0, 0);
  pstate.heading = 0;
  pstate.speed = 0;
  pstate.vy = 0;
  player.position.copy(pstate.pos);
}

// ---------- TRAFFIC ----------
const traffic = [];
(function spawnTraffic(count) {
  const half = Math.floor(GRID / 2);
  const cols = [0x2b6cd1, 0xf0f0f0, 0x1a1a1a, 0xf5c542, 0x3aa655, 0x9b59b6];
  for (let i = 0; i < count; i++) {
    const car = buildCar(cols[i % cols.length], NEONS[i % NEONS.length]);
    scene.add(car);
    const onX = Math.random() > 0.5;
    const lane = (Math.floor(Math.random() * GRID) - half) * CELL - CELL / 2;
    traffic.push({
      car,
      onX,
      lane,
      along: (Math.random() - 0.5) * GRID * CELL,
      dir: Math.random() > 0.5 ? 1 : -1,
      speed: 8 + Math.random() * 8,
    });
  }
})(22);

// ---------- PEDESTRIANS ----------
const peds = [];
function buildPed() {
  const g = new THREE.Group();
  const skin = [0xffc29e, 0xe0a878, 0x8d5524, 0xf1c27d][
    Math.floor(Math.random() * 4)
  ];
  const shirt = [0x3366cc, 0xcc4444, 0x33aa66, 0xdddddd, 0xaa66cc, 0xff8c1a][
    Math.floor(Math.random() * 6)
  ];
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.8, 0.35),
    new THREE.MeshStandardMaterial({ color: shirt, roughness: 1 }),
  );
  torso.position.y = 1.3;
  torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 8),
    new THREE.MeshStandardMaterial({ color: skin, roughness: 1 }),
  );
  head.position.y = 1.9;
  head.castShadow = true;
  g.add(head);
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x333344,
    roughness: 1,
  });
  const legGeo = new THREE.BoxGeometry(0.22, 0.85, 0.24);
  legGeo.translate(0, -0.42, 0);
  const legs = [];
  for (const dx of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(dx, 0.9, 0);
    leg.castShadow = true;
    g.add(leg);
    legs.push(leg);
  }
  const armMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 1 });
  const armGeo = new THREE.BoxGeometry(0.15, 0.7, 0.18);
  armGeo.translate(0, -0.33, 0);
  const arms = [];
  for (const dx of [-0.4, 0.4]) {
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(dx, 1.62, 0);
    g.add(arm);
    arms.push(arm);
  }
  g.userData.legs = legs;
  g.userData.arms = arms;
  return g;
}
function findPedSpot() {
  const half = Math.floor(GRID / 2);
  for (let tries = 0; tries < 30; tries++) {
    const line =
      (Math.floor(Math.random() * (GRID + 1)) - half) * CELL - CELL / 2;
    const along = (Math.random() - 0.5) * GRID * CELL,
      offset = (Math.random() > 0.5 ? 1 : -1) * (ROAD / 2 + 1.5),
      onX = Math.random() > 0.5;
    const x = onX ? along : line + offset,
      z = onX ? line + offset : along;
    if (clearSpot(x, z, 1.5)) return { x, z };
  }
  return { x: CELL / 2 + 6, z: 0 };
}
(function spawnPeds(count) {
  for (let i = 0; i < count; i++) {
    const g = buildPed();
    scene.add(g);
    const s = findPedSpot();
    peds.push({
      g,
      pos: new THREE.Vector3(s.x, 0, s.z),
      heading: Math.random() * Math.PI * 2,
      speed: 1.2,
      phase: Math.random() * 7,
      turn: Math.random() * 2,
      flee: 0,
    });
    g.position.copy(peds[i].pos);
  }
})(40);

// ---------- AI HELIS ----------
const aiHelis = [];
for (let i = 0; i < 3; i++) {
  const h = buildHeli([0x444a55, 0x8a1f1f, 0x1f5a8a][i]);
  scene.add(h);
  aiHelis.push({
    h,
    cx: (Math.random() - 0.5) * 800,
    cz: (Math.random() - 0.5) * 800,
    r: 120 + Math.random() * 160,
    alt: 90 + Math.random() * 80,
    phase: Math.random() * 7,
    sp: 0.15 + Math.random() * 0.15,
  });
}

// ---------- POLICE ----------
const police = [];
function spawnPolice() {
  const car = buildCar(0x14203f, 0x0033ff);
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.18, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x111 }),
  );
  bar.position.set(0, 1.66, -0.4);
  car.add(bar);
  const red = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.2, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 2,
    }),
  );
  const blue = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.2, 0.42),
    new THREE.MeshStandardMaterial({
      color: 0x0033ff,
      emissive: 0x0033ff,
      emissiveIntensity: 2,
    }),
  );
  red.position.set(-0.28, 1.66, -0.4);
  blue.position.set(0.28, 1.66, -0.4);
  car.add(red, blue);
  car.userData.lights = [red.material, blue.material];
  scene.add(car);
  const a = Math.random() * Math.PI * 2;
  police.push({
    car,
    pos: new THREE.Vector3(
      pstate.pos.x + Math.cos(a) * 60,
      0,
      pstate.pos.z + Math.sin(a) * 60,
    ),
    heading: 0,
    speed: 0,
  });
}

// ---------- INPUT ----------
const keys = {};
addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
      e.code,
    )
  )
    e.preventDefault();
});
addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
let camYaw = 0;
const CAM_MODES = ["CHASE", "FAR", "TOP", "HOOD", "COCKPIT"];
let camMode = 0;

// ---------- TOUCH CONTROLS (mobile) ----------
(function touchControls() {
  const root = document.createElement("div");
  root.id = "touch";
  document.body.appendChild(root);
  function btn(label, code, cls) {
    const b = document.createElement("button");
    b.className = "tbtn " + cls;
    b.textContent = label;
    const on = (e) => {
      e.preventDefault();
      keys[code] = true;
      b.classList.add("press");
    };
    const off = (e) => {
      e.preventDefault();
      keys[code] = false;
      b.classList.remove("press");
    };
    b.addEventListener("touchstart", on, { passive: false });
    b.addEventListener("touchend", off, { passive: false });
    b.addEventListener("touchcancel", off, { passive: false });
    b.addEventListener("mousedown", on);
    b.addEventListener("mouseup", off);
    b.addEventListener("mouseleave", off);
    return b;
  }
  const left = document.createElement("div");
  left.className = "tc-left";
  left.append(btn("\u25C0", "KeyA", "round"), btn("\u25B6", "KeyD", "round"));
  const right = document.createElement("div");
  right.className = "tc-right";
  right.append(
    btn("REV", "KeyS", "small"),
    btn("DN", "ShiftLeft", "small"),
    btn("BRK/UP", "Space", "wide"),
    btn("GAS", "KeyW", "round big"),
  );
  const util = document.createElement("div");
  util.className = "tc-util";
  util.append(
    btn("VIEW", "KeyC", "util"),
    btn("HORN", "KeyH", "util"),
    btn("CARS", "KeyV", "util"),
  );
  root.append(left, right, util);
})();

// ---------- AUDIO ----------
let audioCtx = null,
  master = null,
  engineOsc = null,
  engineGain = null,
  engineFilter = null,
  subOsc = null,
  subGain = null;
function initAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  master = audioCtx.createGain();
  master.gain.value = 0.45;
  master.connect(audioCtx.destination);
  engineOsc = audioCtx.createOscillator();
  engineOsc.type = "sawtooth";
  engineOsc.frequency.value = 60;
  engineFilter = audioCtx.createBiquadFilter();
  engineFilter.type = "lowpass";
  engineFilter.frequency.value = 900;
  engineGain = audioCtx.createGain();
  engineGain.gain.value = 0.0001;
  engineOsc.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(master);
  engineOsc.start();
  subOsc = audioCtx.createOscillator();
  subOsc.type = "square";
  subOsc.frequency.value = 30;
  subGain = audioCtx.createGain();
  subGain.gain.value = 0.0001;
  subOsc.connect(subGain);
  subGain.connect(master);
  subOsc.start();
}
function updateEngineSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  if (veh.type === "air") {
    const t = Math.abs(pstate.speed) / veh.maxFwd;
    engineOsc.frequency.setTargetAtTime(46 + t * 26, now, 0.05);
    engineFilter.frequency.value = 500;
    engineGain.gain.setTargetAtTime(0.05, now, 0.1);
    subOsc.frequency.setTargetAtTime(9, now, 0.05);
    subGain.gain.setTargetAtTime(0.16, now, 0.1);
  } else {
    const t = Math.abs(pstate.speed) / veh.maxFwd;
    engineOsc.frequency.setTargetAtTime(55 + t * 190, now, 0.06);
    engineFilter.frequency.value = 700 + t * 1400;
    engineGain.gain.setTargetAtTime(0.04 + t * 0.1, now, 0.08);
    subOsc.frequency.setTargetAtTime(28 + t * 40, now, 0.06);
    subGain.gain.setTargetAtTime(0.03 + t * 0.05, now, 0.1);
  }
}
function beep(freq, dur, type = "square", vol = 0.08) {
  initAudio();
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(),
    g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(master);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  o.stop(audioCtx.currentTime + dur);
}

// ---------- EFFECTS (DOM overlays + particles) ----------
function mkDiv(css) {
  const d = document.createElement("div");
  d.style.cssText = css;
  document.body.appendChild(d);
  return d;
}
const flashEl = mkDiv(
  "position:fixed;inset:0;pointer-events:none;z-index:25;background:#fff;opacity:0;",
);
const vignEl = mkDiv(
  "position:fixed;inset:0;pointer-events:none;z-index:14;opacity:0;box-shadow:inset 0 0 220px 70px rgba(0,0,0,.75);transition:opacity .2s;",
);
const bustWrap = mkDiv(
  "position:fixed;left:50%;bottom:120px;transform:translateX(-50%);width:230px;height:14px;background:rgba(0,0,0,.5);border:2px solid rgba(255,255,255,.35);border-radius:8px;z-index:16;opacity:0;transition:opacity .2s;overflow:hidden;",
);
const bustBar = document.createElement("div");
bustBar.style.cssText =
  "height:100%;width:0%;background:linear-gradient(90deg,#ff8a5c,#ff1744);";
bustWrap.appendChild(bustBar);
const bustLabel = mkDiv(
  "position:fixed;left:50%;bottom:140px;transform:translateX(-50%);color:#ff6b6b;font:800 12px system-ui;letter-spacing:2px;z-index:16;opacity:0;transition:opacity .2s;text-shadow:0 1px 4px #000;",
);
bustLabel.textContent = "BUSTING…";
function flash(color, alpha) {
  flashEl.style.transition = "none";
  flashEl.style.background = color;
  flashEl.style.opacity = alpha;
  requestAnimationFrame(() => {
    flashEl.style.transition = "opacity .45s";
    flashEl.style.opacity = 0;
  });
}

function makeSmokeTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(210,210,210,0.85)");
  g.addColorStop(1, "rgba(210,210,210,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const smokeTex = makeSmokeTex();
const particles = [];
for (let i = 0; i < 44; i++) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: smokeTex,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    }),
  );
  s.visible = false;
  scene.add(s);
  particles.push({ s, life: 0, vel: new THREE.Vector3() });
}
let pIdx = 0;
function spawnSmoke(x, y, z) {
  const p = particles[pIdx];
  pIdx = (pIdx + 1) % particles.length;
  p.life = 0.6;
  p.s.visible = true;
  p.s.position.set(x, y, z);
  p.s.scale.setScalar(1.2);
  p.s.material.opacity = 0.6;
  p.vel.set(
    (Math.random() - 0.5) * 2,
    1 + Math.random() * 1.5,
    (Math.random() - 0.5) * 2,
  );
}
function updateParticles(dt) {
  for (const p of particles) {
    if (p.life <= 0) continue;
    p.life -= dt;
    p.s.position.addScaledVector(p.vel, dt);
    p.s.scale.setScalar(1.2 + (0.6 - p.life) * 4.5);
    p.s.material.opacity = Math.max(0, (p.life / 0.6) * 0.6);
    if (p.life <= 0) p.s.visible = false;
  }
}

// ---------- COLLISION ----------
function collideCircle(pos, radius) {
  let hit = false;
  for (const c of colliders) {
    const nx = Math.max(c.x - c.hw, Math.min(pos.x, c.x + c.hw)),
      nz = Math.max(c.z - c.hd, Math.min(pos.z, c.z + c.hd));
    const dx = pos.x - nx,
      dz = pos.z - nz,
      dist2 = dx * dx + dz * dz;
    if (dist2 < radius * radius) {
      const dist = Math.sqrt(dist2) || 0.0001,
        push = radius - dist;
      pos.x += (dx / dist) * push;
      pos.z += (dz / dist) * push;
      hit = true;
    }
  }
  if (Math.abs(pos.x) > WORLD) {
    pos.x = Math.sign(pos.x) * WORLD;
    hit = true;
  }
  if (pos.z > WORLD) {
    pos.z = WORLD;
    hit = true;
  }
  if (pos.z < OCEAN_Z - WORLD + 40) {
    pos.z = OCEAN_Z - WORLD + 40;
    hit = true;
  }
  return hit;
}
function resolveVsCars() {
  if (pstate.pos.y > 3) return;
  const R = 3.4;
  const bump = (cx, cz) => {
    const dx = pstate.pos.x - cx,
      dz = pstate.pos.z - cz,
      d2 = dx * dx + dz * dz;
    if (d2 < R * R && d2 > 0.0001) {
      const d = Math.sqrt(d2),
        push = R - d;
      pstate.pos.x += (dx / d) * push;
      pstate.pos.z += (dz / d) * push;
      if (Math.abs(pstate.speed) > 12) {
        heat += Math.abs(pstate.speed) * 0.02;
        beep(78, 0.16, "sawtooth", 0.12);
        flash("#ffffff", 0.25);
      }
      pstate.speed *= 0.35;
      return true;
    }
    return false;
  };
  for (const t of traffic) {
    const x = t.onX ? t.along : t.lane,
      z = t.onX ? t.lane : t.along;
    if (bump(x, z)) t.along -= t.dir * 5;
  }
  for (const p of police) bump(p.pos.x, p.pos.z);
}

// ---------- WANTED + BUST ----------
let wanted = 0,
  heat = 0,
  bannerTimer = 0,
  bustMeter = 0,
  busted = false,
  minCopDist = 999,
  sirenT = 0,
  sirenHi = false,
  crimeCd = 0;
const bannerEl = document.getElementById("banner");
function showBanner(t) {
  bannerEl.textContent = t;
  bannerEl.style.opacity = 1;
  bannerTimer = 2.2;
}
function setWanted(n) {
  n = Math.max(0, Math.min(5, n));
  if (n === wanted) return;
  const prev = wanted;
  wanted = n;
  document
    .querySelectorAll("#wanted .star")
    .forEach((s, i) => s.classList.toggle("on", i < wanted));
  while (police.length < wanted * 2) spawnPolice();
  if (wanted > prev) {
    showBanner(
      wanted >= 4 ? "MOST WANTED" : "WANTED " + "\u2605".repeat(wanted),
    );
    beep(880, 0.15);
    beep(660, 0.15, "square", 0.06);
  }
  if (wanted === 0 && prev > 0) {
    showBanner("LOST THEM");
    police.forEach((p) => scene.remove(p.car));
    police.length = 0;
  }
}
function triggerBust() {
  if (busted) return;
  busted = true;
  bustMeter = 0;
  showBanner("BUSTED");
  flash("#5a0000", 0.7);
  beep(200, 0.5, "sawtooth", 0.12);
  setTimeout(() => {
    pstate.pos.set(CELL / 2, 0, 0);
    pstate.speed = 0;
    pstate.heading = 0;
    pstate.vy = 0;
    heat = 0;
    setWanted(0);
    busted = false;
    showBanner("RELEASED");
  }, 1800);
}
function commitCrime(heatAdd, minWanted, label) {
  heat += heatAdd;
  if (minWanted && wanted < minWanted) setWanted(minWanted);
  if (label) showBanner(label);
  crimeCd = 1.0;
  flash("#ff3020", 0.35);
  beep(920, 0.12, "square", 0.1);
  beep(680, 0.12, "square", 0.08);
}

// ---------- HUD ----------
const speedoCtx = document.getElementById("speedo").getContext("2d");
const speedText = document.querySelector("#speedText .num");
const speedUnit = document.querySelector("#speedText .unit");
const gearEl = document.getElementById("gear");
const biomeEl = document.getElementById("biome");
function drawSpeedo(val, max) {
  const c = speedoCtx,
    W = 150,
    R = 62,
    cx = 75,
    cy = 75;
  c.clearRect(0, 0, W, W);
  c.beginPath();
  c.arc(cx, cy, R, 0.75 * Math.PI, 2.25 * Math.PI);
  c.lineWidth = 9;
  c.strokeStyle = "rgba(255,255,255,.12)";
  c.stroke();
  const frac = Math.min(1, Math.abs(val) / max),
    end = 0.75 * Math.PI + frac * 1.5 * Math.PI;
  c.beginPath();
  c.arc(cx, cy, R, 0.75 * Math.PI, end);
  c.lineWidth = 9;
  const grad = c.createLinearGradient(0, 0, W, W);
  grad.addColorStop(0, "#7fffd4");
  grad.addColorStop(0.6, "#ffd23f");
  grad.addColorStop(1, "#ff4d4d");
  c.strokeStyle = grad;
  c.lineCap = "round";
  c.stroke();
  for (let i = 0; i <= 10; i++) {
    const a = 0.75 * Math.PI + (i / 10) * 1.5 * Math.PI;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * (R - 14), cy + Math.sin(a) * (R - 14));
    c.lineTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8));
    c.strokeStyle = "rgba(255,255,255,.35)";
    c.lineWidth = 2;
    c.stroke();
  }
}
const MM_RANGE = 460;
const mmCtx = document.getElementById("minimap").getContext("2d");
function drawMinimap() {
  const c = mmCtx,
    cx = 95,
    cy = 95,
    sc = 92 / MM_RANGE;
  const h = pstate.heading,
    ch = Math.cos(h),
    sh = Math.sin(h),
    px = pstate.pos.x,
    pz = pstate.pos.z;
  const P = (wx, wz) => {
    const dx = wx - px,
      dz = wz - pz;
    return [cx - (dx * ch - dz * sh) * sc, cy - (dx * sh + dz * ch) * sc];
  };
  c.clearRect(0, 0, 190, 190);
  c.save();
  c.beginPath();
  c.arc(cx, cy, 92, 0, 7);
  c.clip();
  c.fillStyle = "#5a8a43";
  c.fillRect(0, 0, 190, 190);
  const poly = (pts, col) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    c.fill();
  };
  const region = (x0, z0, x1, z1, col) =>
    poly([P(x0, z0), P(x1, z0), P(x1, z1), P(x0, z1)], col);
  region(-WORLD, CITY_EDGE, WORLD, WORLD, "#d9c18a");
  region(-WORLD, OCEAN_Z, WORLD, -CITY_EDGE, "#e8d7a2");
  region(-WORLD, -WORLD, WORLD, OCEAN_Z, "#2a6f97");
  region(CITY_EDGE, -CITY_EDGE, WORLD, CITY_EDGE, "#4f7d3a");
  region(-CITY_EDGE, -CITY_EDGE, CITY_EDGE, CITY_EDGE, "#33363d");
  c.strokeStyle = "#565b66";
  c.lineWidth = 2;
  for (let i = -Math.floor(GRID / 2); i <= Math.floor(GRID / 2) + 1; i++) {
    const p = i * CELL - CELL / 2;
    let a = P(-HALF, p),
      b = P(HALF, p);
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.stroke();
    a = P(p, -HALF);
    b = P(p, HALF);
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.stroke();
  }
  c.fillStyle = "#5fa8ff";
  for (const t of traffic) {
    const tx = t.onX ? t.along : t.lane,
      tz = t.onX ? t.lane : t.along;
    const q = P(tx, tz);
    c.beginPath();
    c.arc(q[0], q[1], 2, 0, 7);
    c.fill();
  }
  c.fillStyle = "#ff3b3b";
  for (const p of police) {
    const q = P(p.pos.x, p.pos.z);
    c.beginPath();
    c.arc(q[0], q[1], 3, 0, 7);
    c.fill();
  }
  c.restore();
  c.fillStyle = "#ffd23f";
  c.beginPath();
  c.moveTo(cx, cy - 8);
  c.lineTo(cx + 5, cy + 6);
  c.lineTo(cx, cy + 3);
  c.lineTo(cx - 5, cy + 6);
  c.closePath();
  c.fill();
}
function biomeName(x, z) {
  if (inCity(x, z)) return "DOWNTOWN";
  if (z > CITY_EDGE) return "THE DUNES";
  if (z < OCEAN_Z) return "OCEAN";
  if (z < -CITY_EDGE) return "SUNSET BEACH";
  if (x > CITY_EDGE) return "HIGHLAND HILLS";
  return "GREAT PLAINS";
}

// ---------- CLOCK ----------
let tmin = 8 * 60;
const clockEl = document.getElementById("clock");
const clock = new THREE.Clock();
let running = false,
  blink = 0;

function updateGround(dt) {
  const throttle = keys["KeyW"] || keys["ArrowUp"] ? 1 : 0;
  const reverse = keys["KeyS"] || keys["ArrowDown"] ? 1 : 0;
  const braking = keys["Space"] ? 1 : 0;
  if (throttle) pstate.speed += veh.accel * dt;
  else if (reverse) pstate.speed -= veh.accel * 0.6 * dt;
  else pstate.speed *= 1 - 1.3 * dt;
  if (braking) pstate.speed *= 1 - 3.2 * dt;
  pstate.speed = Math.max(
    -veh.maxFwd * 0.3,
    Math.min(veh.maxFwd, pstate.speed),
  );
  if (Math.abs(pstate.speed) < 0.05) pstate.speed = 0;
  const steerInput =
    (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0) -
    (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0);
  const speedFrac = Math.min(1, Math.abs(pstate.speed) / 16);
  const turnRate = veh.handling * speedFrac * Math.sign(pstate.speed || 1);
  pstate.steer = THREE.MathUtils.lerp(pstate.steer, steerInput, 0.18);
  pstate.heading += pstate.steer * turnRate * dt;
  pstate.pos.x += Math.sin(pstate.heading) * pstate.speed * dt;
  pstate.pos.z += Math.cos(pstate.heading) * pstate.speed * dt;
  pstate.pos.y = 0;
  if (collideCircle(pstate.pos, 1.9)) {
    const impact = Math.abs(pstate.speed);
    if (impact > 16) {
      beep(90, 0.18, "sawtooth", 0.12);
      flash("#ffffff", 0.3);
    }
    if (impact > 8 && crimeCd <= 0) commitCrime(3, 1, "CRASH! WANTED");
    pstate.speed *= 0.25;
  }
  resolveVsCars();
  player.position.copy(pstate.pos);
  player.rotation.set(0, pstate.heading, 0);
  const spin = pstate.speed * dt * 2;
  player.userData.wheels.forEach((w, i) => {
    w.rotation.x += spin;
    if (i < 2) w.rotation.y = pstate.steer * 0.5;
  });
  player.userData.tailMat.emissiveIntensity = braking ? 2.5 : 1;
  if (Math.abs(pstate.speed) > 30) heat += dt * 0.3;
  if (
    Math.abs(pstate.speed) > 16 &&
    (braking || Math.abs(pstate.steer) > 0.6)
  ) {
    const bx = pstate.pos.x - Math.sin(pstate.heading) * 2,
      bz = pstate.pos.z - Math.cos(pstate.heading) * 2;
    spawnSmoke(
      bx + (Math.random() - 0.5) * 2,
      0.3,
      bz + (Math.random() - 0.5) * 2,
    );
  }
}
function updateAir(dt) {
  const up = keys["Space"] ? 1 : 0,
    down =
      keys["ShiftLeft"] || keys["ShiftRight"] || keys["ControlLeft"] ? 1 : 0;
  const fwd = keys["KeyW"] || keys["ArrowUp"] ? 1 : 0,
    back = keys["KeyS"] || keys["ArrowDown"] ? 1 : 0;
  const yaw =
    (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0) -
    (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0);
  pstate.heading += yaw * 1.5 * dt;
  if (fwd) pstate.speed += veh.accel * dt;
  else if (back) pstate.speed -= veh.accel * dt;
  else pstate.speed *= 1 - 1.4 * dt;
  pstate.speed = Math.max(
    -veh.maxFwd * 0.5,
    Math.min(veh.maxFwd, pstate.speed),
  );
  pstate.vy += (up * 34 - down * 34) * dt;
  if (!up && !down) pstate.vy -= 7 * dt;
  pstate.vy = THREE.MathUtils.clamp(pstate.vy, -30, 34);
  pstate.pos.x += Math.sin(pstate.heading) * pstate.speed * dt;
  pstate.pos.z += Math.cos(pstate.heading) * pstate.speed * dt;
  pstate.pos.y += pstate.vy * dt;
  if (pstate.pos.y < 0) {
    pstate.pos.y = 0;
    pstate.vy = 0;
  }
  if (pstate.pos.y > 260) {
    pstate.pos.y = 260;
    pstate.vy = Math.min(0, pstate.vy);
  }
  pstate.pos.x = THREE.MathUtils.clamp(pstate.pos.x, -WORLD, WORLD);
  pstate.pos.z = THREE.MathUtils.clamp(
    pstate.pos.z,
    OCEAN_Z - WORLD + 40,
    WORLD,
  );
  player.position.copy(pstate.pos);
  player.rotation.set(
    -(pstate.speed / veh.maxFwd) * 0.28,
    pstate.heading,
    -yaw * 0.22,
  );
  player.userData.mainRotor.rotation.y += 26 * dt;
  player.userData.tailRotor.rotation.x += 40 * dt;
}
function updatePeds(dt) {
  const air = veh.type === "air";
  for (const p of peds) {
    const dx = pstate.pos.x - p.pos.x,
      dz = pstate.pos.z - p.pos.z,
      d2 = dx * dx + dz * dz;
    if (!air && !busted && d2 < 100) {
      p.heading = Math.atan2(-dx, -dz);
      p.flee = 1.2;
      if (d2 < 4 && Math.abs(pstate.speed) > 8) {
        commitCrime(5, 2, "HIT & RUN! WANTED");
        const s = findPedSpot();
        p.pos.set(s.x, 0, s.z);
      }
    }
    let speed = 1.2;
    if (p.flee > 0) {
      p.flee -= dt;
      speed = 3.4;
    } else {
      p.turn -= dt;
      if (p.turn <= 0) {
        p.heading += (Math.random() - 0.5) * 1.6;
        p.turn = 1 + Math.random() * 3;
      }
    }
    p.pos.x += Math.sin(p.heading) * speed * dt;
    p.pos.z += Math.cos(p.heading) * speed * dt;
    if (Math.abs(p.pos.x) > CITY_EDGE) {
      p.pos.x = Math.sign(p.pos.x) * CITY_EDGE;
      p.heading += Math.PI;
    }
    if (Math.abs(p.pos.z) > CITY_EDGE) {
      p.pos.z = Math.sign(p.pos.z) * CITY_EDGE;
      p.heading += Math.PI;
    }
    p.g.position.copy(p.pos);
    p.g.rotation.y = p.heading;
    p.phase += speed * dt * 4;
    const sw = Math.sin(p.phase) * 0.6;
    p.g.userData.legs[0].rotation.x = sw;
    p.g.userData.legs[1].rotation.x = -sw;
    p.g.userData.arms[0].rotation.x = -sw;
    p.g.userData.arms[1].rotation.x = sw;
  }
}

function update(dt) {
  if (!busted) {
    if (veh.type === "air") updateAir(dt);
    else updateGround(dt);
  } else {
    pstate.speed *= 0.85;
    player.position.copy(pstate.pos);
  }

  heat = Math.max(0, heat - dt * 0.25);
  crimeCd = Math.max(0, crimeCd - dt);
  if (heat > 3 && wanted < 1) setWanted(1);
  if (heat > 8) setWanted(Math.min(5, Math.floor(heat / 4)));
  if (heat <= 0.05 && bustMeter <= 0) setWanted(0);

  updatePeds(dt);
  updateParticles(dt);

  for (const t of traffic) {
    t.along += t.dir * t.speed * dt;
    const lim = (GRID * CELL) / 2 + 20;
    if (t.along > lim) t.along = -lim;
    if (t.along < -lim) t.along = lim;
    const x = t.onX ? t.along : t.lane,
      z = t.onX ? t.lane : t.along;
    t.car.position.set(x, 0, z);
    t.car.rotation.y = t.onX
      ? t.dir > 0
        ? Math.PI / 2
        : -Math.PI / 2
      : t.dir > 0
        ? 0
        : Math.PI;
    t.car.userData.wheels.forEach((w) => (w.rotation.x += t.speed * dt * 2));
  }
  for (const a of aiHelis) {
    a.phase += a.sp * dt;
    a.h.position.set(
      a.cx + Math.cos(a.phase) * a.r,
      a.alt,
      a.cz + Math.sin(a.phase) * a.r,
    );
    a.h.rotation.y = -a.phase + Math.PI / 2;
    a.h.userData.mainRotor.rotation.y += 26 * dt;
    a.h.userData.tailRotor.rotation.x += 40 * dt;
  }

  blink += dt;
  minCopDist = 999;
  for (const p of police) {
    const toP = new THREE.Vector3().subVectors(pstate.pos, p.pos);
    toP.y = 0;
    const dist = toP.length();
    minCopDist = Math.min(minCopDist, dist);
    const desired = Math.atan2(toP.x, toP.z);
    let diff = ((desired - p.heading + Math.PI) % (Math.PI * 2)) - Math.PI;
    p.heading += THREE.MathUtils.clamp(diff, -2.4 * dt, 2.4 * dt);
    const target = dist > 9 ? 30 + wanted * 3 : Math.max(0, (dist - 4) * 4);
    p.speed = THREE.MathUtils.lerp(p.speed, target, 0.06);
    p.pos.x += Math.sin(p.heading) * p.speed * dt;
    p.pos.z += Math.cos(p.heading) * p.speed * dt;
    collideCircle(p.pos, 1.9);
    p.car.position.copy(p.pos);
    p.car.rotation.y = p.heading;
    p.car.userData.wheels.forEach((w) => (w.rotation.x += p.speed * dt * 2));
    const on = Math.floor(blink * 6) % 2;
    p.car.userData.lights[0].emissiveIntensity = on ? 3 : 0.2;
    p.car.userData.lights[1].emissiveIntensity = on ? 0.2 : 3;
  }
  sirenT += dt;
  if (police.length && sirenT > 0.45) {
    sirenT = 0;
    sirenHi = !sirenHi;
    beep(sirenHi ? 760 : 560, 0.28, "sawtooth", 0.05);
  }

  const canBust = wanted > 0 && !busted && veh.type !== "air";
  if (canBust && minCopDist < 8 && Math.abs(pstate.speed) < 9)
    bustMeter += dt * 0.5;
  else bustMeter -= dt * 0.8;
  bustMeter = Math.max(0, Math.min(1, bustMeter));
  if (bustMeter >= 1) triggerBust();
  const showBust = canBust && bustMeter > 0.02;
  bustWrap.style.opacity = showBust ? 1 : 0;
  bustLabel.style.opacity = showBust ? 1 : 0;
  bustBar.style.width = bustMeter * 100 + "%";

  const beaconOn = Math.floor(blink * 1.5) % 2,
    pulse = 1.8 + Math.sin(blink * 3) * 0.6;
  for (const b of techBeacons) {
    b.mat.emissiveIntensity = beaconOn ? 3 : 0.3;
    b.band.emissiveIntensity = pulse;
  }
  if (player && player.userData.glow)
    player.userData.glow.emissiveIntensity = 2 + Math.sin(blink * 6) * 0.8;

  if (keys["KeyH"] && !keys._hornLatch) {
    beep(330, 0.3, "square", 0.12);
    keys._hornLatch = true;
  }
  if (!keys["KeyH"]) keys._hornLatch = false;
  if (keys["KeyR"]) {
    pstate.pos.set(CELL / 2, 0, 0);
    pstate.speed = 0;
    pstate.heading = 0;
    pstate.vy = 0;
    heat = 0;
    bustMeter = 0;
    setWanted(0);
    keys["KeyR"] = false;
  }
  if (keys["KeyV"] && !keys._vLatch) {
    keys._vLatch = true;
    openGarage();
  }
  if (!keys["KeyV"]) keys._vLatch = false;

  if (keys["KeyC"] && !keys._cLatch) {
    keys._cLatch = true;
    camMode = (camMode + 1) % CAM_MODES.length;
    showBanner("VIEW: " + CAM_MODES[camMode]);
  }
  if (!keys["KeyC"]) keys._cLatch = false;
  camYaw += ((keys["KeyE"] ? 1 : 0) - (keys["KeyQ"] ? 1 : 0)) * 1.5 * dt;
  camYaw *= keys["KeyQ"] || keys["KeyE"] ? 1 : 0.9;
  const air = veh.type === "air";
  const speedFrac = Math.min(1, Math.abs(pstate.speed) / veh.maxFwd);
  const chd = pstate.heading + camYaw,
    fx = Math.sin(chd),
    fz = Math.cos(chd);
  const px = pstate.pos.x,
    py = pstate.pos.y,
    pz = pstate.pos.z;
  const mode = CAM_MODES[camMode];
  camera.up.set(0, 1, 0);
  let targetFov = 62;
  if (mode === "CHASE" || mode === "FAR") {
    const dist =
      (mode === "FAR" ? 18 : 11) +
      (air ? 5 : 0) +
      Math.min(6, Math.abs(pstate.speed) * 0.12);
    const hgt =
      (mode === "FAR" ? 9 : 5.2) + (air ? pstate.pos.y * 0.15 + 2 : 0);
    camera.position.lerp(
      new THREE.Vector3(px - fx * dist, py + hgt, pz - fz * dist),
      1 - Math.pow(0.001, dt),
    );
    camera.lookAt(px, py + 1.5, pz);
    targetFov = 62 + (air ? 0 : speedFrac * 12);
  } else if (mode === "TOP") {
    camera.up.set(fx, 0, fz);
    camera.position.set(px, py + 42, pz);
    camera.lookAt(px, py, pz);
    targetFov = 60;
  } else if (mode === "HOOD") {
    camera.position.set(px + fx * 2.4, py + 1.15, pz + fz * 2.4);
    camera.lookAt(px + fx * 14, py + 1.05, pz + fz * 14);
    targetFov = 68 + speedFrac * 8;
  } else {
    // COCKPIT
    camera.position.set(px - fx * 0.1, py + 1.55, pz - fz * 0.1);
    camera.lookAt(px + fx * 12, py + 1.45, pz + fz * 12);
    targetFov = 72 + speedFrac * 8;
  }
  player.visible = mode !== "COCKPIT";
  camera.fov += (targetFov - camera.fov) * 0.2;
  camera.updateProjectionMatrix();
  sun.target.position.copy(pstate.pos);
  sun.position.set(px + 220, 340, pz + 160);
  vignEl.style.opacity = air ? 0 : Math.min(0.55, speedFrac * 0.7);

  const posn = ocean.geometry.attributes.position;
  const tsec = clock.elapsedTime;
  for (let i = 0; i < posn.count; i++) {
    const ox = oceanBase[i * 3],
      oy = oceanBase[i * 3 + 1];
    posn.setZ(
      i,
      Math.sin(ox * 0.02 + tsec) * 1.6 + Math.cos(oy * 0.03 + tsec * 0.8) * 1.2,
    );
  }
  posn.needsUpdate = true;

  updateEngineSound();

  if (air) {
    drawSpeedo(pstate.pos.y, 260);
    speedText.textContent = Math.round(pstate.pos.y);
    speedUnit.textContent = "ALT m";
    gearEl.textContent = pstate.vy > 1 ? "UP" : pstate.vy < -1 ? "DN" : "HOV";
  } else {
    const kmh = Math.abs(pstate.speed) * 3.6;
    drawSpeedo(kmh, 180);
    speedText.textContent = Math.round(kmh);
    speedUnit.textContent = "KM/H";
    gearEl.textContent = pstate.speed < -0.1 ? "R" : keys["Space"] ? "B" : "D";
  }
  drawMinimap();
  biomeEl.textContent = biomeName(pstate.pos.x, pstate.pos.z);
  tmin = (tmin + dt * 1.5) % 1440;
  clockEl.textContent = `${String(Math.floor(tmin / 60)).padStart(2, "0")}:${String(Math.floor(tmin % 60)).padStart(2, "0")}`;
  if (bannerTimer > 0) {
    bannerTimer -= dt;
    if (bannerTimer <= 0) bannerEl.style.opacity = 0;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  if (running && player) update(dt);
  renderer.render(scene, camera);
}
animate();
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- GARAGE ----------
const loader = document.getElementById("loader"),
  barFill = document.getElementById("barFill"),
  startBtn = document.getElementById("startBtn"),
  garage = document.getElementById("garage");
let selected = 0;
function renderGarage() {
  garage.innerHTML = "";
  VEHICLES.forEach((v, i) => {
    const card = document.createElement("div");
    card.className = "vcard" + (i === selected ? " sel" : "");
    const hex = "#" + v.color.toString(16).padStart(6, "0");
    card.innerHTML = `<div class="vswatch" style="background:${hex}"></div><div class="vname">${v.name}</div><div class="vtag">${v.type === "air" ? "\u2708 AIR" : "\u{1F697} GROUND"}</div><div class="vdesc">${v.desc}</div>`;
    card.onclick = () => {
      selected = i;
      renderGarage();
    };
    garage.appendChild(card);
  });
}
function openGarage() {
  running = false;
  loader.style.display = "flex";
  requestAnimationFrame(() => (loader.style.opacity = 1));
  startBtn.textContent = "SPAWN VEHICLE";
  renderGarage();
}
let lp = 0;
const loadInt = setInterval(() => {
  lp = Math.min(100, lp + 9 + Math.random() * 14);
  barFill.style.width = lp + "%";
  if (lp >= 100) {
    clearInterval(loadInt);
    startBtn.style.opacity = 1;
    renderGarage();
  }
}, 110);
startBtn.addEventListener("click", () => {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  makePlayer(VEHICLES[selected]);
  running = true;
  loader.style.opacity = 0;
  setTimeout(() => (loader.style.display = "none"), 500);
  showBanner("WELCOME TO " + biomeName(pstate.pos.x, pstate.pos.z));
  beep(523, 0.1);
  beep(659, 0.1);
  setTimeout(() => beep(784, 0.2), 120);
});
