"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * The Dock — the hero's WebGL background.
 *
 * A luminous storage core: three stacked platters inside a faceted cage, with
 * file cards orbiting on three tilted rings. Every second or so one card breaks
 * orbit, arcs over the core, drops in, and fires a pulse ring — the product's
 * whole premise as a single moving image.
 *
 * Ported from the design's custom element rather than dropped in as one. Two
 * things had to change and both are the reason it is a component here:
 *
 * - **Colour comes from the cascade, not from attributes.** The design hard-codes
 *   its own mint and near-black. This reads `--brand` and `--background` off the
 *   document, so the scene answers the accent picker and the theme toggle like
 *   every other surface. Changing either rebuilds the scene.
 * - **It is a background, so it must cost nothing when unseen.** The loop stops
 *   when the hero scrolls away, when the tab is hidden, and before it ever
 *   starts for anyone who asked for reduced motion — who gets one still frame
 *   instead, because an empty space where the product was is worse than a
 *   static picture of it.
 *
 * `three` is imported dynamically so ~170KB of WebGL never enters the initial
 * bundle; the hero renders its text first and the scene arrives after.
 */

const DEG = Math.PI / 180;

/** Reads a resolved CSS colour off the document, so tokens drive the scene. */
function token(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * The current appearance, as a string the scene can be rebuilt against.
 *
 * The colours are baked into materials, textures and lights when the scene is
 * built, so unlike every CSS surface in the product this one cannot simply
 * inherit a change — switching accent or theme has to construct it again. The
 * two axes live on `<html>` as a class and a data attribute, so a
 * MutationObserver on that one element is the whole subscription.
 */
function subscribeAppearance(onChange) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-accent"],
  });
  return () => observer.disconnect();
}

function appearanceSnapshot() {
  const root = document.documentElement;
  return `${root.classList.contains("light") ? "light" : "dark"}:${root.dataset.accent ?? "blue"}`;
}

function useAppearance() {
  return useSyncExternalStore(subscribeAppearance, appearanceSnapshot, () => "dark:blue");
}

