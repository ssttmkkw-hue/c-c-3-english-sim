import * as THREE from 'three';

function softTexture(draw) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  draw(canvas.getContext('2d'));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function skyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, '#7ec8ef');
  sky.addColorStop(0.45, '#b9e2f6');
  sky.addColorStop(0.78, '#d7f0fb');
  sky.addColorStop(1, '#fff4e0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * Day sky, a few drifting clouds, park leaves, and cafe steam.
 * Counts stay small so phones do not pay for a particle system.
 */
export function createAmbience(scene) {
  scene.background = new THREE.Color(0xb9e2f6);
  scene.fog = new THREE.Fog(0xd7f0fb, 22, 58);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(78, 16, 12),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  const cloudTex = softTexture((ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.ellipse(64, 72, 46, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(42, 68, 24, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(86, 66, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  const clouds = [];
  const cloudSpots = [
    { x: -8, y: 6.4, z: 10, s: 11, speed: 0.12 },
    { x: 18, y: 5.8, z: 16, s: 9.5, speed: 0.09 },
    { x: 6, y: 6.8, z: -22, s: 10, speed: 0.1 },
  ];
  for (const spot of cloudSpots) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cloudTex,
      transparent: true,
      depthWrite: false,
      fog: false,
      opacity: 0.88,
    }));
    sprite.position.set(spot.x, spot.y, spot.z);
    sprite.scale.set(spot.s * 1.8, spot.s, 1);
    sprite.userData.baseX = spot.x;
    sprite.userData.speed = spot.speed;
    sprite.userData.phase = spot.x;
    scene.add(sprite);
    clouds.push(sprite);
  }

  const leafCount = 20;
  const leafPositions = new Float32Array(leafCount * 3);
  const leafColors = new Float32Array(leafCount * 3);
  const leaves = [];
  for (let i = 0; i < leafCount; i++) {
    const leaf = {
      x: 5 + Math.random() * 16,
      y: 1 + Math.random() * 7,
      z: -21 + Math.random() * 16,
      speed: 0.35 + Math.random() * 0.45,
      sway: Math.random() * Math.PI * 2,
      drift: 0.15 + Math.random() * 0.25,
    };
    leaves.push(leaf);
    const warm = Math.random() < 0.35;
    leafColors[i * 3] = warm ? 0.96 : 0.45;
    leafColors[i * 3 + 1] = warm ? 0.65 : 0.72;
    leafColors[i * 3 + 2] = warm ? 0.28 : 0.38;
    leafPositions[i * 3] = leaf.x;
    leafPositions[i * 3 + 1] = leaf.y;
    leafPositions[i * 3 + 2] = leaf.z;
  }
  const leafTex = softTexture((ctx) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(64, 64, 18, 34, 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3));
  leafGeo.setAttribute('color', new THREE.BufferAttribute(leafColors, 3));
  const leafPoints = new THREE.Points(
    leafGeo,
    new THREE.PointsMaterial({
      map: leafTex,
      size: 0.34,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  scene.add(leafPoints);

  const steamTex = softTexture((ctx) => {
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    g.addColorStop(0, 'rgba(255,255,255,0.65)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  const steamMat = new THREE.SpriteMaterial({
    map: steamTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.45,
  });
  const puffs = [];
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Sprite(steamMat.clone());
    puff.userData.life = Math.random();
    puff.userData.speed = 0.28 + Math.random() * 0.18;
    scene.add(puff);
    puffs.push(puff);
  }
  const steamOrigin = new THREE.Vector3(-18.16, 1.72, -11.88);

  let time = 0;
  function update(dt) {
    time += dt;
    for (const cloud of clouds) {
      const x = cloud.userData.baseX + Math.sin(time * cloud.userData.speed + cloud.userData.phase) * 3.2;
      cloud.position.x = x;
    }
    const pos = leafGeo.attributes.position;
    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];
      leaf.y -= leaf.speed * dt;
      leaf.sway += dt * 1.4;
      leaf.x += Math.sin(leaf.sway) * leaf.drift * dt;
      if (leaf.y < 0.15) {
        leaf.y = 6.5 + Math.random() * 2;
        leaf.x = 5 + Math.random() * 16;
        leaf.z = -21 + Math.random() * 16;
      }
      pos.setXYZ(i, leaf.x, leaf.y, leaf.z);
    }
    pos.needsUpdate = true;
    for (const puff of puffs) {
      puff.userData.life += dt * puff.userData.speed;
      if (puff.userData.life > 1) puff.userData.life -= 1;
      const life = puff.userData.life;
      const rise = life * 0.85;
      puff.position.set(
        steamOrigin.x + Math.sin(life * 6.2) * 0.08,
        steamOrigin.y + rise,
        steamOrigin.z + Math.cos(life * 5.1) * 0.06,
      );
      const scale = 0.28 + life * 0.85;
      puff.scale.set(scale, scale, 1);
      puff.material.opacity = life < 0.12 ? life / 0.12 * 0.55 : (1 - life) * 0.6;
    }
  }

  return { update };
}
