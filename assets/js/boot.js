/*!
 * boot.js — Jorge Flechas / flechastrafik.online
 *
 * Este archivo se ejecuta ANTES que ningun otro. Hace dos cosas:
 *
 *  1. Marca en el <html> que el JavaScript funciona. El CSS usa esa marca
 *     para decidir si esconde el contenido antes de animarlo. Si el JS esta
 *     desactivado, la marca nunca aparece y la web se ve entera y normal.
 *
 *  2. Red de seguridad. Si el script principal falla (error, archivo que no
 *     carga, navegador viejo), a los 5 segundos se muestra todo igualmente.
 *     La web nunca se queda en negro ni bloqueada en la intro.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  root.className = root.className.replace(/\bno-js\b/g, "").trim() + " js";

  function rescate() {
    if (root.getAttribute("data-ready") === "1") return;
    root.setAttribute("data-ready", "1");
    root.classList.add("force-visible");
  }

  // Solo errores reales de JavaScript (no imagenes que no cargan).
  window.addEventListener("error", function (event) {
    if (event instanceof ErrorEvent) rescate();
  });

  window.setTimeout(function () {
    if (root.getAttribute("data-ready") !== "1") rescate();
  }, 5000);
})();
