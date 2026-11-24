/* eslint-disable */
(()=>{/*! Supplied HTML adaptation. Design reference: @kaolti.
   No separate source license was supplied or verified. */function Ge(k,ee={}){const{document:R,window:te,on:C,requestAnimationFrame:qe,cancelAnimationFrame:$e}=k;let L={...ee},b=!1,V=null,le=null,Y=0;const ke=e=>Number.isInteger(e)?(e%4+4)%4:0,A=()=>k.reduced(),ae=()=>!L.paused&&!R.hidden&&!A(),d=R.getElementById("stage"),G=Array.from(R.querySelectorAll(".card")),z=R.getElementById("gl-canvas"),se=R.getElementById("fx-mid"),ce=R.getElementById("fx-front"),y=se.getContext("2d"),r=ce.getContext("2d");let a=z.getContext("webgl2",{alpha:!1,antialias:!1,powerPreference:"high-performance"});const be=a,we=[],K=(e,t)=>(we.push({kind:e,value:t}),t),Re=a?null:z.getContext("2d"),Ee=`#version 300 es
    in vec2 aPos;
    out vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `,Ve=`#version 300 es
    precision mediump float;
    in vec2 vUv;
    out vec4 fragColor;

    uniform vec2 uRes;
    uniform float uTime;
    uniform vec4 uCard0;
    uniform vec4 uCard1;
    uniform vec4 uCard2;
    uniform vec4 uCard3;
    uniform vec4 uInt;
    uniform vec3 uAmbient;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    const mat2 ROT = mat2(0.80, -0.60, 0.60, 0.80);

    float fbm4(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p = ROT * p * 2.03 + vec2(17.1, 31.7);
        a *= 0.5;
      }
      return v;
    }

    float fbm3(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 3; i++) {
        v += a * vnoise(p);
        p = ROT * p * 2.02 + vec2(9.3, 13.7);
        a *= 0.5;
      }
      return v;
    }

    float sdPill(vec2 p, float halfW, float halfH) {
      float seg = max(0.0, halfH - halfW);
      vec2 q = vec2(p.x, p.y - clamp(p.y, -seg, seg));
      return length(q) - halfW;
    }

    // 1. EMBER: Silky, vertically-stretched wispy flame tongues matching 01_ember_active.png
    //    Layered translucent scarlet outer veil + roaring vermilion tongues + smooth white-hot top plasma
    vec3 renderEmber(vec2 fragPx, vec4 card, float inten) {
      vec2 p = (fragPx - card.xy) / card.z;
      float rMask = smoothstep(2.5, 1.25, length(p * vec2(1.0, 0.68)));
      if (rMask <= 0.001) return vec3(0.0);

      float halfW = 0.5;
      float halfH = 0.5 * (card.w / card.z);
      float d = sdPill(p, halfW, halfH);

      float rimStage   = smoothstep(0.00, 0.40, inten);
      float plumeStage = smoothstep(0.16, 0.96, inten);
      float crownStage = smoothstep(0.38, 1.00, inten);

      float t = uTime * 1.15;

      // Anisotropic vertical stretch: fire rises into sleek, silky vertical tongues (NOT round blobs!)
      float hAbove = max(0.0, p.y - (halfH - 0.35));
      // Gentle inward flame taper + organic side flicker as flames rise
      float sway = sin(p.y * 3.2 - t * 2.8) * 0.06 * hAbove;
      vec2 uv = vec2((p.x + sway) * (1.0 + hAbove * 0.28), p.y);

      // Vertically elongated domain-warped coordinates (x high-freq, y stretched!)
      vec2 warp = vec2(
        fbm3(vec2(uv.x * 3.4, uv.y * 1.35 - t * 1.45)) - 0.5,
        fbm3(vec2(uv.x * 3.4 + 4.7, uv.y * 1.35 - t * 1.85)) - 0.5
      );

      // Two silky vertical flame tongue layers (broad silk tongues + fine wispy licks)
      float nBroad = fbm4(vec2(uv.x * 4.2 + warp.x * 1.2, uv.y * 1.55 + warp.y * 0.6 - t * 2.1));
      float nWisp  = fbm3(vec2(uv.x * 8.5 + warp.x * 1.6, uv.y * 2.40 + warp.y * 0.8 - t * 3.2));

      // Concentrate flames smoothly from upper shoulders & top dome; keep lower half ultra-sleek
      float topMask = smoothstep(-0.18, 0.52, p.y / halfH);
      float lateralTaper = exp(-pow(abs(uv.x) / (0.58 + 0.14 * (1.0 - topMask)), 2.8));

      // Silky outer scarlet flame veil (tall, translucent, feathery)
      float outerReach = mix(0.035 * rimStage, 0.98 * plumeStage, topMask);
      float outerField = d - (nBroad * 0.78 + nWisp * 0.30 - 0.10) * outerReach;
      float outerVeil = smoothstep(0.24, -0.08, outerField) * smoothstep(halfH + mix(0.08, 1.22, plumeStage), halfH - 0.10, p.y);
      outerVeil *= (0.45 + 0.55 * nBroad) * lateralTaper * plumeStage;

      // Inner bright fiery vermilion-orange flame tongues (sharper, silkier, licking upward)
      float innerReach = mix(0.025 * rimStage, 0.62 * plumeStage, topMask);
      float innerField = d - (nBroad * 0.65 + nWisp * 0.42 - 0.14) * innerReach;
      float innerTongues = smoothstep(0.14, -0.06, innerField) * smoothstep(halfH + mix(0.06, 0.82, plumeStage), halfH - 0.15, p.y);
      innerTongues *= (0.52 + 0.48 * nWisp) * plumeStage;

      // Smooth incandescent white-gold plasma core hugging the top semicircle
      float crownDist = length(vec2(p.x * 1.18, (p.y - halfH * 0.96) * 2.05));
      float crownCore = exp(-crownDist * 4.4) * (0.82 + 0.24 * nWisp) * crownStage;
      float crownHalo = exp(-crownDist * 2.4) * (0.70 + 0.30 * nBroad) * crownStage;

      // Razor-sleek fiery contour hugging the pill sides & bottom
      float tightRim = exp(-max(0.0, d) * 28.0) * (0.62 + 0.38 * nBroad) * mix(0.55, 1.0, topMask) * rimStage;
      float softGlow = exp(-max(0.0, d) * 3.0) * 0.24 * rimStage;

      vec3 colScarlet = vec3(0.86, 0.08, 0.03);
      vec3 colFlame   = vec3(1.00, 0.30, 0.05);
      vec3 colGold    = vec3(1.00, 0.74, 0.28);
      vec3 colWhite   = vec3(1.00, 0.96, 0.88);

      vec3 col = colScarlet * softGlow;
      col += colScarlet * outerVeil * 1.05;
      col += mix(colFlame, colGold, clamp(innerTongues * 0.75 + crownHalo * 0.5, 0.0, 1.0)) * innerTongues * 1.10;
      col += colGold * crownHalo * 0.52;
      col += colWhite * crownCore * 1.22;
      col += mix(colFlame, colGold, topMask * 0.5) * tightRim * 0.85;

      return col * rMask;
    }

    // 2. SOLAR: Needle-fine 360\xB0 golden god-rays + blinding white-gold corona + tight clean falloff
    vec3 renderSolar(vec2 fragPx, vec4 card, float inten) {
      vec2 p = (fragPx - card.xy) / card.z;
      float rLen = length(p * vec2(0.88, 0.74));
      float envMask = smoothstep(2.45, 1.05, rLen);
      if (envMask <= 0.001) return vec3(0.0);

      float halfW = 0.5;
      float halfH = 0.5 * (card.w / card.z);
      float d = sdPill(p, halfW, halfH);

      float coronaStage = smoothstep(0.00, 0.42, inten);
      float rayStage    = smoothstep(0.24, 1.00, inten);
      float rayReach    = 1.0 - pow(1.0 - rayStage, 2.5);

      // High-frequency needle-fine 360\xB0 golden shafts matching 05_transition_solar_to_ember.png
      vec2 rayDir = normalize(vec2(p.x, p.y * 0.72) + vec2(1e-5));
      float r1 = vnoise(rayDir * 12.0 + vec2(uTime * 0.28, -uTime * 0.18));
      float r2 = vnoise(rayDir * 34.0 + vec2(-uTime * 0.48, uTime * 0.34));
      float r3 = vnoise(rayDir * 76.0 + vec2(uTime * 0.72, uTime * 0.52));

      float rays = pow(clamp(r1 * 0.38 + r2 * 0.40 + r3 * 0.32, 0.0, 1.0), 2.25);
      float sharpRays = pow(clamp(r2 * 0.44 + r3 * 0.66, 0.0, 1.0), 3.4);

      float distOut = max(0.0, d);
      float decayMul = mix(6.8, 1.0, rayReach);
      // Slightly tighter decay so rays frame Solar dramatically without washing out neighbor cards
      float rayFade = exp(-distOut * (2.68 - rays * 1.25) * decayMul) * rayStage;
      float longShafts = exp(-distOut * (1.72 - sharpRays * 0.72) * decayMul) * sharpRays * rayStage;

      // Subtle sparkling stardust near the corona edge
      float sparkle = pow(hash21(floor(fragPx * 0.65)), 18.0) * exp(-distOut * 5.2) * rayStage * 1.8;

      float innerCorona = exp(-distOut * 25.0) * 1.85 * coronaStage;
      float midCorona   = exp(-distOut * mix(14.0, 7.8, rayReach)) * 0.86 * coronaStage;
      float outerGlow   = exp(-distOut * 2.25) * 0.24 * rayStage;

      vec3 colGold  = vec3(1.00, 0.66, 0.12);
      vec3 colAmber = vec3(0.95, 0.44, 0.04);
      vec3 colWhite = vec3(1.00, 0.98, 0.90);

      vec3 col = colAmber * outerGlow;
      col += mix(colAmber, colGold, rays) * (rayFade * rays * 1.85);
      col += mix(colGold, colWhite, 0.58) * (longShafts * 1.65);
      col += mix(colGold, colWhite, 0.68) * midCorona;
      col += colWhite * (innerCorona + sparkle);

      return col * envMask;
    }

    // 3. BREEZE: True 2D Aerodynamic Potential-Flow Wind Tunnel Streamlines + Waist Pinch Cusps!
    //    Air enters horizontally from the left, parts smoothly over the top & bottom of the pill,
    //    pinches sharply at the left/right waist, and sweeps out to the right \u2014 ZERO concentric blobs!
    vec3 renderBreeze(vec2 fragPx, vec4 card, float inten) {
      vec2 p = (fragPx - card.xy) / card.z;
      // Elliptical wind-tunnel envelope (wider horizontally, tight vertically)
      float envMask = smoothstep(1.95, 0.92, length(p * vec2(0.76, 0.88)));
      if (envMask <= 0.001) return vec3(0.0);

      float halfW = 0.5;
      float halfH = 0.5 * (card.w / card.z);
      float d = sdPill(p, halfW, halfH);
      float distOut = max(0.0, d);

      float auraStage = smoothstep(0.00, 0.40, inten);
      float windStage = smoothstep(0.22, 1.00, inten);

      // 2D potential flow streamfunction around an elliptical body:
      // psi = y * (1 - R^2 / r^2) -> streamlines deflect smoothly around the pill!
      vec2 pe = vec2(p.x * 0.92, p.y * 0.66);
      float r2 = max(0.24, dot(pe, pe));
      float psi = pe.y * (1.0 - 0.34 / r2);
      // Add gentle organic wind undulation
      float t = uTime * 1.35;
      float flowCoordX = pe.x - t * 0.85;
      float undulate = fbm3(vec2(flowCoordX * 1.4, psi * 2.2)) * 0.22;
      float psiWarped = psi + undulate;

      // Layered silky aerodynamic wind-ribbon sheets flowing horizontally around the pill!
      float sheet1 = sin(psiWarped * 24.0 + vnoise(vec2(flowCoordX * 2.5, psi * 4.0)) * 2.6) * 0.5 + 0.5;
      float sheet2 = sin(psiWarped * 46.0 - vnoise(vec2(flowCoordX * 4.0 + 3.1, psi * 6.0)) * 2.2) * 0.5 + 0.5;

      // Modulate streaks along flow direction so they appear as sweeping wind gusts rather than solid bars
      float gustMask = smoothstep(0.22, 0.78, vnoise(vec2(flowCoordX * 2.4, psi * 6.5)));
      float spreadDecay = mix(9.5, 3.6, windStage);
      float radialFade = exp(-distOut * spreadDecay) * smoothstep(-0.02, 0.04, d);

      float softSheets = pow(sheet1, 2.2) * (0.45 + 0.55 * gustMask) * radialFade * windStage;
      float fineStreaks = pow(sheet2, 4.5) * gustMask * exp(-distOut * mix(9.0, 2.8, windStage)) * smoothstep(0.03, 0.12, distOut) * windStage;

      // Tight luminous cyan-emerald contour glow hugging the pill
      float rim = exp(-distOut * 19.0) * 1.25 * auraStage;
      float softAura = exp(-distOut * 3.4) * 0.32 * auraStage;

      // Sharp pointed horizontal wind-pinch cusps at the left & right mid-waist (signature of 04_breeze_active.png!)
      float pinchL = exp(-length((p - vec2(-halfW - 0.04, 0.0)) * vec2(2.6, 5.2)) * 2.4);
      float pinchR = exp(-length((p - vec2( halfW + 0.04, 0.0)) * vec2(2.6, 5.2)) * 2.4);
      float pinch = (pinchL + pinchR) * (0.80 + 0.20 * sin(uTime * 2.6)) * windStage;

      vec3 colDeep = vec3(0.02, 0.42, 0.28);
      vec3 colMid  = vec3(0.08, 0.88, 0.58);
      vec3 colMint = vec3(0.78, 1.00, 0.94);

      vec3 col = colDeep * softAura;
      col += colMid * (softSheets * 1.42 + rim * 0.86);
      col += colMint * (fineStreaks * 1.25 + pinch * 0.88 + exp(-distOut * 32.0) * 0.62 * auraStage);

      return col * envMask;
    }

    // 4. BLOOM: 11-petal cupped translucent lotus with soft directional Fresnel rim & stippled grain
    vec3 evalLotusPetal(vec2 p, float angleRad, float len, float wid, float oy, float openEase, float grain) {
      if (openEase <= 0.01) return vec3(0.0);
      vec2 q = p - vec2(0.0, oy);
      float c = cos(angleRad);
      float s = sin(angleRad);
      vec2 lp = vec2(c * q.x - s * q.y, s * q.x + c * q.y);

      float u = lp.y / len;
      if (u < -0.08 || u > 1.12) return vec3(0.0);

      float uClamped = clamp(u, 0.0, 1.0);
      // Subtle botanical upward cup curvature on lateral petals
      lp.x -= sin(uClamped * 3.14159265) * sign(angleRad) * 0.045 * abs(sin(angleRad));

      float profile = pow(sin(uClamped * 3.14159265), 0.72) * (1.0 - 0.06 * uClamped);
      float halfWidth = wid * profile;

      float dx = abs(lp.x) - halfWidth;
      float tipDist = length(vec2(lp.x * 1.22, max(0.0, lp.y - len * 0.85))) - len * 0.15;
      float dist = mix(max(dx, -lp.y), max(dx, tipDist), smoothstep(0.65, 0.96, uClamped));
      if (lp.y > len) dist = max(dist, lp.y - len);

      float inside = smoothstep(0.020, -0.016, dist);
      float outerHalo = exp(-max(0.0, dist) * 24.0) * 0.22 * smoothstep(-0.04, 0.10, u) * smoothstep(1.10, 0.90, u);
      if (inside <= 0.001 && outerHalo <= 0.001) return vec3(0.0);

      float lat = halfWidth > 0.001 ? clamp(abs(lp.x) / halfWidth, 0.0, 1.0) : 1.0;

      // Soft luminous directional Fresnel rim (broad silky glow rather than hard neon wire!)
      float fresnel = pow(lat, 2.2) * 0.88 + pow(uClamped, 3.2) * 0.62;
      float softRim = exp(-abs(dist) * 34.0) * 0.62 * smoothstep(0.02, 0.18, u);

      // Rich stippled botanical grain concentrated toward outer half of each petal (matching 08_bloom_full.png!)
      float veins = 0.5 + 0.5 * sin(lat * 16.0 - uClamped * 3.2);
      float stipple = mix(0.90, 1.12, grain * (0.35 + 0.65 * fresnel) + veins * 0.30);

      vec3 body = mix(vec3(0.66, 0.03, 0.34), vec3(0.98, 0.16, 0.56), smoothstep(0.05, 0.68, uClamped) * 0.70 + lat * 0.36);
      body = mix(body, vec3(1.00, 0.80, 0.92), clamp(fresnel * 0.86, 0.0, 1.0));
      body *= stipple;

      float alpha = mix(0.46, 0.94, clamp(fresnel, 0.0, 1.0)) * inside;
      vec3 res = body * alpha + vec3(1.00, 0.92, 0.97) * softRim + vec3(0.98, 0.18, 0.56) * outerHalo;
      return res * openEase;
    }

    vec3 renderBloom(vec2 fragPx, vec4 card, float inten) {
      vec2 p = (fragPx - card.xy) / card.z;
      float envMask = smoothstep(2.8, 1.4, length(p * vec2(0.85, 0.95)));
      if (envMask <= 0.001) return vec3(0.0);

      float halfH = 0.5 * (card.w / card.z);
      float grain = hash21(floor(fragPx * 0.85)) * 0.72 + vnoise(p * 30.0) * 0.28;

      float glowStage = smoothstep(0.00, 0.38, inten);
      float radialD = length(p * vec2(0.82, 0.95));
      vec3 col = vec3(0.88, 0.12, 0.48) * exp(-radialD * 1.55) * 0.52 * glowStage;

      const int NUM_P = 11;
      float angles[NUM_P] = float[NUM_P](
         0.0,  -25.0,  25.0,  -51.0,  51.0,
       -75.0,   75.0, -95.0,   95.0, -109.0, 109.0
      );
      float lens[NUM_P] = float[NUM_P](
        1.30,  1.32,  1.32,  1.42,  1.42,
        1.50,  1.50,  1.36,  1.36,  1.16,  1.16
      );
      float wids[NUM_P] = float[NUM_P](
        0.34,  0.34,  0.34,  0.37,  0.37,
        0.40,  0.40,  0.38,  0.38,  0.35,  0.35
      );
      float oys[NUM_P] = float[NUM_P](
       -0.30, -0.32, -0.32, -0.36, -0.36,
       -0.44, -0.44, -0.52, -0.52, -0.58, -0.58
      );
      float delays[NUM_P] = float[NUM_P](
        0.10,  0.15,  0.15,  0.22,  0.22,
        0.29,  0.29,  0.36,  0.36,  0.42,  0.42
      );

      vec3 petalsSum = vec3(0.0);
      for (int i = 0; i < NUM_P; i++) {
        float lp = clamp((inten - delays[i]) / (1.0 - delays[i]), 0.0, 1.0);
        float t1 = 1.0 - lp;
        float ease = 1.0 - t1 * t1 * t1;
        float breathe = sin(uTime * 1.35 + float(i) * 0.65) * 0.02 * ease;
        float angDeg = angles[i] * (0.14 + 0.86 * ease) + breathe * 36.0;
        float rad = angDeg * 0.01745329;
        float pLen = lens[i] * (0.18 + 0.82 * ease) * (1.0 + breathe * 0.5);
        float pWid = wids[i] * (0.32 + 0.68 * ease);
        vec3 pc = evalLotusPetal(p, rad, pLen, pWid, oys[i], ease, grain);
        petalsSum = petalsSum + pc * (1.0 - petalsSum * 0.34);
      }

      col += petalsSum;
      float baseD = length((p - vec2(0.0, -halfH * 0.92)) * vec2(0.95, 2.8));
      col += vec3(1.00, 0.72, 0.88) * exp(-baseD * 2.2) * 0.44 * smoothstep(0.25, 0.95, inten);
      return col * envMask;
    }

    void main() {
      vec2 fragPx = vUv * uRes;
      vec2 uvC = (vUv - vec2(0.5, 0.54)) * vec2(uRes.x / uRes.y, 1.0);
      float bgFalloff = exp(-dot(uvC, uvC) * 2.6);
      vec3 bg = vec3(0.015, 0.014, 0.017) + uAmbient * bgFalloff * 0.24;

      vec3 vfx = vec3(0.0);
      if (uInt.x > 0.002) vfx += renderEmber(fragPx,  uCard0, uInt.x);
      if (uInt.y > 0.002) vfx += renderSolar(fragPx,  uCard1, uInt.y);
      if (uInt.z > 0.002) vfx += renderBreeze(fragPx, uCard2, uInt.z);
      if (uInt.w > 0.002) vfx += renderBloom(fragPx,  uCard3, uInt.w);

      vec3 total = bg + vfx;
      total = total / (1.0 + total * 0.22);
      fragColor = vec4(total, 1.0);
    }
  `,Ke=`#version 300 es
    precision mediump float;
    in vec2 vUv;
    out vec4 fragColor;

    uniform sampler2D uScene;
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uFloorY;
    uniform vec3 uAmbient;
    uniform vec4 uActiveCard;
    uniform vec3 uActiveTint;
    uniform float uActiveWarmth;
    uniform float uLight;

    float hashGrain(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec3 col = texture(uScene, vUv).rgb;
      float floorMask = smoothstep(uFloorY + 0.055, uFloorY - 0.055, vUv.y);

      float dyH = (vUv.y - uFloorY) * (uRes.y / 32.0);
      float dxH = (vUv.x - 0.5) * 2.3;
      float horizonBand = exp(-dyH * dyH * 1.4 - dxH * dxH * 1.8);

      if (floorMask > 0.001) {
        float depth = clamp((uFloorY - vUv.y) / max(0.001, uFloorY), 0.0, 1.0);
        float refY = uFloorY + abs(uFloorY - vUv.y) * 1.16 + 0.02;

        vec3 refCol = vec3(0.0);
        if (refY < 0.99) {
          float blurPx = mix(5.0, 14.0, depth);
          vec2 texel = blurPx / uRes;
          refCol += texture(uScene, vec2(vUv.x, refY)).rgb * 0.24;
          refCol += texture(uScene, vec2(vUv.x + texel.x, refY)).rgb * 0.13;
          refCol += texture(uScene, vec2(vUv.x - texel.x, refY)).rgb * 0.13;
          refCol += texture(uScene, vec2(vUv.x, refY + texel.y)).rgb * 0.13;
          refCol += texture(uScene, vec2(vUv.x, refY - texel.y)).rgb * 0.13;
          refCol += texture(uScene, vec2(vUv.x + texel.x, refY + texel.y)).rgb * 0.06;
          refCol += texture(uScene, vec2(vUv.x - texel.x, refY + texel.y)).rgb * 0.06;
          refCol += texture(uScene, vec2(vUv.x + texel.x, refY - texel.y)).rgb * 0.06;
          refCol += texture(uScene, vec2(vUv.x - texel.x, refY - texel.y)).rgb * 0.06;

          vec2 refPx = vec2(vUv.x * uRes.x, refY * uRes.y);
          vec2 dp = (refPx - uActiveCard.xy) / uActiveCard.z;
          float halfH = 0.5 * (uActiveCard.w / uActiveCard.z);
          float seg = max(0.0, halfH - 0.5);
          vec2 q = vec2(dp.x, dp.y - clamp(dp.y, -seg, seg));
          float cardSil = smoothstep(0.16, -0.06, length(q) - 0.5);
          refCol = mix(refCol, uActiveTint * 0.52 * uActiveWarmth + refCol * 0.65, cardSil * 0.52);
        }

        float refStrength = smoothstep(0.0, 0.26, depth) * mix(0.70, 0.50, depth);
        vec3 floorBase = col * mix(1.0, 0.22, floorMask);
        col = mix(floorBase, refCol * 0.92, floorMask * refStrength);
      }

      col += uAmbient * horizonBand * 0.24;

      // Tactile fine analog film grain visible across dark stage, ambient glows & VFX
      float g1 = hashGrain(gl_FragCoord.xy + fract(uTime * 12.0) * 19.3);
      float g2 = hashGrain(gl_FragCoord.xy * 0.5 + 71.7);
      float grain = (g1 * 0.65 + g2 * 0.35 - 0.5);
      // Slightly stronger in midtones/glows, subtle crisp dither in deep blacks
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col += vec3(grain * mix(0.014, 0.026, smoothstep(0.02, 0.45, lum)));

      if (uLight > 0.5) {
      float intensity=max(col.r,max(col.g,col.b));
      col=mix(vec3(244.0/255.0),clamp(col,0.0,1.0),smoothstep(0.16,0.55,intensity));
    }
    fragColor = vec4(max(col, 0.0), 1.0);
    }
  `;function Fe(e,t){const n=K("shader",a.createShader(e));if(a.shaderSource(n,t),a.compileShader(n),!a.getShaderParameter(n,a.COMPILE_STATUS))throw new Error(a.getShaderInfoLog(n)||"Shader compilation failed");return n}function Ue(e,t){const n=K("program",a.createProgram());if(a.attachShader(n,Fe(a.VERTEX_SHADER,e)),a.attachShader(n,Fe(a.FRAGMENT_SHADER,t)),a.linkProgram(n),!a.getProgramParameter(n,a.LINK_STATUS))throw new Error(a.getProgramInfoLog(n)||"Program linking failed");return n}let E=null,F=null,fe=null,Se=null,he=null,W={},I={};try{if(a){E=Ue(Ee,Ve),F=Ue(Ee,Ke),fe=K("vertexArray",a.createVertexArray()),a.bindVertexArray(fe);const e=K("buffer",a.createBuffer());a.bindBuffer(a.ARRAY_BUFFER,e),a.bufferData(a.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),a.STATIC_DRAW);const t=a.getAttribLocation(E,"aPos");a.enableVertexAttribArray(t),a.vertexAttribPointer(t,2,a.FLOAT,!1,0,0),a.bindVertexArray(null),W={uRes:a.getUniformLocation(E,"uRes"),uTime:a.getUniformLocation(E,"uTime"),uCard0:a.getUniformLocation(E,"uCard0"),uCard1:a.getUniformLocation(E,"uCard1"),uCard2:a.getUniformLocation(E,"uCard2"),uCard3:a.getUniformLocation(E,"uCard3"),uInt:a.getUniformLocation(E,"uInt"),uAmbient:a.getUniformLocation(E,"uAmbient")},I={uScene:a.getUniformLocation(F,"uScene"),uRes:a.getUniformLocation(F,"uRes"),uTime:a.getUniformLocation(F,"uTime"),uFloorY:a.getUniformLocation(F,"uFloorY"),uAmbient:a.getUniformLocation(F,"uAmbient"),uActiveCard:a.getUniformLocation(F,"uActiveCard"),uActiveTint:a.getUniformLocation(F,"uActiveTint"),uLight:a.getUniformLocation(F,"uLight"),uActiveWarmth:a.getUniformLocation(F,"uActiveWarmth")},Se=K("framebuffer",a.createFramebuffer()),he=K("texture",a.createTexture())}}catch(e){d.dataset.gpuError=e.message,a=null}let w=d.clientWidth,U=d.clientHeight,D=Math.min(te.devicePixelRatio||1,2);const Z=.72;function Ze(e,t){a&&(a.bindTexture(a.TEXTURE_2D,he),a.texImage2D(a.TEXTURE_2D,0,a.RGBA8,e,t,0,a.RGBA,a.UNSIGNED_BYTE,null),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),a.bindFramebuffer(a.FRAMEBUFFER,Se),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,he,0),a.bindFramebuffer(a.FRAMEBUFFER,null))}function Ie(){if(b)return;w=Math.max(1,d.clientWidth),U=Math.max(1,d.clientHeight),d.style.setProperty("--card-w",(w<=640?112:Math.min(360,Math.max(280,w*.32)))+"px"),d.style.setProperty("--card-h",(w<=640?196:116)+"px"),D=Math.min(te.devicePixelRatio||1,2);const e=Math.max(1,Math.round(w*Z)),t=Math.max(1,Math.round(U*Z));z.width=e,z.height=t,se.width=Math.round(w*D),se.height=Math.round(U*D),ce.width=Math.round(w*D),ce.height=Math.round(U*D),Ze(e,t)}const X=[{id:"ember",ambient:[.76,.13,.08],tint:[.85,.24,.28]},{id:"solar",ambient:[.85,.52,.08],tint:[.95,.65,.22]},{id:"breeze",ambient:[.06,.64,.38],tint:[.22,.82,.56]},{id:"bloom",ambient:[.78,.14,.46],tint:[.92,.28,.62]}],_=ke(ee.active??0);let M=_,O=_,oe=_,q=0,de=0,ue=0,me=0,pe=0;const x=X.map((e,t)=>({id:e.id,warmth:t===_?.15:0,ignite:t===_?.05:0,igniteClock:t===_?.05:0,cx:w*.5,cy:U*.465,w:220,h:350,scale:t===_?1:.91,opacity:1,burstParticles:[]}));G.forEach((e,t)=>{const n=t===_;e.classList.toggle("is-active",n),e.setAttribute("aria-pressed",n?"true":"false")});const re=[...X[_].ambient],ge=[...X[_].tint];function je(e,t){let n=(e-t)%4;return n>2&&(n-=4),n<-2&&(n+=4),n}function Je(e){const t=x[e];if(t.ignite<.12)return;const n=t.id;if(n==="ember")for(let l=0;l<78;l++){const s=l<56,h=s?(Math.random()-.5)*t.w*1.18:(Math.random()<.5?-1:1)*t.w*(.46+Math.random()*.14),g=s?-t.h*(.34+Math.random()*.34):(Math.random()-.5)*t.h*.85;t.burstParticles.push({x:h,y:g,vx:(Math.random()-.5)*24,vy:-16-Math.random()*44,swayAmp:6+Math.random()*14,swayPhase:Math.random()*Math.PI*2,size:1.8+Math.random()*4.6,rot:Math.random()*Math.PI*2,vrot:(Math.random()-.5)*2.4,life:1,decay:.36+Math.random()*.28,kind:s&&Math.random()<.34?"tri":"emberDot"})}else if(n==="bloom")for(let l=0;l<88;l++){const s=Math.random()*Math.PI*2,h=t.w*(.46+Math.random()*.34),g=t.h*(.42+Math.random()*.24);t.burstParticles.push({x:Math.cos(s)*h,y:Math.sin(s)*g,vx:Math.cos(s)*(12+Math.random()*34),vy:Math.sin(s)*(10+Math.random()*28)-8,swayAmp:8+Math.random()*14,swayPhase:Math.random()*Math.PI*2,size:3.2+Math.random()*5.8,rot:Math.random()*Math.PI*2,vrot:(Math.random()-.5)*3.8,life:1,decay:.35+Math.random()*.28,kind:"petal"})}else if(n==="solar")for(let l=0;l<82;l++){const s=De(Math.random(),t.w,t.h),h=t.w*(.04+Math.random()*.32);t.burstParticles.push({x:s.x+s.nx*h,y:s.y+s.ny*h,vx:s.nx*(10+Math.random()*28),vy:s.ny*(10+Math.random()*28),swayAmp:3+Math.random()*6,swayPhase:Math.random()*Math.PI*2,size:1.5+Math.random()*3.8,rot:0,vrot:0,life:1,decay:.38+Math.random()*.28,kind:Math.random()<.22?"ring":"solarDot"})}else for(let l=0;l<28;l++){const s=l%2===0?-1:1,h=(Math.random()-.5)*Math.PI*1.4+(s<0?Math.PI:0),g=t.w*(.5+Math.random()*.3),i=t.h*(.38+Math.random()*.24);t.burstParticles.push({x:Math.cos(h)*g,y:Math.sin(h)*i,vx:Math.cos(h)*(14+Math.random()*26)+12,vy:Math.sin(h)*(10+Math.random()*18),swayAmp:5+Math.random()*10,swayPhase:Math.random()*Math.PI*2,size:26+Math.random()*44,rot:h+Math.PI*.5,vrot:(Math.random()-.5)*.9,life:1,decay:.4+Math.random()*.26,kind:"windArc"})}}function ne(e,t=!0,n=!1){if(b)return;const c=M,l=(e%4+4)%4;if(l===c)return;let s=(l-c)%4;s>2&&(s-=4),s<-2&&(s+=4),A()||Je(c),M=l,oe+=s,x[M].igniteClock=0,_e(),n&&G[M].focus({preventScroll:!0}),t&&L.onActiveChange?.(M),A()&&ve(),(A()||!ae())&&j(Y,0),xe()}function _e(){d.dataset.active=X[M].id,G.forEach((e,t)=>{const n=t===M;e.classList.toggle("is-active",n),e.setAttribute("aria-pressed",String(n)),e.tabIndex=n?0:-1})}let Le=0,ie=null,ze=0,N=!1,T=null,We=-1/0;const Pe=e=>k.point?k.point(e):{x:e.clientX-d.getBoundingClientRect().left,y:e.clientY-d.getBoundingClientRect().top};G.forEach((e,t)=>{C(e,"click",n=>{if(!b){if(performance.now()<Le){n.preventDefault();return}ne(t)}}),C(e,"pointermove",n=>{if(b||A())return;const c=e.getBoundingClientRect();e.style.setProperty("--mx",((n.clientX-c.left)/c.width*100).toFixed(1)+"%"),e.style.setProperty("--my",((n.clientY-c.top)/c.height*100).toFixed(1)+"%")})}),C(d,"keydown",e=>{if(b||e.altKey||e.ctrlKey||e.metaKey)return;let t=M;if(e.key==="ArrowRight")t++;else if(e.key==="ArrowLeft")t--;else if(e.key==="Home")t=0;else if(e.key==="End")t=3;else if(e.key>="1"&&e.key<="4")t=Number(e.key)-1;else if(e.key==="Enter"||e.key===" "){e.preventDefault(),e.target.closest(".card")?.click();return}else return;e.preventDefault(),e.stopPropagation(),ne(t,!0,e.isTrusted)}),C(d,"wheel",e=>{if(b||!e.shiftKey&&Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;const t=performance.now(),n=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;Math.abs(n)<=22||(e.preventDefault(),!(t-We<460)&&(We=t,ne(M+(n>0?1:-1))))},{passive:!1}),C(d,"pointerdown",e=>{b||e.button!==0||!e.isPrimary||(ie=Pe(e).x,ze=O,N=!1,T=e.pointerId)}),C(d,"pointermove",e=>{if(b)return;const t=Pe(e);if(de=(t.x/w-.5)*2,ue=(t.y/U-.5)*2,ie===null||e.pointerId!==T)return;const n=t.x-ie;if(Math.abs(n)>12&&!N&&(N=!0,d.setPointerCapture(T)),N){const c=Math.min(Math.max(w*.3,G[0].offsetWidth*1.05),w<=640?150:360);O=ze-n/c*.72,q=0,(A()||!ae())&&j(Y,0)}});function Ce(e,t=!1){if(b||T===null||e.pointerId!==T)return;const n=Pe(e).x-ie,c=N;d.hasPointerCapture(T)&&d.releasePointerCapture(T),ie=null,N=!1,T=null,c&&(Le=performance.now()+350,!t&&Math.abs(n)>55&&ne(M+(n<0?1:-1))),A()&&ve(),(A()||!ae())&&j(Y,0),xe()}C(d,"pointerup",e=>Ce(e)),C(d,"pointercancel",e=>Ce(e,!0)),C(d,"lostpointercapture",e=>{T!==null&&Ce(e,!0)}),C(d,"pointerleave",()=>{!b&&!N&&(de=0,ue=0)});function De(e,t,n){const c=t*.5,l=Math.max(0,n-t),s=Math.PI*c,h=2*s+2*l;let g=(e%1+1)%1*h;const i=l*.5;if(g<s){const u=-Math.PI+g/s*Math.PI;return{x:Math.cos(u)*c,y:-i+Math.sin(u)*c,nx:Math.cos(u),ny:Math.sin(u)}}if(g-=s,g<l)return{x:c,y:-i+g,nx:1,ny:0};if(g-=l,g<s){const u=g/s*Math.PI;return{x:Math.cos(u)*c,y:i+Math.sin(u)*c,nx:Math.cos(u),ny:Math.sin(u)}}return g-=s,{x:-c,y:i-g,nx:-1,ny:0}}function $(e,t,n){const c=Math.max(0,Math.min(1,(n-e)/(t-e)));return c*c*(3-2*c)}const Qe=Array.from({length:34},(e,t)=>{const n=t%2===0?-1:1,c=Math.floor(t/2)/17;return{side:n,psiTarget:n*(.48+c*.62),phase:t*.371%1,speed:.36+t%5*.08,len:.28+t*29%100/100*.34,thick:t%3===0?1.85:1.15,bright:t%2===0}}),et=Array.from({length:74},(e,t)=>({phase:t*.6180339%1,speed:.3+t%7*.055,xOff:t*37%100/100-.5,swayAmp:7+t%5*3.5,swayFreq:1.8+t%4*.7,size:1.2+t%6*.6,isTri:t%6===0,rotSpeed:(t%2===0?1:-1)*(1.2+t%3*.8),sideSpark:t>52})),tt=Array.from({length:68},(e,t)=>({t:t*.6180339%1,phase:t*.317%1,speed:.14+t%5*.045,maxDist:.18+t*23%100/100*.5,size:1.1+t%5*.7,isRing:t%7===0})),at=Array.from({length:48},(e,t)=>({phase:t*.6180339%1,speed:.16+t%6*.04,xOff:t*43%100/100-.5,size:1.3+t%5*.75,topCrown:t<32}));function ot(e,t,n,c,l){const s=Math.exp(-e*e*1.45),h=t>=0?1:-1,g=Math.abs(t),i=h*(g*(.58+.42*l)+s*(.48-g*.18)*l),u=Math.sin(e*3.8-c*3.2+t*5)*.025*l;return{x:n.cx+e*n.w*(.72+.28*l),y:n.cy+(i+u)*n.w}}function rt(e){y.setTransform(D,0,0,D,0,0),y.clearRect(0,0,w,U);const t=x[2],n=$(.24,1,t.ignite);if(n<=.01)return;y.save(),y.globalCompositeOperation="lighter",y.lineCap="round";for(const l of Qe){const s=(l.phase+e*l.speed)%1,h=-1.25+s*2.5,g=h-l.len*(.45+.55*n),i=Math.sin(s*Math.PI)*n;if(i<=.02)continue;const u=12,m=[];for(let f=0;f<=u;f++){const p=g+(h-g)*(f/u);m.push(ot(p,l.psiTarget,t,e,n))}const o=y.createLinearGradient(m[0].x,m[0].y,m[u].x,m[u].y);o.addColorStop(0,"rgba(120, 255, 215, 0)"),o.addColorStop(.35,l.bright?`rgba(225, 255, 245, ${.92*i})`:`rgba(85, 245, 188, ${.65*i})`),o.addColorStop(.8,`rgba(175, 255, 232, ${.72*i})`),o.addColorStop(1,"rgba(50, 210, 150, 0)"),y.strokeStyle=o,y.lineWidth=l.thick,y.beginPath(),y.moveTo(m[0].x,m[0].y);for(let f=1;f<u;f++)y.quadraticCurveTo(m[f].x,m[f].y,(m[f].x+m[f+1].x)*.5,(m[f].y+m[f+1].y)*.5);y.stroke()}const c=[{ox:-.68,oy:.34,ph:.2},{ox:-.58,oy:.5,ph:1.9},{ox:.66,oy:-.32,ph:3.4}];for(const l of c){const s=(.55+.45*Math.sin(e*2.2+l.ph))*n,h=t.cx+l.ox*t.w+Math.sin(e*1.6+l.ph)*6,g=t.cy+l.oy*t.h+Math.cos(e*1.4+l.ph)*5;y.strokeStyle=`rgba(195, 255, 238, ${.75*s})`,y.lineWidth=1.3,y.beginPath(),y.moveTo(h-4,g-7),y.bezierCurveTo(h+5,g-2,h-6,g+3,h+4,g+8),y.stroke()}y.restore()}function nt(e,t){r.setTransform(D,0,0,D,0,0),r.clearRect(0,0,w,U),r.save(),r.globalCompositeOperation="lighter";const n=x[0],c=$(.22,.92,n.ignite);if(c>.01)for(const i of et){const u=(e*i.speed+i.phase)%1,m=Math.sin(u*Math.PI)*c;if(m<=.01)continue;let o,f;if(i.sideSpark){const p=i.xOff>=0?1:-1;o=n.cx+p*(n.w*.49+Math.sin(e*2+i.phase*10)*7),f=n.cy+n.h*.3-u*n.h*.72}else o=n.cx+i.xOff*n.w*.88+Math.sin(e*i.swayFreq+i.phase*12)*i.swayAmp,f=n.cy-n.h*.42-u*n.h*.38*c;if(i.isTri&&!i.sideSpark){r.save(),r.translate(o,f),r.rotate(e*i.rotSpeed+i.phase*6);const p=i.size*1.9;r.strokeStyle=`rgba(255, 224, 198, ${.88*m})`,r.lineWidth=1.2,r.beginPath(),r.moveTo(0,-p),r.lineTo(p*.88,p*.75),r.lineTo(-p*.88,p*.75),r.closePath(),r.stroke(),r.restore()}else r.fillStyle=`rgba(255, 230, 198, ${.9*m})`,r.beginPath(),r.arc(o,f,i.size*(1-u*.35),0,Math.PI*2),r.fill()}const l=x[1],s=$(.32,1,l.ignite);if(s>.01)for(const i of tt){const u=(e*i.speed+i.phase)%1,m=Math.sin(u*Math.PI)*s;if(m<=.01)continue;const o=De(i.t+Math.sin(e*.4+i.phase*6)*.015,l.w,l.h),f=(.03+u*i.maxDist*s)*l.w,p=l.cx+o.x+o.nx*f,H=l.cy+o.y+o.ny*f;i.isRing?(r.strokeStyle=`rgba(255, 244, 192, ${.9*m})`,r.lineWidth=1.3,r.beginPath(),r.arc(p,H,i.size*1.15,0,Math.PI*2),r.stroke()):(r.fillStyle=`rgba(255, 246, 198, ${.9*m})`,r.beginPath(),r.arc(p,H,i.size*(.68+.32*m),0,Math.PI*2),r.fill())}const h=x[3],g=$(.35,1,h.ignite);if(g>.01)for(const i of at){const u=(e*i.speed+i.phase)%1,m=Math.sin(u*Math.PI)*g;if(m<=.01)continue;const o=h.cx+i.xOff*h.w*(i.topCrown?.78:1.1)+Math.sin(e*1.8+i.phase*10)*8,f=i.topCrown?h.cy-h.h*.44-u*h.h*.18:h.cy+h.h*.45+Math.sin(u*Math.PI)*14;r.fillStyle=`rgba(255, 226, 244, ${.88*m})`,r.beginPath(),r.arc(o,f,i.size*(.75+.25*m),0,Math.PI*2),r.fill()}for(const i of x){const u=i.burstParticles;for(let m=u.length-1;m>=0;m--){const o=u[m];if(o.x+=(o.vx+Math.sin(e*2.4+o.swayPhase)*o.swayAmp)*t,o.y+=o.vy*t,o.vx*=.985,o.vy*=.985,o.rot+=o.vrot*t,o.life-=o.decay*t,o.life<=0){u.splice(m,1);continue}const f=i.cx+o.x,p=i.cy+o.y,H=.78+.22*Math.sin(e*6.5+o.swayPhase*3),P=Math.pow(Math.min(1,o.life*1.15),1.35)*H;if(o.kind==="tri")r.save(),r.translate(f,p),r.rotate(o.rot),r.strokeStyle=`rgba(255, 138, 96, ${.92*P})`,r.lineWidth=1.25,r.beginPath(),r.moveTo(0,-o.size),r.lineTo(o.size*.88,o.size*.72),r.lineTo(-o.size*.88,o.size*.72),r.closePath(),r.stroke(),r.restore();else if(o.kind==="emberDot")r.fillStyle=`rgba(255, 118, 62, ${.92*P})`,r.beginPath(),r.arc(f,p,o.size*(.45+.35*o.life),0,Math.PI*2),r.fill();else if(o.kind==="petal")r.save(),r.translate(f,p),r.rotate(o.rot),r.fillStyle=`rgba(255, 122, 186, ${.88*P})`,r.beginPath(),r.ellipse(0,0,o.size*.44,o.size*.95,0,0,Math.PI*2),r.fill(),r.strokeStyle=`rgba(255, 224, 240, ${.55*P})`,r.lineWidth=.8,r.stroke(),r.restore();else if(o.kind==="ring")r.strokeStyle=`rgba(255, 226, 132, ${.9*P})`,r.lineWidth=1.25,r.beginPath(),r.arc(f,p,o.size*(.85+.25*(1-o.life)),0,Math.PI*2),r.stroke();else if(o.kind==="solarDot")r.fillStyle=`rgba(255, 218, 112, ${.92*P})`,r.beginPath(),r.arc(f,p,o.size*(.42+.38*o.life),0,Math.PI*2),r.fill();else if(o.kind==="windArc"){r.save(),r.translate(f,p),r.rotate(o.rot);const S=o.size*.5,J=r.createLinearGradient(-S,0,S,0);J.addColorStop(0,"rgba(80, 235, 178, 0)"),J.addColorStop(.45,`rgba(145, 255, 222, ${.78*P})`),J.addColorStop(1,"rgba(40, 195, 138, 0)"),r.strokeStyle=J,r.lineWidth=1.4,r.lineCap="round",r.beginPath(),r.moveTo(-S,0),r.quadraticCurveTo(0,-o.size*.22,S,0),r.stroke(),r.restore()}}}r.restore()}function j(e,t){if(b)return;if(!N){const p=(oe-O)*78;q=(q+p*t)*Math.exp(-16.5*t),O+=q*t,Math.abs(oe-O)<3e-4&&Math.abs(q)<3e-4&&(O=oe,q=0)}const n=1-Math.exp(-6*t);me+=(de-me)*n,pe+=(ue-pe)*n;const c=G[0].offsetWidth||220,l=G[0].offsetHeight||350,s=w<=640?120:Math.min(Math.max(w*.3,c*1.05),360);for(let o=0;o<4;o++){const f=je(o,O),p=Math.abs(f),H=f*s,P=1-Math.min(p,1.4)*.085,S=p<=1.12?1:Math.max(0,1-(p-1.12)*1.9),J=Math.round(10-p*3),v=x[o];v.cx=w*.5+H,v.cy=U*.465,v.w=c*P,v.h=l*P,v.scale=P,v.opacity=S;const Me=o===M;if(A()&&(v.warmth=Me?1:0,v.ignite=Me?1:0,v.igniteClock=Me?1:0),Me){const Q=$(.42,.06,p);Q>.02&&(v.igniteClock=Math.min(1,v.igniteClock+t*.98*(.35+.65*Q)));const Ae=$(0,.52,v.igniteClock)*Q,ft=$(.08,1,v.igniteClock)*Q,Ye=1-Math.exp(-9*t);v.warmth+=(Ae-v.warmth)*Ye,v.ignite+=(ft-v.ignite)*Ye}else{v.igniteClock=0;const Q=1-Math.exp(-3.4*t),Ae=1-Math.exp(-4.2*t);v.warmth*=1-Q,v.ignite*=1-Ae,v.warmth<.002&&(v.warmth=0),v.ignite<.002&&(v.ignite=0)}const Be=v.ignite*(1-Math.min(1,p*2)),st=me*4.2*Be,ct=-pe*3.2*Be,B=G[o];B.style.transform=`translate3d(${H.toFixed(2)}px, 0, 0) scale(${P.toFixed(4)}) rotateY(${st.toFixed(2)}deg) rotateX(${ct.toFixed(2)}deg)`,B.style.opacity=S.toFixed(3),B.style.zIndex=String(J),B.style.pointerEvents=S>.25?"auto":"none",B.setAttribute("aria-hidden",String(S<=.25)),B.inert=S<=.25,B.style.setProperty("--warmth",v.warmth.toFixed(4)),B.style.setProperty("--ignite",v.ignite.toFixed(4)),B.classList.toggle("is-ignited",v.warmth>.45)}const h=x[M],g=X[M].ambient,i=X[M].tint,u=.25+.75*h.warmth,m=1-Math.exp(-3.8*t);for(let o=0;o<3;o++)re[o]+=(g[o]*u-re[o])*m,ge[o]+=(i[o]-ge[o])*m;if(a){const o=z.width,f=z.height,p=S=>[S.cx*Z,(U-S.cy)*Z,S.w*Z,S.h*Z];a.bindFramebuffer(a.FRAMEBUFFER,Se),a.viewport(0,0,o,f),a.useProgram(E),a.bindVertexArray(fe),a.uniform2f(W.uRes,o,f),a.uniform1f(W.uTime,e),a.uniform4fv(W.uCard0,p(x[0])),a.uniform4fv(W.uCard1,p(x[1])),a.uniform4fv(W.uCard2,p(x[2])),a.uniform4fv(W.uCard3,p(x[3])),a.uniform4f(W.uInt,x[0].ignite,x[1].ignite,x[2].ignite,x[3].ignite),a.uniform3fv(W.uAmbient,re),a.drawArrays(a.TRIANGLE_STRIP,0,4),a.bindFramebuffer(a.FRAMEBUFFER,null),a.viewport(0,0,o,f),a.useProgram(F),a.bindVertexArray(fe),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,he),a.uniform1i(I.uScene,0),a.uniform2f(I.uRes,o,f),a.uniform1f(I.uTime,e),a.uniform1f(I.uLight,L.theme==="light"?1:0);const H=h.cy+h.h*.72,P=Math.max(.05,Math.min(.45,1-H/U));a.uniform1f(I.uFloorY,P),a.uniform3fv(I.uAmbient,re),a.uniform4fv(I.uActiveCard,p(h)),a.uniform3fv(I.uActiveTint,ge),a.uniform1f(I.uActiveWarmth,h.warmth),a.drawArrays(a.TRIANGLE_STRIP,0,4)}if(!a&&Re){const o=Re;o.fillStyle=L.theme==="light"?"#f4f4f4":"#040405",o.fillRect(0,0,z.width,z.height)}rt(e),nt(e,t),d.dataset.time=Y.toFixed(3),d.dataset.offset=O.toFixed(4),d.dataset.ignite=x[M].ignite.toFixed(4),d.dataset.bursts=String(x.reduce((o,f)=>o+f.burstParticles.length,0)),d.dataset.ready="true"}function ve(){O=oe,q=0,de=0,ue=0,me=0,pe=0,x.forEach((e,t)=>{e.warmth=t===M?1:0,e.ignite=e.warmth,e.igniteClock=e.warmth,e.burstParticles.length=0}),re.splice(0,3,...X[M].ambient),ge.splice(0,3,...X[M].tint)}function Oe(){V!==null&&$e(V),V=null,le=null}function xe(){!b&&ae()&&V===null&&(V=qe(it))}function it(e){if(V=null,b||!ae())return;const t=le===null?0:Math.max(0,e-le);le=e,Y+=t/1e3,j(Y,Math.min(.05,t/1e3)),xe()}function ye(){b||(Oe(),d.dataset.paused=String(!!L.paused||R.hidden),d.dataset.reduced=String(A()),A()&&ve(),j(Y,0),xe())}function lt(){Ie(),A()&&ve(),j(Y,0)}const He=new k.ResizeObserver(lt);return He.observe(d),C(R,"visibilitychange",ye),C(k.matchMedia("(prefers-reduced-motion:reduce)"),"change",ye),d.dataset.renderer=a?"webgl2":"canvas2d",d.dataset.theme=L.theme==="light"?"light":"dark",_e(),Ie(),ye(),{update(e={}){b||(L={...L,...e},Object.hasOwn(e,"active")&&ne(ke(e.active),!1),d.dataset.theme=L.theme==="light"?"light":"dark",ye())},destroy(){if(!b){if(b=!0,Oe(),He.disconnect(),T!==null&&d.hasPointerCapture(T)&&d.releasePointerCapture(T),x.forEach(e=>e.burstParticles.length=0),d.getAnimations({subtree:!0}).forEach(e=>e.cancel()),be){for(const{kind:e,value:t}of we)be["delete"+e[0].toUpperCase()+e.slice(1)](t);be.getExtension("WEBGL_lose_context")?.loseContext()}we.length=0,[z,se,ce].forEach(e=>{e.width=1,e.height=1})}}}}const Xe=matchMedia("(prefers-reduced-motion:reduce)"),Te=[],Ne=Ge({document,window,on:(k,ee,R,te)=>{k.addEventListener(ee,R,te),Te.push(()=>k.removeEventListener(ee,R,te))},requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window),reduced:()=>Xe.matches,matchMedia:window.matchMedia.bind(window),ResizeObserver},{theme:document.documentElement.hasAttribute("data-leibox-motion-preview")?"light":"dark"});addEventListener("pagehide",()=>{Ne.destroy(),Te.reverse().forEach(k=>k())},{once:!0})})();