function radialTexture(THREE, inner, outer) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.35, outer);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A file, drawn once to a canvas — cheaper and sharper than geometry at this size. */
function cardTexture(THREE, accent, dark) {
  const w = 160;
  const h = 208;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");

  g.fillStyle = dark ? "#0d1116" : "#f4f7f6";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, w - 3, h - 3);

  g.fillStyle = accent;
  g.globalAlpha = 0.7;
  g.fillRect(16, 18, 30, 8);
  g.globalAlpha = 1;

  const lines = 5 + Math.floor(Math.random() * 3);
  g.fillStyle = dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)";
  for (let i = 0; i < lines; i++) {
    g.fillRect(16, 48 + i * 20, (w - 32) * (0.45 + Math.random() * 0.55), 8);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function HeroScene({ className }) {
  const hostRef = useRef(null);
  const appearance = useAppearance();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let disposed = false;
    let teardown = () => {};
    let idleHandle = null;

    // The application's own motion switch counts as much as the system's; a
    // visitor who turned motion down here should not get a WebGL animation.
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = () =>
      reducedQuery.matches || document.documentElement.dataset.reduceMotion === "1";

    /**
     * Waits for the main thread to be free before building anything.
     *
     * Importing three, constructing the scene and compiling its shaders is
     * roughly half a second of unbroken JavaScript. Started immediately it runs
     * alongside hydration and the hero's entrance, and the headline cannot paint
     * until it yields — which is the stutter. It is a *background* object, so it
     * has no claim on the first frame.
     *
     * The timeout is the floor: if the page never goes idle the scene still
     * arrives, just after everything that matters has drawn.
     */
    const whenIdle = (run) => {
      if (typeof requestIdleCallback === "function") {
        idleHandle = requestIdleCallback(run, { timeout: 2000 });
        return () => cancelIdleCallback(idleHandle);
      }
      idleHandle = setTimeout(run, 300);
      return () => clearTimeout(idleHandle);
    };

    let cancelIdle = whenIdle(() => {
      if (disposed) return;

      import("three")
      .then((THREE) => {
        if (disposed) return;

        const dark = !document.documentElement.classList.contains("light");
        const accent = token("--brand", "#4c8dff");
        const background = token("--background", dark ? "#08090b" : "#fbfbfc");

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        // 1.5, not 2. At devicePixelRatio 2 this shades four times as many
        // pixels as at 1, every frame, for a soft-focus background object whose
        // edges are already feathered — the extra sharpness lands on almost
        // nothing while the cost is paid continuously. Capping here also
        // shrinks every framebuffer the compositor has to carry.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        Object.assign(renderer.domElement.style, {
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
          display: "block",
        });
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        camera.position.set(0, 1.5, 12.4);
        scene.fog = new THREE.FogExp2(new THREE.Color(background), 0.028);

        const A = new THREE.Color(accent);
        const disposables = [];
        const track = (x) => {
          disposables.push(x);
          return x;
        };

        scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.45 : 0.9));
        const key = new THREE.DirectionalLight(0xffffff, dark ? 1.6 : 2.2);
        key.position.set(4, 6, 5);
        scene.add(key);
        const rimLight = new THREE.PointLight(A, dark ? 26 : 12, 18, 2);
        scene.add(rimLight);

        const world = new THREE.Group();
        // Roughly centred in the band, sitting a little low so the floor grid
        // and its glow stay in frame. The design's -2.1 was tuned for a
        // full-viewport canvas; this one is a third of that tall.
        world.position.y = -0.15;
        scene.add(world);

        /* ------------------------------------------------ core: platters -- */
        const core = new THREE.Group();
        world.add(core);

        const shellMat = track(
          new THREE.MeshStandardMaterial({
            color: dark ? 0x141a20 : 0xdfe6e4,
            metalness: 0.85,
            roughness: 0.28,
          }),
        );
        const glowMat = track(
          new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.9 }),
        );
        const notchMat = track(
          new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.55 }),
        );

        const platters = [];
        [-0.62, 0, 0.62].forEach((y, i) => {
          const g = new THREE.Group();
          const radius = 1.05 - Math.abs(y) * 0.28;

          g.add(
            new THREE.Mesh(
              track(new THREE.CylinderGeometry(radius, radius, 0.14, 72, 1, false)),
              shellMat,
            ),
          );

          const ring = new THREE.Mesh(
            track(new THREE.TorusGeometry(radius + 0.01, 0.014, 8, 96)),
            glowMat,
          );
          ring.rotation.x = Math.PI / 2;
          g.add(ring);

          const notchGeo = track(new THREE.BoxGeometry(0.05, 0.02, 0.1));
          for (let k = 0; k < 12; k++) {
            const n = new THREE.Mesh(notchGeo, notchMat);
            const a = (k / 12) * Math.PI * 2;
            n.position.set(Math.cos(a) * (radius - 0.08), 0.075, Math.sin(a) * (radius - 0.08));
            n.rotation.y = -a;
            g.add(n);
          }

          g.position.y = y;
          g.userData.spin = (i === 1 ? 0.28 : -0.18) * (i === 2 ? 1.4 : 1);
          core.add(g);
          platters.push(g);
        });

        const column = new THREE.Mesh(
          track(new THREE.CylinderGeometry(0.055, 0.055, 1.9, 24, 1, true)),
          track(
            new THREE.MeshBasicMaterial({
              color: A,
              transparent: true,
              opacity: 0.55,
              blending: THREE.AdditiveBlending,
              side: THREE.DoubleSide,
              depthWrite: false,
            }),
          ),
        );
        core.add(column);

        const cage = new THREE.LineSegments(
          track(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.75, 0))),
          track(
            new THREE.LineBasicMaterial({
              color: A,
              transparent: true,
              opacity: dark ? 0.42 : 0.35,
            }),
          ),
        );
        core.add(cage);

        const rgb = `${(A.r * 255) | 0},${(A.g * 255) | 0},${(A.b * 255) | 0}`;
        const haloTex = track(
          radialTexture(THREE, "rgba(255,255,255,0.95)", `rgba(${rgb},0.55)`),
        );
        const halo = new THREE.Sprite(
          track(
            new THREE.SpriteMaterial({
              map: haloTex,
              blending: THREE.AdditiveBlending,
              transparent: true,
              depthWrite: false,
              opacity: dark ? 0.9 : 0.45,
            }),
          ),
        );
        halo.scale.set(9.5, 9.5, 1);
        core.add(halo);

        /* ------------------------------------------- orbiting file cards -- */
        const rings = [
          { r: 3.1, tilt: 15 * DEG, yaw: 0, speed: 0.3, n: 5 },
          { r: 4.5, tilt: -26 * DEG, yaw: 40 * DEG, speed: -0.21, n: 6 },
          { r: 6.0, tilt: 8 * DEG, yaw: -35 * DEG, speed: 0.15, n: 7 },
        ];

        const cards = [];
        const cardGeo = track(new THREE.BoxGeometry(0.34, 0.44, 0.016));

        /**
         * Four card faces, shared by eighteen cards.
         *
         * Each card used to build its own 160×208 canvas, draw it, and upload
         * it as a separate GPU texture — eighteen canvas allocations and
         * eighteen uploads during the scene build, which is a large part of why
         * the hero stuttered. The faces are randomised line-work seen at
         * thumbnail size from a moving camera; four is well past the point
         * where anyone could tell.
         *
         * The *textures* are shared. The materials are not — the docking
         * animation writes `opacity` per card, so one material across eighteen
         * meshes would fade them all together.
         */
        const cardFaces = Array.from({ length: 4 }, () =>
          track(cardTexture(THREE, accent, dark)),
        );

        let faceIndex = 0;

        rings.forEach((ring, ri) => {
          const q = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(ring.tilt, ring.yaw, 0),
          );
          for (let i = 0; i < ring.n; i++) {
            const mat = track(
              new THREE.MeshStandardMaterial({
                map: cardFaces[faceIndex++ % cardFaces.length],
                // Neutral rather than the design's mint-tinted grey, which was
                // chosen for one fixed accent and turns green cards blue-green
                // under a blue one.
                color: dark ? 0xaab3bd : 0xffffff,
                metalness: 0.15,
                roughness: 0.6,
                emissive: A,
                emissiveIntensity: dark ? 0.05 : 0.03,
                transparent: true,
              }),
            );
            const m = new THREE.Mesh(cardGeo, mat);
            m.userData = {
              q,
              r: ring.r,
              speed: ring.speed,
              a: (i / ring.n) * Math.PI * 2 + ri,
              bob: Math.random() * Math.PI * 2,
              state: "orbit",
              t: 0,
              from: new THREE.Vector3(),
            };
            world.add(m);
            cards.push(m);
          }
        });

        /* ------------------------------------------------ dock pulses -- */
        const pulseGeo = track(new THREE.TorusGeometry(1, 0.012, 6, 96));
        const pulses = [];
        for (let i = 0; i < 4; i++) {
          const p = new THREE.Mesh(
            pulseGeo,
            track(
              new THREE.MeshBasicMaterial({
                color: A,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              }),
            ),
          );
          p.rotation.x = Math.PI / 2;
          p.visible = false;
          world.add(p);
          pulses.push(p);
        }

        const firePulse = () => {
          const p = pulses.find((x) => !x.visible);
          if (!p) return;
          p.visible = true;
          p.userData.t = 0;
          p.scale.setScalar(0.4);
          p.material.opacity = 0.9;
        };

        /* -------------------------------------------------- ambient dust -- */
        const N = 700;
        const pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const r = 3 + Math.random() * 7;
          const th = Math.random() * Math.PI * 2;
          const ph = Math.acos(2 * Math.random() - 1);
          pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
          pos[i * 3 + 1] = r * Math.cos(ph) * 0.5;
          pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
        }
        const dustGeo = track(new THREE.BufferGeometry());
        dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const dust = new THREE.Points(
          dustGeo,
          track(
            new THREE.PointsMaterial({
              color: A,
              size: 0.035,
              transparent: true,
              opacity: dark ? 0.7 : 0.35,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              sizeAttenuation: true,
            }),
          ),
        );
        world.add(dust);

        /* --------------------------------------------------------- floor -- */
        const grid = new THREE.GridHelper(30, 30, A, A);
        grid.material.transparent = true;
        grid.material.opacity = dark ? 0.11 : 0.14;
        grid.material.depthWrite = false;
        grid.position.y = -2.6;
        world.add(grid);
        track(grid.material);
        track(grid.geometry);

        const floorGlow = new THREE.Mesh(
          track(new THREE.PlaneGeometry(22, 22)),
          track(
            new THREE.MeshBasicMaterial({
              map: track(radialTexture(THREE, `rgba(${rgb},0.45)`, "rgba(0,0,0,0)")),
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              opacity: dark ? 0.5 : 0.25,
            }),
          ),
        );
        floorGlow.rotation.x = -Math.PI / 2;
        floorGlow.position.y = -2.58;
        world.add(floorGlow);

        /* ------------------------------------------------------- motion -- */
        /*
         * The dock moves on its own clock, and on nothing else.
         *
         * It used to read the pointer and rotate towards it, which tied the
         * object to the cursor: move the mouse anywhere on the page and the
         * whole scene leaned after it. That makes an ambient background feel
         * like a control — something being operated rather than something
         * happening — and on a page whose actual controls sit right beside it,
         * the two compete for the same gesture.
         *
         * What replaces it is drift: a slow yaw and a shallow tilt on
         * independent, deliberately unrelated periods, so the loop never lands
         * on an obvious beat. The result still breathes, but it belongs to the
         * page rather than to the hand.
         */

        const resize = () => {
          const w = host.clientWidth || 1;
          const h = host.clientHeight || 1;
          renderer.setSize(w, h, false);
          const aspect = w / h;
          camera.aspect = aspect;
          // Pull back on a narrow viewport so the core always fits the frame.
          camera.fov = aspect < 1 ? 54 : 38;
          // Distance follows the shape of the frame, because the limiting
          // dimension changes with it: in a wide band the height runs out
          // first, in a column the width does. A single fixed distance leaves
          // the dock either cropped or stranded in the middle of empty space.
          camera.position.z = aspect > 2.4 ? 8.2 : aspect > 1.6 ? 9.0 : 10.2;
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(host);
        resize();

        // Offscreen and background tabs cost nothing. A hero animation that
        // keeps rendering while you read the pricing section is a battery bug.
        let onscreen = true;
        const io = new IntersectionObserver(
          (entries) => {
            onscreen = entries[0].isIntersecting;
          },
          { threshold: 0 },
        );
        io.observe(host);

        // `Timer`, not `Clock` — the latter is deprecated as of r180 and warns
        // on every construction. `connect` is the reason to prefer it beyond
        // the deprecation: it watches page visibility and resets itself when
        // the tab comes back, so returning to a backgrounded tab does not
        // deliver one enormous delta and jump every card across its orbit.
        const timer = new THREE.Timer();
        timer.connect(document);

        const v = new THREE.Vector3();
        let nextDock = 1.2;

        const update = (dt) => {
          const t = timer.getElapsed();

          platters.forEach((g) => {
            g.rotation.y += g.userData.spin * dt;
          });
          cage.rotation.y -= 0.12 * dt;
          cage.rotation.x = Math.sin(t * 0.25) * 0.12;
          column.scale.y = 1 + Math.sin(t * 2.2) * 0.04;
          column.material.opacity = 0.42 + Math.sin(t * 2.2) * 0.14;
          halo.material.opacity = (dark ? 0.85 : 0.4) + Math.sin(t * 1.4) * 0.08;
          rimLight.intensity = (dark ? 24 : 11) + Math.sin(t * 1.8) * 4;
          dust.rotation.y += 0.012 * dt;

          nextDock -= dt;
          if (nextDock <= 0) {
            const pool = cards.filter((c) => c.userData.state === "orbit");
            if (pool.length) {
              const c = pool[(Math.random() * pool.length) | 0];
              c.userData.state = "dock";
              c.userData.t = 0;
              c.userData.from.copy(c.position);
            }
            nextDock = 1.4 + Math.random() * 1.2;
          }

          for (const c of cards) {
            const u = c.userData;

            if (u.state === "orbit" || u.state === "return") {
              u.a += u.speed * dt * 0.35;
              v.set(
                Math.cos(u.a) * u.r,
                Math.sin(t * 0.8 + u.bob) * 0.14,
                Math.sin(u.a) * u.r,
              ).applyQuaternion(u.q);

              if (u.state === "return") {
                u.t += dt / 0.9;
                const k = Math.min(1, u.t);
                c.position.lerpVectors(u.from, v, k * k * (3 - 2 * k));
                c.material.opacity = k;
                c.scale.setScalar(0.3 + 0.7 * k);
                if (k >= 1) {
                  u.state = "orbit";
                  c.material.opacity = 1;
                  c.scale.setScalar(1);
                }
              } else {
                c.position.copy(v);
              }
            } else if (u.state === "dock") {
              u.t += dt / 1.1;
              const k = Math.min(1, u.t);
              const e = k * k * (3 - 2 * k);
              // Arc up over the core, then drop in.
              v.copy(u.from).multiplyScalar(1 - e);
              v.y += Math.sin(e * Math.PI) * 1.5;
              c.position.copy(v);
              c.scale.setScalar(1 - e * 0.85);
              c.material.opacity = 1 - e * e;

              if (k >= 1) {
                firePulse();
                u.state = "return";
                u.t = 0;
                u.a = Math.random() * Math.PI * 2;
                const spawn = new THREE.Vector3(
                  Math.cos(u.a) * u.r * 1.7,
                  0.6,
                  Math.sin(u.a) * u.r * 1.7,
                ).applyQuaternion(u.q);
                u.from.copy(spawn);
                c.position.copy(spawn);
                c.material.opacity = 0;
              }
            }

            c.lookAt(camera.position);
            c.rotateZ(Math.sin(t * 0.5 + u.bob) * 0.12);
          }

          for (const p of pulses) {
            if (!p.visible) continue;
            p.userData.t += dt / 1.3;
            const k = p.userData.t;
            p.scale.setScalar(0.4 + k * 4.2);
            p.material.opacity = Math.max(0, 0.85 * (1 - k));
            if (k >= 1) p.visible = false;
          }

          // Continuous yaw, so the core is always turning rather than waiting
          // to be turned. Faster than the old 0.02, which only looked slow
          // because the pointer was supplying most of the movement.
          world.rotation.y = t * 0.055;

          // A shallow tilt on a long period. Small enough to read as the object
          // settling rather than rocking.
          world.rotation.x = Math.sin(t * 0.21) * 0.07;

          // The camera drifts too, on periods that share no common multiple
          // with the tilt — the composition never repeats exactly, which is
          // what stops a loop from becoming visible.
          camera.position.x = Math.sin(t * 0.13) * 0.28;
          camera.position.y = 1.5 + Math.sin(t * 0.17) * 0.13;
          camera.lookAt(0, 0, 0);
        };

        /*
         * The scene renders at thirty frames a second, not sixty.
         *
         * A background does not need a frame every time the page gets one. This
         * one turns at about three degrees a second and its cards drift; at
         * that speed thirty and sixty are indistinguishable side by side. What
         * is very distinguishable is the page it sits behind: rendering the
         * scene on every frame took the whole document from 60fps to 30 while
         * scrolling, because the scroll and the scene were competing for the
         * same frame budget.
         *
         * Halving the scene's rate hands those frames back to the scroll, which
         * is the thing the eye is actually tracking while it moves.
         *
         * The skipped time is accumulated rather than discarded, so the object
         * moves at exactly the same speed as before — it is drawn half as
         * often, not animated half as fast.
         */
        const FRAME = 1 / 30;

        /*
         * And a quarter of that while the page is moving.
         *
         * Scrolling is the one moment the scene and the reader want different
         * things. The eye is tracking the document, not a slowly turning object
         * behind it — but that object is competing for the very frames the
         * scroll needs to stay smooth. So it stands down: while a scroll is in
         * flight the dock keeps moving, just far more cheaply, and it returns to
         * its normal rate a moment after the page settles.
         *
         * Nobody can see a background lose frames during a scroll. Everybody can
         * see the scroll lose them.
         */
        const SCROLLING_FRAME = 1 / 8;

        let scrolling = false;
        let settle = null;
        const onScroll = () => {
          scrolling = true;
          if (settle) window.clearTimeout(settle);
          settle = window.setTimeout(() => {
            scrolling = false;
          }, 140);
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        let elapsed = 0;
        let raf = 0;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          timer.update();
          // Still clamped. `connect` covers the tab-switch case; this covers
          // the rest — a blocked main thread, a dragged window, a laptop lid.
          const dt = Math.min(timer.getDelta(), 0.05);
          if (!onscreen || document.hidden) return;

          elapsed += dt;
          if (elapsed < (scrolling ? SCROLLING_FRAME : FRAME)) return;

          update(elapsed);
          elapsed = 0;
          renderer.render(scene, camera);
        };

        if (isReduced()) {
          // One composed frame, then nothing moves.
          update(0);
          renderer.render(scene, camera);
        } else {
          loop();
        }

        teardown = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("scroll", onScroll);
          if (settle) window.clearTimeout(settle);
          // Releases the visibilitychange listener `connect` installed.
          timer.dispose();
          ro.disconnect();
          io.disconnect();
          for (const d of disposables) d.dispose?.();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => {
        // No WebGL, or the chunk failed. The hero is complete without it.
      });
    });

    return () => {
      disposed = true;
      // Unmounting before the idle slot arrives must cancel it, or a scene is
      // built into a host that has already left the document.
      cancelIdle?.();
      teardown();
    };
    // Rebuilt whenever the accent or the theme changes: the colours are baked
    // into materials and canvas textures at construction, so there is nothing
    // for a live update to reach into.
  }, [appearance]);

  // The canvas is a rectangle and the scene inside it is not: the floor grid
  // and its glow run to the edges and stop dead, drawing a box around the dock
  // that announces where the WebGL ends. Feathering the element's own alpha
  // lets the scene dissolve into the page instead — the same job the vignette
  // does for the section, at the scale of the object.
  const FEATHER = "radial-gradient(ellipse 82% 82% at 50% 47%, #000 48%, transparent 100%)";

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={className}
      style={{ maskImage: FEATHER, WebkitMaskImage: FEATHER }}
    />
  );
}
