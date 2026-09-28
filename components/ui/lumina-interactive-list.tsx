'use client';

import React, { useEffect, useRef } from 'react';

declare const gsap: any;
declare const THREE: any;

export interface LuminaSlide {
  title: string;
  description: string;
  price: number;
  media: string;
  size?: string;
  checkoutUrl?: string; // Shopify product URL
}

interface LuminaInteractiveListProps {
  slides: LuminaSlide[];
  effect?: 'glass' | 'frost' | 'ripple' | 'plasma' | 'timeshift';
  collectionName?: string;
}

export function LuminaInteractiveList({
  slides,
  effect = 'glass',
  collectionName = 'Collection',
}: LuminaInteractiveListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadScript = (src: string, globalName: string) =>
      new Promise<void>((res, rej) => {
        if ((window as any)[globalName]) { res(); return; }
        if (document.querySelector(`script[src="${src}"]`)) {
          const check = setInterval(() => {
            if ((window as any)[globalName]) { clearInterval(check); res(); }
          }, 50);
          setTimeout(() => { clearInterval(check); rej(); }, 10000);
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => setTimeout(() => res(), 100);
        s.onerror = () => rej();
        document.head.appendChild(s);
      });

    const initApplication = () => {
      const EFFECT_MAP: Record<string, number> = { glass: 0, frost: 1, ripple: 2, plasma: 3, timeshift: 4 };

      let currentSlideIndex = 0;
      let isTransitioning = false;
      let shaderMaterial: any, renderer: any, scene: any, camera: any;
      const slideTextures: any[] = [];
      let texturesLoaded = false;
      let autoSlideTimer: any = null;
      let progressAnimation: any = null;
      let sliderEnabled = false;

      const SLIDE_DURATION = 6000;
      const PROGRESS_UPDATE_INTERVAL = 50;
      const TRANSITION_DURATION = 2.2;

      const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

      const fragmentShader = `
        uniform sampler2D uTexture1, uTexture2;
        uniform float uProgress;
        uniform vec2 uResolution, uTexture1Size, uTexture2Size;
        uniform int uEffectType;
        uniform float uGlobalIntensity, uSpeedMultiplier, uDistortionStrength;
        uniform float uGlassRefractionStrength, uGlassChromaticAberration, uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
        varying vec2 vUv;

        vec2 getCoverUV(vec2 uv, vec2 textureSize) {
          vec2 s = uResolution / textureSize;
          float scale = max(s.x, s.y);
          vec2 scaledSize = textureSize * scale;
          vec2 offset = (uResolution - scaledSize) * 0.5;
          return (uv * uResolution - offset) / scaledSize;
        }

        vec4 glassEffect(vec2 uv, float progress) {
          float time = progress * 5.0 * uSpeedMultiplier;
          vec2 uv1 = getCoverUV(uv, uTexture1Size);
          vec2 uv2 = getCoverUV(uv, uTexture2Size);
          float maxR = length(uResolution) * 0.85;
          float br = progress * maxR;
          vec2 p = uv * uResolution;
          vec2 c = uResolution * 0.5;
          float d = length(p - c);
          float nd = d / max(br, 0.001);
          float param = smoothstep(br + 3.0, br - 3.0, d);
          vec4 img;
          if (param > 0.0) {
            float ro = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.0, nd), 1.5);
            vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
            vec2 distUV = uv2 - dir * ro;
            distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0)) * 0.015 * uGlassLiquidFlow * uSpeedMultiplier * nd * param;
            float ca = 0.02 * uGlassChromaticAberration * uGlobalIntensity * pow(smoothstep(0.3, 1.0, nd), 1.2);
            img = vec4(texture2D(uTexture2, distUV + dir * ca * 1.2).r, texture2D(uTexture2, distUV + dir * ca * 0.2).g, texture2D(uTexture2, distUV - dir * ca * 0.8).b, 1.0);
            if (uGlassEdgeGlow > 0.0) {
              float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
              img.rgb += rim * 0.08 * uGlassEdgeGlow * uGlobalIntensity;
            }
          } else { img = texture2D(uTexture2, uv2); }
          vec4 oldImg = texture2D(uTexture1, uv1);
          if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
          return mix(oldImg, img, param);
        }

        vec4 rippleEffect(vec2 uv, float progress) {
          vec2 uv1 = getCoverUV(uv, uTexture1Size);
          vec2 uv2 = getCoverUV(uv, uTexture2Size);
          vec2 center = vec2(0.5);
          float dist = length(uv - center);
          float wave = sin(dist * 30.0 - progress * 12.0) * 0.03 * (1.0 - progress) * uDistortionStrength;
          vec2 distUV1 = uv1 + normalize(uv - center) * wave;
          vec2 distUV2 = uv2 + normalize(uv - center) * wave;
          return mix(texture2D(uTexture1, distUV1), texture2D(uTexture2, distUV2), smoothstep(0.0, 1.0, progress));
        }

        vec4 plasmaEffect(vec2 uv, float progress) {
          vec2 uv1 = getCoverUV(uv, uTexture1Size);
          vec2 uv2 = getCoverUV(uv, uTexture2Size);
          float noise = fract(sin(dot(uv * progress * 12.0, vec2(127.1, 311.7))) * 43758.5453);
          vec2 distUV2 = uv2 + vec2(noise - 0.5) * 0.06 * uDistortionStrength * (1.0 - progress);
          return mix(texture2D(uTexture1, uv1), texture2D(uTexture2, distUV2), smoothstep(0.0, 1.0, progress));
        }

        vec4 timeshiftEffect(vec2 uv, float progress) {
          vec2 uv1 = getCoverUV(uv, uTexture1Size);
          vec2 uv2 = getCoverUV(uv, uTexture2Size);
          float shift = (1.0 - progress) * 0.04 * uDistortionStrength;
          vec4 c1 = vec4(texture2D(uTexture1, uv1 + vec2(shift, 0.0)).r, texture2D(uTexture1, uv1).g, texture2D(uTexture1, uv1 - vec2(shift, 0.0)).b, 1.0);
          vec4 c2 = vec4(texture2D(uTexture2, uv2 + vec2(shift, 0.0)).r, texture2D(uTexture2, uv2).g, texture2D(uTexture2, uv2 - vec2(shift, 0.0)).b, 1.0);
          return mix(c1, c2, smoothstep(0.0, 1.0, progress));
        }

        vec4 frostEffect(vec2 uv, float progress) {
          vec2 uv1 = getCoverUV(uv, uTexture1Size);
          vec2 uv2 = getCoverUV(uv, uTexture2Size);
          float noise = fract(sin(dot(uv * 150.0, vec2(127.1, 311.7))) * 43758.5453);
          float frost = smoothstep(0.5 - 0.5 * progress, 0.5 + 0.5 * progress, noise);
          return mix(texture2D(uTexture1, uv1), texture2D(uTexture2, uv2), frost);
        }

        void main() {
          if (uEffectType == 0) gl_FragColor = glassEffect(vUv, uProgress);
          else if (uEffectType == 1) gl_FragColor = frostEffect(vUv, uProgress);
          else if (uEffectType == 2) gl_FragColor = rippleEffect(vUv, uProgress);
          else if (uEffectType == 3) gl_FragColor = plasmaEffect(vUv, uProgress);
          else gl_FragColor = timeshiftEffect(vUv, uProgress);
        }
      `;

      const splitText = (text: string) =>
        text.split('').map(char =>
          `<span style="display:inline-block;opacity:0">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');

      const updateContent = (idx: number) => {
        const titleEl = document.getElementById('lm-title');
        const descEl = document.getElementById('lm-desc');
        const priceEl = document.getElementById('lm-price');
        const btnEl = document.getElementById('lm-buy') as HTMLAnchorElement | null;
        if (!titleEl || !descEl) return;

        gsap.to([titleEl.children, descEl], { y: -16, opacity: 0, duration: 0.4, stagger: 0.015, ease: 'power2.in' });
        setTimeout(() => {
          titleEl.innerHTML = splitText(slides[idx].title);
          descEl.textContent = slides[idx].description;
          if (priceEl) priceEl.textContent = `$${slides[idx].price.toFixed(2)}`;
          if (btnEl && slides[idx].checkoutUrl) btnEl.href = slides[idx].checkoutUrl!;

          gsap.set(titleEl.children, { y: 20, opacity: 0 });
          gsap.set(descEl, { y: 12, opacity: 0 });
          gsap.to(titleEl.children, { y: 0, opacity: 1, duration: 0.75, stagger: 0.025, ease: 'power3.out' });
          gsap.to(descEl, { y: 0, opacity: 1, duration: 0.75, delay: 0.18, ease: 'power3.out' });
          if (priceEl) gsap.fromTo(priceEl, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.3 });
          if (btnEl) gsap.fromTo(btnEl, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: 'power3.out' });
        }, 420);
      };

      const navigateToSlide = (targetIndex: number) => {
        if (isTransitioning || targetIndex === currentSlideIndex) return;
        stopTimer();

        const cTex = slideTextures[currentSlideIndex];
        const tTex = slideTextures[targetIndex];
        if (!cTex || !tTex) return;

        isTransitioning = true;
        shaderMaterial.uniforms.uTexture1.value = cTex;
        shaderMaterial.uniforms.uTexture2.value = tTex;
        shaderMaterial.uniforms.uTexture1Size.value = cTex.userData.size;
        shaderMaterial.uniforms.uTexture2Size.value = tTex.userData.size;

        updateContent(targetIndex);
        currentSlideIndex = targetIndex;
        updateNav(currentSlideIndex);

        gsap.fromTo(shaderMaterial.uniforms.uProgress,
          { value: 0 },
          {
            value: 1, duration: TRANSITION_DURATION, ease: 'power2.inOut',
            onComplete: () => {
              shaderMaterial.uniforms.uProgress.value = 0;
              shaderMaterial.uniforms.uTexture1.value = tTex;
              shaderMaterial.uniforms.uTexture1Size.value = tTex.userData.size;
              isTransitioning = false;
              startTimer(200);
            }
          }
        );
      };

      const stopTimer = () => {
        if (progressAnimation) clearInterval(progressAnimation);
        if (autoSlideTimer) clearTimeout(autoSlideTimer);
        progressAnimation = null; autoSlideTimer = null;
      };

      const startTimer = (delay = 0) => {
        stopTimer();
        if (!sliderEnabled || !texturesLoaded) return;
        const run = () => {
          let progress = 0;
          const inc = (100 / SLIDE_DURATION) * PROGRESS_UPDATE_INTERVAL;
          progressAnimation = setInterval(() => {
            progress += inc;
            updateProgress(currentSlideIndex, progress);
            if (progress >= 100) {
              clearInterval(progressAnimation);
              progressAnimation = null;
              if (!isTransitioning) navigateToSlide((currentSlideIndex + 1) % slides.length);
            }
          }, PROGRESS_UPDATE_INTERVAL);
        };
        if (delay > 0) autoSlideTimer = setTimeout(run, delay);
        else run();
      };

      const updateNav = (idx: number) =>
        document.querySelectorAll('.lm-nav-item').forEach((el, i) => el.classList.toggle('active', i === idx));

      const updateProgress = (idx: number, prog: number) => {
        const el = document.querySelectorAll('.lm-nav-item')[idx]?.querySelector('.lm-progress-fill') as HTMLElement;
        if (el) { el.style.width = `${prog}%`; el.style.opacity = '1'; }
      };

      const buildNav = () => {
        const nav = document.getElementById('lm-nav');
        if (!nav) return;
        nav.innerHTML = '';
        slides.forEach((slide, i) => {
          const item = document.createElement('div');
          item.className = `lm-nav-item${i === 0 ? ' active' : ''}`;
          item.innerHTML = `
            <div class="lm-progress-line"><div class="lm-progress-fill"></div></div>
            <div class="lm-nav-title">${slide.title}</div>
          `;
          item.addEventListener('click', () => {
            if (!isTransitioning && i !== currentSlideIndex) navigateToSlide(i);
          });
          nav.appendChild(item);
        });
      };

      const loadTex = (src: string): Promise<any> =>
        new Promise((resolve, reject) => {
          const loader = new THREE.TextureLoader();
          loader.load(src, (t: any) => {
            t.minFilter = t.magFilter = THREE.LinearFilter;
            t.userData = { size: new THREE.Vector2(t.image.width, t.image.height) };
            resolve(t);
          }, undefined, reject);
        });

      const initRenderer = async () => {
        const canvas = document.querySelector('.lm-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        shaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uTexture1: { value: null }, uTexture2: { value: null },
            uProgress: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uTexture1Size: { value: new THREE.Vector2(1, 1) },
            uTexture2Size: { value: new THREE.Vector2(1, 1) },
            uEffectType: { value: EFFECT_MAP[effect] ?? 0 },
            uGlobalIntensity: { value: 1.0 }, uSpeedMultiplier: { value: 1.0 },
            uDistortionStrength: { value: 1.0 },
            uGlassRefractionStrength: { value: 1.0 }, uGlassChromaticAberration: { value: 1.0 },
            uGlassBubbleClarity: { value: 1.0 }, uGlassEdgeGlow: { value: 1.0 }, uGlassLiquidFlow: { value: 1.0 },
          },
          vertexShader, fragmentShader,
        });
        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

        for (const s of slides) {
          try { slideTextures.push(await loadTex(s.media)); }
          catch { console.warn('Texture failed:', s.media); }
        }

        if (slideTextures.length === 1) {
          slideTextures.push(slideTextures[0]);
        }

        if (slideTextures.length >= 2) {
          shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
          shaderMaterial.uniforms.uTexture2.value = slideTextures[1];
          shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0].userData.size;
          shaderMaterial.uniforms.uTexture2Size.value = slideTextures[1].userData.size;
          texturesLoaded = true;
          sliderEnabled = slides.length > 1;
          document.querySelector('.lm-wrapper')?.classList.add('loaded');
          if (sliderEnabled) {
            startTimer(600);
          }
        }

        let animFrameId: number;
        const render = () => {
          if (destroyed) return;
          animFrameId = requestAnimationFrame(render);
          renderer.render(scene, camera);
        };
        render();

        cleanupFns.push(() => {
          cancelAnimationFrame(animFrameId);
          stopTimer();
          renderer?.dispose();
        });
      };

      buildNav();

      const tEl = document.getElementById('lm-title');
      const dEl = document.getElementById('lm-desc');
      const pEl = document.getElementById('lm-price');
      const bEl = document.getElementById('lm-buy') as HTMLAnchorElement | null;
      if (tEl && dEl) {
        tEl.innerHTML = splitText(slides[0].title);
        dEl.textContent = slides[0].description;
        if (pEl) pEl.textContent = `$${slides[0].price.toFixed(2)}`;
        if (bEl && slides[0].checkoutUrl) bEl.href = slides[0].checkoutUrl;
        gsap.fromTo(tEl.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.03, ease: 'power3.out', delay: 0.4 });
        gsap.fromTo(dEl, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.7 });
        if (pEl) gsap.fromTo(pEl, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.9 });
        if (bEl) gsap.fromTo(bEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.0, ease: 'power3.out' });
      }

      initRenderer();

      const handleResize = () => {
        if (renderer && shaderMaterial) {
          renderer.setSize(window.innerWidth, window.innerHeight);
          shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener('resize', handleResize);
      cleanupFns.push(() => window.removeEventListener('resize', handleResize));
    };

    let destroyed = false;
    const cleanupFns: (() => void)[] = [];

    (async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', 'gsap');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'THREE');
        if (!destroyed) {
          initApplication();
        }
      } catch (e) {
        console.error('Failed to load animation scripts', e);
      }
    })();

    return () => {
      destroyed = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, [slides, effect]);

  return (
    <main className="lm-wrapper" ref={containerRef}>
      <canvas className="lm-canvas" />
      <div className="lm-counter">
        <span id="lm-num">01</span>
        <span className="lm-sep" />
        <span id="lm-total">{String(slides.length).padStart(2, '0')}</span>
      </div>
      <div className="lm-content">
        <h1 className="lm-title" id="lm-title" />
        <p className="lm-desc" id="lm-desc" />
        <div className="lm-purchase">
          <span className="lm-price" id="lm-price">$0.00</span>
          <a
            id="lm-buy"
            href="#"
            className="lm-buy-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Acquire Piece →
          </a>
        </div>
      </div>
      <nav className="lm-nav" id="lm-nav" />
    </main>
  );
}
