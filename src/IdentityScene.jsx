import { useEffect, useRef, useState } from 'react';
import './identity-scene.css';

/** An original HICH monolith. The readable HTML fallback requires no WebGL. */
export default function IdentityScene() {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const compact = window.matchMedia('(max-width: 760px)');
    const finePointer = window.matchMedia('(pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    let disposed = false, near = false, visible = false, loading = false;
    let generation = 0, releaseScene = null, syncAnimation = () => {};
    const eligible = () => !motion.matches && !connection?.saveData;

    async function initialize() {
      if (disposed || loading || releaseScene || !near || !eligible()) return;
      loading = true;
      const token = ++generation;
      let renderer, geometry, material, environment, pmrem, room;
      let resizeObserver, frame = 0;
      let pointerHandler, contextHandler;
      const disposeResources = () => {
        cancelAnimationFrame(frame);
        resizeObserver?.disconnect();
        if (pointerHandler) window.removeEventListener('pointermove', pointerHandler);
        if (contextHandler) renderer?.domElement.removeEventListener('webglcontextlost', contextHandler);
        geometry?.dispose();
        material?.dispose();
        environment?.dispose();
        pmrem?.dispose();
        room?.dispose();
        renderer?.dispose();
        renderer?.domElement.remove();
      };

      try {
        const [THREE, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/addons/environments/RoomEnvironment.js'),
        ]);
        if (disposed || token !== generation || !eligible()) return;
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact.matches ? 1.25 : 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.style.pointerEvents = 'none';

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
        camera.position.z = 8.8;
        pmrem = new THREE.PMREMGenerator(renderer);
        room = new RoomEnvironment();
        environment = pmrem.fromScene(room, 0.04);
        scene.environment = environment.texture;

        const outline = new THREE.Shape();
        const points = [[-1.25,-1.7],[-0.5,-1.7],[-0.5,-0.35],[0.5,-0.35],
          [0.5,-1.7],[1.25,-1.7],[1.25,1.7],[0.5,1.7],[0.5,0.35],
          [-0.5,0.35],[-0.5,1.7],[-1.25,1.7]];
        points.forEach(([x, y], index) => index ? outline.lineTo(x, y) : outline.moveTo(x, y));
        outline.closePath();
        geometry = new THREE.ExtrudeGeometry(outline, {
          depth: 0.58, bevelEnabled: true, bevelSegments: 5,
          steps: 1, bevelSize: 0.11, bevelThickness: 0.11,
        });
        geometry.center();
        material = new THREE.MeshPhysicalMaterial({
          color: 0xff3454, metalness: 0.94, roughness: 0.2,
          clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 2.5,
        });
        const monolith = new THREE.Mesh(geometry, material);
        monolith.rotation.set(0.1, -0.4, -0.13);
        scene.add(monolith);
        const key = new THREE.DirectionalLight(0xffc6d0, 5);
        key.position.set(-3, 4, 5);
        const rim = new THREE.DirectionalLight(0xff3454, 8);
        rim.position.set(4, -2, 2);
        scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.4));

        let pointerX = 0, pointerY = 0, elapsed = 0, previous = 0, contextLost = false;
        pointerHandler = event => {
          if (!finePointer.matches || event.pointerType === 'touch') return;
          pointerX = (event.clientX / window.innerWidth - 0.5) * 0.65;
          pointerY = (event.clientY / window.innerHeight - 0.5) * 0.3;
        };
        window.addEventListener('pointermove', pointerHandler, { passive: true });
        const draw = now => {
          frame = 0;
          if (disposed || contextLost || token !== generation || !visible || document.hidden || !eligible()) return;
          // The smaller canvas stays fluid at 30 fps without taxing a phone GPU.
          if (compact.matches && previous && now - previous < 1000 / 30) {
            frame = requestAnimationFrame(draw);
            return;
          }
          elapsed += previous ? Math.min((now - previous) / 1000, 0.06) : 0;
          previous = now;
          monolith.rotation.y += (-0.4 + Math.sin(elapsed * 0.35) * 0.26 + pointerX - monolith.rotation.y) * 0.045;
          monolith.rotation.x += (0.1 + pointerY - monolith.rotation.x) * 0.045;
          monolith.position.y = Math.sin(elapsed * 0.6) * 0.07;
          renderer.render(scene, camera);
          frame = requestAnimationFrame(draw);
        };
        syncAnimation = () => {
          cancelAnimationFrame(frame);
          frame = 0;
          previous = 0;
          if (!contextLost && !document.hidden && visible && eligible()) frame = requestAnimationFrame(draw);
        };
        resizeObserver = new ResizeObserver(() => {
          const { width, height } = host.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact.matches ? 1.25 : 1.5));
          camera.aspect = width / height;
          // Fit the entire bevelled H, including its rotation, on portrait screens.
          camera.position.z = compact.matches ? Math.max(7.1, 5.7 / camera.aspect) : 8.8;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        });
        resizeObserver.observe(host);
        contextHandler = event => {
          event.preventDefault();
          contextLost = true;
          cancelAnimationFrame(frame);
          setReady(false);
          renderer.domElement.style.visibility = 'hidden';
        };
        renderer.domElement.addEventListener('webglcontextlost', contextHandler);
        host.appendChild(renderer.domElement);
        releaseScene = disposeResources;
        setReady(true);
        syncAnimation();
      } catch {
        // GPU/import failures retain the intentional typographic fallback.
        disposeResources();
        if (!disposed) setReady(false);
      } finally {
        loading = false;
        if (!disposed && token !== generation && eligible()) initialize();
      }
    }

    const preferenceChange = () => {
      if (!eligible()) {
        generation += 1;
        releaseScene?.();
        releaseScene = null;
        syncAnimation = () => {};
        setReady(false);
      } else initialize();
    };
    const nearbyObserver = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      if (near) initialize();
    }, { rootMargin: '400px' });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    nearbyObserver.observe(host);
    visibilityObserver.observe(host);
    const visibilityChange = () => syncAnimation();
    motion.addEventListener('change', preferenceChange);
    connection?.addEventListener('change', preferenceChange);
    document.addEventListener('visibilitychange', visibilityChange);

    return () => {
      disposed = true;
      generation += 1;
      nearbyObserver.disconnect();
      visibilityObserver.disconnect();
      motion.removeEventListener('change', preferenceChange);
      connection?.removeEventListener('change', preferenceChange);
      document.removeEventListener('visibilitychange', visibilityChange);
      releaseScene?.();
    };
  }, []);

  return <div ref={hostRef} className="identity-scene" data-ready={ready} aria-hidden="true">
    <span className="identity-fallback" style={{ opacity: ready ? 0 : 1 }}>H</span>
  </div>;
}
