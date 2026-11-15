'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { EMBLEM_PETALS, EMBLEM_VIEWBOX } from '../emblem-paths';

/**
 * The error page: the House lotus, built from its own thirteen petals (the same traced paths as
 * the <Emblem> logo, extruded a little so they catch the light like satin), opens, then comes
 * gently apart and drifts. "Try again" calls them back into the flower.
 *
 * - Home: the petals' exact place in the logo, over the DOM anchor the page leaves for the lotus.
 * - Away: spread round the edges of the view (never behind the words), each turning slowly.
 * - A second, smaller set of petals joins them as they leave, so the page feels scattered, not
 *   merely taken apart.
 * With reduced motion it is drawn once, already scattered.
 */

type Petal = {
  geometry: THREE.ExtrudeGeometry;
  /** centre of the petal in logo space, y up, origin at the logo's centre */
  cx: number;
  cy: number;
  step: number;
};

const [, , VB_W, VB_H] = EMBLEM_VIEWBOX.split(' ').map(Number);

/** Small deterministic random, so the scatter is the same on every visit. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPetals(): { petals: Petal[]; width: number } {
  const loader = new SVGLoader();
  const petals: Petal[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of EMBLEM_PETALS) {
    // scale(1,-1): SVG's y runs down, the scene's runs up. ExtrudeGeometry re-winds the shape.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${EMBLEM_VIEWBOX}"><path transform="scale(1,-1)" d="${p.d}"/></svg>`;
    const data = loader.parse(svg);
    const shapes = data.paths.flatMap((path) => path.toShapes());
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 16,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 5,
      bevelSize: 4,
      bevelSegments: 3,
    });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    // Read the extent now: translate() updates this same box in place.
    minX = Math.min(minX, box.min.x);
    maxX = Math.max(maxX, box.max.x);
    geometry.translate(-cx, -cy, -8);
    petals.push({ geometry, cx: cx - VB_W / 2, cy: cy + VB_H / 2, step: p.step });
  }
  return { petals, width: maxX - minX };
}

type Piece = {
  petal: Petal;
  scale: number; // 1 for the logo's own petals, smaller for the extras
  extra: boolean;
  away: THREE.Vector3; // as a fraction of the half-extents of the view
  tilt: THREE.Vector3;
  spin: number;
  phase: number;
  material: THREE.MeshPhysicalMaterial;
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Petals({
  anchor,
  scattered,
  reduced,
  onReady,
}: {
  anchor: React.RefObject<HTMLElement | null>;
  scattered: boolean;
  reduced: boolean;
  onReady: () => void;
}) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const gl = useThree((s) => s.gl);
  const narrow = size.width < 768;
  const invalidate = useThree((s) => s.invalidate);
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const home = useRef({ x: 0, y: 0, w: 1 }); // the logo's place, in world units
  const progress = useRef(reduced ? 1 : 0); // 0 = flower, 1 = scattered
  const born = useRef(-1);
  const target = useRef(reduced ? 1 : 0);
  const ready = useRef(false);

  const { petals, width } = useMemo(buildPetals, []);
  useEffect(() => () => petals.forEach((p) => p.geometry.dispose()), [petals]);

  const pieces = useMemo<Piece[]>(() => {
    const rand = rng(7);
    const make = (petal: Petal, i: number, extra: boolean): Piece => {
      // Round the edges of the view, never through the middle where the words are.
      const a = (i / (petals.length * 2)) * Math.PI * 2 + rand() * 0.5 + (extra ? 0.24 : 0);
      const r = 0.82 + rand() * 0.2;
      return {
        petal,
        extra,
        scale: extra ? 0.55 : 1,
        away: new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, -0.4 - rand() * 0.8),
        tilt: new THREE.Vector3((rand() - 0.5) * 2.2, (rand() - 0.5) * 2.2, (rand() - 0.5) * 3),
        spin: (rand() - 0.5) * 0.5,
        phase: rand() * 6.28,
        material: new THREE.MeshPhysicalMaterial({
          color: i % 5 === 0 ? '#7a0b10' : '#a20f15',
          roughness: 0.36,
          metalness: 0.05,
          sheen: 1,
          sheenRoughness: 0.35,
          sheenColor: new THREE.Color('#ff5148'),
        }),
      };
    };
    return [...petals.map((p, i) => make(p, i, false)), ...petals.map((p, i) => make(petals[(i * 5) % petals.length], i + petals.length, true))];
  }, [petals]);
  useEffect(() => () => pieces.forEach((p) => p.material.dispose()), [pieces]);

  useEffect(() => {
    target.current = scattered ? 1 : 0;
  }, [scattered]);

  // Where the logo sits: over the page's own anchor element.
  useEffect(() => {
    const place = () => {
      const el = anchor.current;
      if (!el) return;
      const a = el.getBoundingClientRect();
      const c = gl.domElement.getBoundingClientRect();
      const wpp = viewport.width / size.width;
      home.current.x = (a.left + a.width / 2 - c.left - size.width / 2) * wpp;
      home.current.y = -(a.top + a.height / 2 - c.top - size.height / 2) * wpp;
      home.current.w = (a.width * wpp) / width;
      invalidate(); // a still frame (reduced motion) must redraw at the new place
    };
    place();
    const t = setTimeout(place, 400); // after fonts and the rise-in settle
    window.addEventListener('resize', place);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', place);
    };
  }, [anchor, size, viewport, width, gl, invalidate]);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, delta) => {
    if (born.current < 0) born.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime;
    const age = t - born.current;
    if (!reduced) {
      const k = 1 - Math.exp(-delta * (target.current > progress.current ? 1.1 : 2.4));
      progress.current += (target.current - progress.current) * k;
    }
    const s = easeInOut(Math.min(Math.max(progress.current, 0), 1));
    const { x: hx, y: hy, w: hw } = home.current;
    const hv = viewport.height / 2;
    const hh = viewport.width / 2;

    pieces.forEach((p, i) => {
      const m = meshes.current[i];
      if (!m) return;
      // Bloom: ring by ring from the base, as the logo does on the site.
      const bloom = reduced || p.extra ? 1 : easeInOut(Math.min(Math.max((age - p.petal.step * 0.14) / 1.0, 0), 1));
      // Leaving the flower, the petals grow to a size you can see across a page.
      const sc = p.extra ? hw * p.scale * s * (1 + 1.6 * s) : hw * (0.35 + 0.65 * bloom) * (1 + (narrow ? 1.1 : 1.7) * s);
      m.visible = sc > 0.0001;
      m.scale.setScalar(sc);

      // On a narrow screen the words fill the width, so the petals keep to the bands above and below them.
      const ay = narrow ? Math.sign(p.away.y || 1) * (0.8 + 0.18 * Math.min(Math.abs(p.away.y), 1)) * hv : p.away.y * hv;
      const bob = reduced ? 0 : s;
      tmp.set(hx + p.petal.cx * hw, hy + p.petal.cy * hw, 0);
      m.position.set(
        tmp.x + (p.away.x * hh - tmp.x) * s + Math.sin(t * 0.35 + p.phase) * 0.12 * bob,
        tmp.y + (ay - tmp.y) * s + Math.cos(t * 0.3 + p.phase * 1.3) * 0.1 * bob,
        p.away.z * s,
      );
      m.rotation.set(
        p.tilt.x * s + Math.sin(t * 0.4 + p.phase) * 0.25 * bob,
        p.tilt.y * s + (reduced ? 0 : t * p.spin * s),
        p.tilt.z * s + Math.cos(t * 0.33 + p.phase) * 0.2 * bob,
      );
    });

    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(onReady);
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[-3, 4, 5]} intensity={2.6} />
      <directionalLight position={[4, -2, 3]} intensity={0.9} color="#ffd9d4" />
      {pieces.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={p.petal.geometry}
          material={p.material}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

export default function PetalScatter(props: {
  anchor: React.RefObject<HTMLElement | null>;
  scattered: boolean;
  active: boolean;
  reduced: boolean;
  onReady: () => void;
}) {
  const { active, reduced, ...rest } = props;
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop={reduced ? 'demand' : active ? 'always' : 'never'}
      camera={{ position: [0, 0, 8], fov: 30, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Petals reduced={reduced} {...rest} />
    </Canvas>
  );
}
