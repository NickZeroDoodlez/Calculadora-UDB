// Calculadora de notas UDB - NickDZ
const NOTA_MAX = 5;
const NOTA_PASAR = 3;

const GIF_NICK = "images/nick-wilde-zootopia.gif";
const GIF_ARDILLA = "images/squirrel-squirrel-flying-away-in-storm.gif";

// ---------- utilidades ----------
const $ = (id) => document.getElementById(id);

// Convierte el texto a número. Acepta coma o punto. Vacío -> null, inválido -> NaN
function leerNumero(texto) {
  const limpio = String(texto).trim().replace(",", ".");
  if (limpio === "") return null;
  return Number(limpio);
}

function esNotaValida(n) {
  return typeof n === "number" && !isNaN(n) && n >= 0 && n <= NOTA_MAX;
}

// ---------- notificación centrada ----------
const modal = $("modal");

function mostrarModal({ titulo, nota, mensaje, gif, esError, aprobo }) {
  $("modalTitulo").textContent = titulo;

  const notaEl = $("modalNota");
  notaEl.textContent = nota;
  notaEl.classList.toggle("error", !!esError);
  notaEl.classList.toggle("bien", aprobo === true);
  notaEl.classList.toggle("mal", aprobo === false);
  notaEl.classList.toggle("oculto", !nota);

  $("modalMensaje").textContent = mensaje || "";

  const gifEl = $("modalGif");
  if (gif) {
    gifEl.onerror = () => {
      gifEl.classList.add("oculto");
      console.error("No se encontró el gif: " + gif);
    };
    gifEl.src = gif;
    gifEl.alt = "";
    gifEl.classList.remove("oculto");
  } else {
    gifEl.removeAttribute("src");
    gifEl.classList.add("oculto");
  }

  modal.classList.remove("oculto");
  $("cerrarModal").focus();
}

function cerrarModal() {
  modal.classList.add("oculto");
}

function mostrarError(texto) {
  mostrarModal({ titulo: "Revisa los datos", nota: texto, mensaje: "", esError: true });
}

$("cerrarModal").addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});

// ---------- mensajes ----------
function mensajeNotaFinal(nota) {
  if (nota < 2.0) return "mk usted vino a calentar puesto o que";
  if (nota < 3.0) return "mk va raspando";
  if (nota < 4.0) return "buenaaaa hp, si ve que si puede?";
  return "na chino, mejor dicte usted la clase";
}

function mensajeNecesaria(nota) {
  if (nota > NOTA_MAX) return "uy gonorrea, cancele la materia";
  if (nota < 2.0) return "mk usted ya paso chino";
  if (nota < 3.0) return "es posible pasar chino";
  if (nota < 4.0) return "mk la veo dificil";
  return "uy gran hp";
}

// ---------- pestañas ----------
document.querySelectorAll(".pestana").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".pestana").forEach((b) => b.classList.remove("activa"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("activo"));
    btn.classList.add("activa");
    $(btn.dataset.tab).classList.add("activo");
  });
});

// ---------- pestaña 1: notas de la materia ----------
const nombres = ["Primer 20%", "Segundo 20%", "Tercer 20%"];

function calcularMateria() {
  const ids = ["n1", "n2", "n3"];
  let suma = 0;

  for (let i = 0; i < ids.length; i++) {
    const valor = leerNumero($(ids[i]).value);
    if (valor === null) {
      return mostrarError("Falta la nota del " + nombres[i].toLowerCase() + ".");
    }
    if (!esNotaValida(valor)) {
      return mostrarError("La nota del " + nombres[i].toLowerCase() + " debe ser un número entre 0 y 5.");
    }
    suma += valor * 0.2;
  }

  const n4 = leerNumero($("n4").value);

  // Con el 40% escrito: nota final de la materia
  if (n4 !== null) {
    if (!esNotaValida(n4)) {
      return mostrarError("La nota del último 40% debe ser un número entre 0 y 5.");
    }
    const final = suma + n4 * 0.4;
    mostrarModal({
      titulo: "La materia te queda en",
      nota: final.toFixed(2),
      mensaje: mensajeNotaFinal(final),
      gif: final > 3.5 ? GIF_NICK : null,
      aprobo: final >= NOTA_PASAR,
    });
    return;
  }

  // Sin el 40%: cuánto necesitas para pasar con 3.0
  const necesaria = (NOTA_PASAR - suma) / 0.4;
  const mostrada = Math.max(necesaria, 0);
  mostrarModal({
    titulo: "Necesitas sacar en el 40%",
    nota: mostrada.toFixed(2),
    mensaje: mensajeNecesaria(necesaria),
    gif: necesaria > 4.0 ? GIF_ARDILLA : null,
    aprobo: necesaria <= NOTA_MAX,
  });
}

