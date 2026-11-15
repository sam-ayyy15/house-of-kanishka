'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * A length of brand-red satin hanging in soft vertical folds (the 404 page).
 *
 * One plane, folded in the vertex shader (three sine bands whose phase drifts slowly, tighter
 * towards the top where the cloth is gathered, plus a soft push where the pointer is). The
 * fragment shader shades it like satin: warp threads run down the cloth, so highlights are
 * anisotropic (Kajiya-Kay): long bright streaks along the ridges of the folds, deep burgundy in
 * the valleys. Colours are the site's own: #A20F15 with a darker and a lighter step of itself.
 *
 * Motion is slow and only ever the cloth moving; with reduced motion it is drawn once.
 */

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uSize;     // half width, half height of the visible plane in world units
  uniform vec2 uPointer;  // pointer in fold space (x already multiplied by aspect)
  varying vec3 vN;
  varying vec3 vT;
  varying vec3 vW;
  varying float vH;
  varying float vY;

  // Height of the cloth at p = (x scaled by aspect, y), both in [-1, 1] units of the cloth height.
  float fold(vec2 p) {
    float env = mix(1.0, 0.55, smoothstep(-1.0, 1.0, p.y));          // deeper folds low down
    float sway = 0.05 * sin(p.y * 1.7 + uTime * 0.35) + 0.03 * sin(p.y * 3.1 - uTime * 0.22);
    float x = p.x + sway * (1.0 - p.y * 0.5);
    float tight = 1.0 + 0.18 * p.y;                                  // gathered at the top
    float h = 0.115 * sin(x * 5.2 * tight + 0.7 + uTime * 0.18);
    h += 0.055 * sin(x * 10.8 * tight + 2.3 - uTime * 0.25 + p.y * 0.8);
    h += 0.022 * sin(x * 21.5 * tight + 4.1 + uTime * 0.30 + p.y * 1.6);
    h *= env;
    vec2 d = p - uPointer;
    h += 0.06 * exp(-dot(d, d) * 2.2);                               // a soft push under the pointer
    return h;
  }

  void main() {
    float aspect = uSize.x / uSize.y;
    vec2 p = vec2(position.x * aspect, position.y);
    float e = 0.004;
    float h = fold(p);
    vec3 pu = vec3(2.0 * e, 0.0, fold(p + vec2(e, 0.0)) - fold(p - vec2(e, 0.0)));
    vec3 pv = vec3(0.0, 2.0 * e, fold(p + vec2(0.0, e)) - fold(p - vec2(0.0, e)));
    vN = normalize(cross(pu, pv));
    vT = normalize(pv);
    vH = h;
    vY = position.y;
    vec3 world = vec3(position.x * uSize.x, position.y * uSize.y, h * uSize.y);
    vW = world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uBase;
  uniform vec3 uHi;
  uniform vec3 uSheen;
  uniform vec2 uLight;
  varying vec3 vN;
  varying vec3 vT;
  varying vec3 vW;
  varying float vH;
  varying float vY;

  float streak(vec3 T, vec3 L, vec3 V, float power) {
    vec3 H = normalize(L + V);
    float th = dot(T, H);
    return pow(sqrt(max(1.0 - th * th, 0.0)), power);
  }

  void main() {
    vec3 N = normalize(vN);
    vec3 T = normalize(vT);
    vec3 V = normalize(cameraPosition - vW);
    if (dot(N, V) < 0.0) N = -N;

    vec3 L1 = normalize(vec3(-0.75 + uLight.x * 0.9, 0.5 + uLight.y * 0.5, 0.62));  // key, follows the pointer a little
    vec3 L2 = normalize(vec3(0.9, -0.2, 0.45));                                     // low rim from the right

    float d1 = clamp(dot(N, L1) * 0.85 + 0.12, 0.0, 1.0);
    float d2 = max(dot(N, L2), 0.0);
    float ao = smoothstep(-0.10, 0.08, vH) * 0.65 + 0.35;                            // valleys sit darker

    vec3 col = mix(uDeep, uBase, smoothstep(0.05, 0.72, d1));
    col = mix(col, uHi, smoothstep(0.72, 1.0, d1) * 0.4);
    col += uHi * d2 * 0.06;

    float key = smoothstep(0.0, 0.35, dot(N, L1));
    float rim = smoothstep(0.0, 0.3, dot(N, L2));
    col += uSheen * (streak(T, L1, V, 90.0) * key * 0.55 + streak(T, L2, V, 50.0) * rim * 0.2);
    col += uHi * streak(T, L1, V, 10.0) * key * 0.05;

    col *= ao;
    col *= mix(0.62, 1.0, smoothstep(1.0, 0.55, vY));                                // gathered, so darker, at the top

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function Cloth({ reduced }: { reduced: boolean }) {
  const viewport = useThree((s) => s.viewport);
  const narrow = useThree((s) => s.size.width < 768);
  const pointer = useRef(new THREE.Vector2(0, 0)); // target, -1..1
  const smooth = useRef(new THREE.Vector2(0, 0));

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uTime: { value: reduced ? 6.5 : 0 },
          uSize: { value: new THREE.Vector2(1, 1) },
          uPointer: { value: new THREE.Vector2(9, 9) }, // far away: no push until the pointer moves
          uLight: { value: new THREE.Vector2(0, 0) },
          uDeep: { value: new THREE.Color('#2b0407') },
          uBase: { value: new THREE.Color('#a20f15') },
          uHi: { value: new THREE.Color('#c4212a') },
          uSheen: { value: new THREE.Color('#ff5148') },
        },
      }),
    [reduced],
  );
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    if (reduced) return;
    const move = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [reduced]);

  useFrame((state, delta) => {
    const u = material.uniforms;
    u.uSize.value.set(viewport.width * 0.53, viewport.height * 0.53); // a little oversize: edges never show
    if (reduced) return;
    u.uTime.value = state.clock.elapsedTime;
    // Ease the pointer: the cloth answers a beat late, like cloth does.
    smooth.current.lerp(pointer.current, 1 - Math.exp(-delta * 2.2));
    const aspect = viewport.width / viewport.height;
    u.uPointer.value.set(smooth.current.x * aspect, smooth.current.y * 0.9);
    u.uLight.value.copy(smooth.current);
  });

  const [sx, sy] = narrow ? [110, 90] : [220, 120];
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2, sx, sy]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function SatinDrape({ active, reduced, onReady }: { active: boolean; reduced: boolean; onReady: () => void }) {
  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      frameloop={reduced ? 'demand' : active ? 'always' : 'never'}
      camera={{ position: [0, 0, 6], fov: 30, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={() => requestAnimationFrame(onReady)}
    >
      <Cloth reduced={reduced} />
    </Canvas>
  );
}
