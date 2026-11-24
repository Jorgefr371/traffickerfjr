/*!
 * app.js — Jorge Flechas / flechastrafik.online
 * Intro, menu movil, fondo de particulas y animaciones de scroll.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isCoarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var isSmall = function () { return window.innerWidth <= 720; };
  var INTRO_KEY = "jf_intro_visto";

  /* ------------------------------------------------------------------ *
   * Menu movil
   * ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!toggle || !links) return;

    function setOpen(open) {
      links.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menu" : "Abrir menu");
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(!links.classList.contains("is-open"));
    });

    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && links.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (!isSmall()) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ *
   * Cursor personalizado (solo raton, nunca en tactil)
   * ------------------------------------------------------------------ */
  function initCursor() {
    var cursor = document.querySelector(".cursor");
    if (!cursor) return;

    if (isCoarse || reduceMotion) {
      cursor.remove();
      return;
    }

    window.addEventListener("mousemove", function (event) {
      cursor.style.transform =
        "translate(" + event.clientX + "px, " + event.clientY + "px) translate(-50%, -50%)";
    }, { passive: true });

    document.querySelectorAll(".magnetic, .service-card, .offer").forEach(function (item) {
      item.addEventListener("mouseenter", function () { cursor.classList.add("is-active"); });
      item.addEventListener("mouseleave", function () {
        cursor.classList.remove("is-active");
        item.style.transform = "";
      });
      item.addEventListener("mousemove", function (event) {
        var rect = item.getBoundingClientRect();
        var x = (event.clientX - rect.left - rect.width / 2) * 0.08;
        var y = (event.clientY - rect.top - rect.height / 2) * 0.08;
        item.style.transform = "translate(" + x + "px, " + y + "px)";
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Fondo de particulas en canvas 2D
   * Sustituye a three.js: mismo efecto, ~2 KB en lugar de ~600 KB.
   * Se pausa solo cuando la pestana no esta a la vista (ahorra bateria).
   * ------------------------------------------------------------------ */
  function initParticles() {
    var canvas = document.getElementById("webgl");
    if (!canvas) return;

    if (reduceMotion) {
      canvas.remove();
      return;
    }

    var ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return; }

    var w = 0, h = 0, dpr = 1;
    var parts = [];
    var raf = null;
    var mouseX = 0, mouseY = 0;
    var last = 0;
    var minFrame = isCoarse ? 33 : 16; // ~30 fps en movil, ~60 en escritorio

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var count = w < 720 ? 70 : Math.min(170, Math.round(w / 8));
      parts = [];
      for (var i = 0; i < count; i++) {
        var hot = Math.random() > 0.78;
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: 0.35 + Math.random() * 0.65,
          r: 0.6 + Math.random() * 1.4,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          c: hot ? "255,51,78" : "210,236,255",
          a: 0.18 + Math.random() * 0.5
        });
      }
    }

    function frame(now) {
      raf = window.requestAnimationFrame(frame);
      if (now - last < minFrame) return;
      last = now;

      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;

        if (p.x < -8) p.x = w + 8; else if (p.x > w + 8) p.x = -8;
        if (p.y < -8) p.y = h + 8; else if (p.y > h + 8) p.y = -8;

        var px = p.x + mouseX * 26 * p.z;
        var py = p.y + mouseY * 18 * p.z;

        ctx.beginPath();
        ctx.fillStyle = "rgba(" + p.c + "," + p.a * p.z + ")";
        ctx.arc(px, py, p.r * p.z, 0, 6.2832);
        ctx.fill();
      }
    }

    function start() {
      if (raf === null) raf = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (raf !== null) {
        window.cancelAnimationFrame(raf);
        raf = null;
      }
    }

    if (!isCoarse) {
      window.addEventListener("mousemove", function (event) {
        mouseX = event.clientX / window.innerWidth - 0.5;
        mouseY = event.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    resize();
    start();
  }

  /* ------------------------------------------------------------------ *
   * Animaciones de scroll (GSAP + ScrollTrigger)
   * ------------------------------------------------------------------ */
  function revealAll() {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.visibility = "visible";
    });
  }

  function initGsap() {
    if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
      revealAll();
      return false;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".nav", {
      backgroundColor: "rgba(5,5,7,0.86)",
      backdropFilter: "blur(18px)",
      scrollTrigger: { trigger: "body", start: "top top", end: "+=420", scrub: true }
    });

    // toggleActions sin "reverse": una vez que algo aparece, ya no se vuelve
    // a ocultar. Mejor para el usuario y para que Google indexe el texto.
    document.querySelectorAll(".reveal").forEach(function (element) {
      gsap.fromTo(element,
        { autoAlpha: 0, y: 44 },
        {
          autoAlpha: 1, y: 0, duration: 1.05, ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 95%", toggleActions: "play none none none" }
        }
      );
    });

    if (!isSmall()) {
      document.querySelectorAll(".parallax-img img").forEach(function (image) {
        gsap.to(image, {
          yPercent: -10, scale: 1.18, ease: "none",
          scrollTrigger: {
            trigger: image.closest(".parallax-img"),
            start: "top bottom", end: "bottom top", scrub: true
          }
        });
      });

      gsap.to(".portrait-frame", {
        rotate: -1.4, scale: 1.03,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });

      gsap.utils.toArray(".service-card, .offer").forEach(function (card) {
        gsap.fromTo(card, { y: 80 }, {
          y: 0, ease: "none",
          scrollTrigger: { trigger: card, start: "top bottom", end: "top 35%", scrub: true }
        });
      });
    }

    gsap.utils.toArray(".bar").forEach(function (bar) {
      gsap.fromTo(bar, { scaleX: 0.08 }, {
        scaleX: 1, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: bar, start: "top 88%" }
      });
    });

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    return true;
  }

  /* ------------------------------------------------------------------ *
   * Intro cinematografica
   * - Se puede saltar con clic, toque, scroll, Enter, Espacio o Escape.
   * - Solo se muestra una vez por sesion.
   * - Nunca esconde el resto de la pagina: la tapa. Asi Google siempre
   *   puede leer todo el contenido.
   * ------------------------------------------------------------------ */
  function quitarIntro(intro) {
    intro.remove();
    document.body.classList.remove("intro-active");
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) { /* modo privado */ }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function initIntro() {
    var intro = document.querySelector(".intro-gate");
    if (!intro) return;

    var yaVista = false;
    try { yaVista = sessionStorage.getItem(INTRO_KEY) === "1"; } catch (e) { /* ignorar */ }

    if (reduceMotion || !window.gsap || yaVista) {
      quitarIntro(intro);
      return;
    }

    var robot = intro.querySelector(".robot");
    var orbit = intro.querySelector(".robot-orbit");
    var scan = intro.querySelector(".intro-scan");
    var eye = intro.querySelector(".robot-eye.left");
    var tunnel = intro.querySelector(".eye-tunnel");
    var focusRing = intro.querySelector(".intro-focus-ring");
    var heroPortrait = document.querySelector(".portrait-frame");
    var hudParts = intro.querySelectorAll(".intro-copy-block, .intro-panel, .intro-status");
    var boton = document.getElementById("introEnter");
    var entrando = false;

    gsap.set(robot, { rotateX: 7, rotateY: -12, y: 12 });
    gsap.set(orbit, { rotateX: 68, rotateZ: -18, scale: 0.92 });
    gsap.set(".intro-metric", { autoAlpha: 0, x: 18 });

    var boot = gsap.timeline({ delay: 0.15 });
    boot
      .from(".intro-title", { autoAlpha: 0, y: 34, duration: 0.9, ease: "power3.out" })
      .from(".intro-copy", { autoAlpha: 0, y: 18, duration: 0.7, ease: "power2.out" }, "-=0.48")
      .from(robot, { autoAlpha: 0, scale: 0.78, rotateY: 20, duration: 1.0, ease: "power3.out" }, "-=0.7")
      .to(".intro-metric", { autoAlpha: 1, x: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" }, "-=0.35")
      .to(robot, { rotateY: 12, y: -8, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 }, "-=0.1")
      .to(orbit, { rotateZ: 342, duration: 9, ease: "none", repeat: -1 }, "<");

    function limpiarListeners() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeydown);
      intro.removeEventListener("click", onClick);
    }

    function entrar() {
      if (entrando) return;
      entrando = true;
      limpiarListeners();
      boot.kill();

      var eyeRect = eye.getBoundingClientRect();
      var eyeX = eyeRect.left + eyeRect.width / 2;
      var eyeY = eyeRect.top + eyeRect.height / 2;
      var portalScale = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) / 12);

      gsap.set(tunnel, { x: eyeX, y: eyeY, scale: 0.2, autoAlpha: 0 });
      gsap.set(focusRing, { x: eyeX, y: eyeY, scale: 0.16, autoAlpha: 0 });
      gsap.set(".nav, .page-shell", { filter: "blur(18px)", scale: 1.025 });
      gsap.set(heroPortrait, { filter: "brightness(0.72) contrast(1.08)" });

      // Seguro: si la animacion de salida se corta a la mitad (el usuario
      // cambia de pestana, el movil se bloquea...), la intro se quita igual.
      var seguro = window.setTimeout(cerrar, 4500);

      function cerrar() {
        window.clearTimeout(seguro);
        if (!document.body.contains(intro)) return;
        gsap.set(".nav, .page-shell", { clearProps: "all" });
        quitarIntro(intro);
        window.scrollTo({ top: 0, behavior: "auto" });
      }

      var tl = gsap.timeline({
        defaults: { ease: "power4.inOut" },
        onComplete: cerrar
      });

      tl
        .to(".intro-status", { autoAlpha: 0, y: 16, duration: 0.28, ease: "power2.out" })
        .to(scan, { autoAlpha: 0, duration: 0.24 }, "<")
        .to(".robot-eye.left", { scale: 1.9, duration: 0.24, ease: "power2.out" }, "<")
        .to(tunnel, { autoAlpha: 1, scale: 1.2, duration: 0.22, ease: "power2.out" }, "<")
        .to(focusRing, { autoAlpha: 1, scale: 1, duration: 0.18, ease: "power2.out" }, "<")
        .to(focusRing, { scale: 10, autoAlpha: 0, duration: 0.86, ease: "power3.inOut" }, "-=0.02")
        .to(robot, {
          scale: 5.6, rotateX: 0, rotateY: 0,
          x: window.innerWidth / 2 - eyeX, y: window.innerHeight / 2 - eyeY, duration: 1.18
        }, "-=0.82")
        .to(tunnel, { x: window.innerWidth / 2, y: window.innerHeight / 2, scale: portalScale, duration: 1.18 }, "<")
        .to(orbit, { scale: 2.4, opacity: 0, duration: 0.8 }, "<")
        .to(hudParts, { autoAlpha: 0, y: -18, stagger: 0.025, duration: 0.42, ease: "power2.in" }, "-=1")
        .to(".intro-grid", { autoAlpha: 0, scale: 1.25, duration: 0.86 }, "-=0.9")
        .to(intro, { autoAlpha: 0, duration: 0.74, ease: "power2.out" }, "-=0.56")
        .to(".nav, .page-shell", { filter: "blur(0px)", scale: 1, duration: 1.05, ease: "power3.out" }, "-=0.86")
        .to(heroPortrait, { filter: "brightness(1) contrast(1)", duration: 0.84, ease: "power2.out" }, "-=0.86")
        .to(tunnel, { autoAlpha: 0, duration: 0.64, ease: "power2.out" }, "-=0.62");
    }

    function onWheel(event) { event.preventDefault(); entrar(); }
    function onTouchMove(event) { event.preventDefault(); entrar(); }
    function onClick() { entrar(); }
    function onKeydown(event) {
      var teclas = ["ArrowDown", "PageDown", " ", "Enter", "Escape"];
      if (teclas.indexOf(event.key) === -1) return;
      event.preventDefault();
      entrar();
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeydown);
    intro.addEventListener("click", onClick);

    if (boton) {
      boton.addEventListener("click", function (event) {
        event.stopPropagation();
        entrar();
      });
      // Que el teclado caiga directamente en el boton de saltar.
      window.setTimeout(function () { boton.focus({ preventScroll: true }); }, 900);
    }
  }

  /* ------------------------------------------------------------------ *
   * Arranque
   * ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ *
   * Mapa de mercados
   *
   * La lista de paises vive en el HTML (<li data-iso="CO">), asi que para
   * anadir o quitar un mercado solo hay que tocar ese <ul>: el mapa y el
   * contador se actualizan solos. La geometria sale de assets/paises.json,
   * generado con datos de Natural Earth (dominio publico).
   * ------------------------------------------------------------------ */
  function initMapa() {
    var lista = document.getElementById("paises");
    var ov = document.getElementById("mapaOv");
    if (!lista || !ov) return;

    var isos = [].slice
      .call(lista.querySelectorAll("li[data-iso]"))
      .map(function (li) { return li.getAttribute("data-iso"); });

    var cuenta = document.getElementById("mapaN");
    if (cuenta) cuenta.textContent = String(isos.length);
    if (!isos.length) return;

    fetch("assets/paises.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.paises) return;

        var puntos = "";
        var pines = "";
        isos.forEach(function (iso) {
          var p = data.paises[iso];
          if (!p) return;
          // Los paises grandes se pintan con sus propios puntos; los muy
          // pequenos no caen en la rejilla y solo reciben el pin.
          if (p.d) puntos += p.d;
          pines +=
            '<circle cx="' + p.x + '" cy="' + p.y + '" r="5" fill="none" ' +
            'stroke="#d8ff68" stroke-width="1.3" opacity=".85"/>' +
            '<circle cx="' + p.x + '" cy="' + p.y + '" r="1.9" fill="#d8ff68"/>';
        });

        ov.innerHTML =
          (puntos ? '<path d="' + puntos + '" fill="#ff334e"/>' : "") + pines;
      })
      .catch(function () { /* sin mapa resaltado, el base ya se ve */ });
  }

  function init() {
    initNav();
    initCursor();
    initParticles();
    initGsap();
    initMapa();
    initIntro();
    // A partir de aqui la red de seguridad de boot.js ya no hace falta.
    root.setAttribute("data-ready", "1");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