function resetMateria() {
  ["n1", "n2", "n3", "n4"].forEach((id) => ($(id).value = ""));
  $("n1").focus();
}

$("btnCalcular").addEventListener("click", calcularMateria);
$("btnReset").addEventListener("click", resetMateria);
["n1", "n2", "n3", "n4"].forEach((id) => {
  $(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") calcularMateria();
  });
});

// ---------- pestaña 2: nota de un 20% ----------
const filas = $("filas");
let ultimoResultado = null;

function agregarFila(nota = "", porc = "") {
  const fila = document.createElement("div");
  fila.className = "fila";
  fila.innerHTML =
    '<input type="text" inputmode="decimal" class="f-nota" placeholder="Nota" autocomplete="off">' +
    '<input type="text" inputmode="decimal" class="f-porc" placeholder="%" autocomplete="off">' +
    '<button type="button" class="quitar" aria-label="Quitar nota">&times;</button>';
  fila.querySelector(".f-nota").value = nota;
  fila.querySelector(".f-porc").value = porc;

  fila.querySelector(".quitar").addEventListener("click", () => {
    fila.remove();
    actualizarSuma();
  });
  fila.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("input", actualizarSuma);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") calcularCorte();
    });
  });
  filas.appendChild(fila);
}

function actualizarSuma() {
  let total = 0;
  filas.querySelectorAll(".f-porc").forEach((inp) => {
    const v = leerNumero(inp.value);
    if (v !== null && !isNaN(v)) total += v;
  });
  const el = $("sumaPorc");
  const redondeado = Math.round(total * 100) / 100;
  el.textContent = "Suma de porcentajes: " + redondeado + "%";
  el.classList.toggle("bien", redondeado === 100);
  el.classList.toggle("mal", redondeado > 100);
}

function calcularCorte() {
  const lista = filas.querySelectorAll(".fila");
  if (lista.length === 0) return mostrarError("Agrega al menos una nota.");

  let total = 0;
  let sumaPorc = 0;

  for (let i = 0; i < lista.length; i++) {
    const nota = leerNumero(lista[i].querySelector(".f-nota").value);
    const porc = leerNumero(lista[i].querySelector(".f-porc").value);
    const n = i + 1;

    if (nota === null || !esNotaValida(nota)) {
      return mostrarError("La nota de la fila " + n + " debe ser un número entre 0 y 5.");
    }
    if (porc === null || isNaN(porc) || porc <= 0 || porc > 100) {
      return mostrarError("El porcentaje de la fila " + n + " debe ser un número entre 1 y 100.");
    }
    total += nota * (porc / 100);
    sumaPorc += porc;
  }

  if (Math.abs(sumaPorc - 100) > 0.001) {
    return mostrarError("Los porcentajes suman " + Math.round(sumaPorc * 100) / 100 + "%. Deben sumar 100%.");
  }

  ultimoResultado = total;
  $("usar").classList.remove("oculto");
  mostrarModal({
    titulo: "La nota de este 20% es",
    nota: total.toFixed(2),
    mensaje: "",
  });
}

function resetCorte() {
  filas.innerHTML = "";
  agregarFila();
  agregarFila();
  actualizarSuma();
  ultimoResultado = null;
  $("usar").classList.add("oculto");
}

function usarResultado() {
  if (ultimoResultado === null) return;
  $($("destino").value).value = ultimoResultado.toFixed(2);
  document.querySelector('.pestana[data-tab="materia"]').click();
}

$("btnAgregar").addEventListener("click", () => agregarFila());
$("btnCalcCorte").addEventListener("click", calcularCorte);
$("btnResetCorte").addEventListener("click", resetCorte);
$("btnUsar").addEventListener("click", usarResultado);

resetCorte();

// ---------- ramitas ----------
$("btnRamitas").addEventListener("click", () => {
  const audio = $("sonido");
  audio.currentTime = 0;
  audio.play().catch(() => {});
});
