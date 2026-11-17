/* =========================================================
   CampusConecta · Prototipo académico (datos ficticios)
   ========================================================= */

/* ---------- Utilidades y constantes ---------- */
const $ = s => document.querySelector(s);
const K = "cc_data";   // clave de localStorage: solicitudes
const U = "cc_user";   // clave de localStorage: sesión

const ST = ["Pendiente", "En proceso", "Observada", "Atendida"];
const TY = [
  "Constancia de estudios",
  "Certificado de estudios",
  "Solicitud de matrícula",
  "Consulta administrativa",
  "Otros trámites académicos"
];
const FA = ["Ingeniería", "Administración", "Derecho", "Psicología", "Arquitectura"];

// Evita inyección de HTML al mostrar texto escrito por el usuario
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

// Fechas
const day = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const today = () => day(0);
const diff = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 864e5));

/* ---------- Datos de demostración ---------- */
const NM = [
  "Ana Quispe", "Luis Paredes", "Camila Rojas", "Diego Salazar", "Valeria Huamán",
  "Jorge Mendoza", "Lucía Torres", "Mateo Castillo", "Sofía Ramos", "Bruno Vargas"
];

const STU = NM.map((n, i) => ({
  id: "S" + (i + 1),
  n,
  f: FA[i % 5],
  e: "estudiante" + (i + 1) + "@novatech.test"
}));

const ADM = { n: "Marcos Delgado (Personal administrativo)" };

// [estudiante, tipo, facultad, días atrás, estado, días de atención]
const SEED = [
  [1, 0, 0, 100, 3, 5], [2, 1, 1, 95, 3, 8], [3, 2, 2, 80, 3, 4],
  [4, 3, 3, 70, 3, 3],  [5, 4, 4, 62, 2, 0], [6, 0, 0, 55, 3, 6],
  [7, 1, 1, 40, 1, 0],  [8, 2, 2, 33, 3, 5], [9, 3, 3, 25, 2, 0],
  [1, 2, 0, 20, 1, 0],  [10, 0, 4, 14, 0, 0], [3, 1, 2, 9, 0, 0],
  [1, 3, 0, 6, 1, 0],   [5, 0, 4, 4, 0, 0],  [2, 4, 1, 3, 0, 0]
];

function seed() {
  return SEED.map((x, i) => {
    const [s, t, f, ago, st, sp] = x;

    const h = [{ d: day(ago), s: "Pendiente", t: "Solicitud registrada" }];

    const r = {
      code: "CC-" + new Date().getFullYear() + "-" + String(i + 1).padStart(4, "0"),
      sid: "S" + s,
      type: TY[t],
      subject: "Solicitud de ejemplo " + (i + 1),
      desc: "Descripción ficticia de demostración.",
      fac: FA[f],
      date: day(ago),
      status: ST[st],
      obs: "",
      file: ""
    };

    if (st >= 1) {
      h.push({ d: day(ago - 1), s: "En proceso", t: "Solicitud en evaluación por el personal administrativo" });
    }
    if (st == 2) {
      r.obs = "Falta adjuntar documento de sustento (dato ficticio).";
      h.push({ d: day(ago - 2), s: "Observada", t: r.obs });
    }
    if (st == 3) {
      h.push({ d: day(ago - sp), s: "Atendida", t: "Solicitud atendida y finalizada" });
    }

    r.hist = h;
    return r;
  });
}

/* ---------- Estado de la aplicación ---------- */
let D = JSON.parse(localStorage.getItem(K) || "null");
if (!D) {
  D = seed();
  save();
}

function save() {
  localStorage.setItem(K, JSON.stringify(D));
}

let me = JSON.parse(localStorage.getItem(U) || "null");
let F = { q: "", s: "", f: "", d: "" };   // filtros del administrador

/* ---------- Funciones auxiliares ---------- */
const stu = id => STU.find(s => s.id == id) || { n: "—" };
const pill = s => `<span class="st ${s.replace(" ", "")}">${s}</span>`;
const last = r => r.hist[r.hist.length - 1].d;

function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.className = "on";
  setTimeout(() => t.className = "", 2600);
}

// Agrupa y cuenta: grp(lista, función que devuelve la clave)
const grp = (R, f) => R.reduce((o, r) => (o[f(r)] = (o[f(r)] || 0) + 1, o), {});

// Indicadores (KPI)
function kp(R) {
  const n = R.length;
  const c = s => R.filter(r => r.status == s).length;
  const at = R.filter(r => r.status == "Atendida");

  return {
    n,
    p: c("Pendiente"),
    e: c("En proceso"),
    o: c("Observada"),
    a: c("Atendida"),
    avg: at.length
      ? (at.reduce((a, r) => a + diff(r.date, last(r)), 0) / at.length).toFixed(1)
      : "0",
    pa: n ? Math.round(c("Atendida") / n * 100) : 0,
    po: n ? Math.round(c("Observada") / n * 100) : 0
  };
}

/* ---------- Componentes visuales ---------- */
const kc = (v, l) => `<div class="card k"><b>${v}</b><span>${l}</span></div>`;

function bars(o) {
  const m = Math.max(1, ...Object.values(o));
  return Object.entries(o)
    .map(([k, v]) =>
      `<div class="br"><span>${esc(k)}</span><i style="width:${v / m * 100}%"></i><b>${v}</b></div>`
    )
    .join("") || "<p>Sin datos</p>";
}

function cols(o) {
  const ks = Object.keys(o).sort();
  const m = Math.max(1, ...ks.map(k => o[k]));
  return `<div class="cols">${ks.map(k =>
    `<div>${o[k]}<i style="height:${o[k] / m * 100}px"></i>${k.slice(5)}/${k.slice(2, 4)}</div>`
  ).join("")}</div>`;
}

function table(R, adm) {
  return `<div class="tw"><table>
    <tr>
      <th>Código</th>
      ${adm ? "<th>Estudiante</th><th>Facultad</th>" : ""}
      <th>Tipo</th><th>Registro</th><th>Estado</th><th>Actualización</th><th></th>
    </tr>
    ${R.map(r => `
      <tr>
        <td>${r.code}</td>
        ${adm ? `<td>${esc(stu(r.sid).n)}</td><td>${r.fac}</td>` : ""}
        <td>${esc(r.type)}</td>
        <td>${r.date}</td>
        <td>${pill(r.status)}</td>
        <td>${last(r)}</td>
        <td><button class="link" onclick="go('detail','${r.code}')">Ver detalle</button></td>
      </tr>`).join("") || '<tr><td colspan=8>No hay solicitudes.</td></tr>'}
  </table></div>`;
}

// Solicitudes del estudiante en sesión
const mine = () =>
  D.filter(r => r.sid == me.sid)
   .sort((a, b) => b.date.localeCompare(a.date) || b.code.localeCompare(a.code));

/* ---------- Vistas ---------- */
const V = {

  // Panel del estudiante
  sdash() {
    const R = mine();
    const k = kp(R);
    const nt = R
      .flatMap(r => r.hist.slice(1).map(h => ({ ...h, c: r.code })))
      .sort((a, b) => b.d.localeCompare(a.d))
      .slice(0, 4);

    return `
      <h2>Mi panel</h2>
      <div class="grid">
        ${kc(k.n, "Total de solicitudes")}
        ${kc(k.p, "Pendientes")}
        ${kc(k.e + k.o, "En proceso u observadas")}
        ${kc(k.a, "Atendidas")}
      </div>
      <p><button class="btn" onclick="go('new')">+ Nueva solicitud</button></p>
      <div class="g2">
        <div class="card">
          <h3>Solicitudes recientes</h3>
          ${table(R.slice(0, 6))}
        </div>
        <div class="card">
          <h3>🔔 Notificaciones</h3>
          <div class="hs">
            ${nt.map(h => `
              <div><b>${h.c}</b> · ${pill(h.s)}<br>
              <small>${h.d} — ${esc(h.t)}</small></div>`).join("") || "Sin novedades"}
          </div>
        </div>
      </div>`;
  },

  // Lista completa de trámites del estudiante
  smine() {
    return `<h2>Mis trámites</h2><div class="card">${table(mine())}</div>`;
  },

  // Formulario de nueva solicitud
  new() {
    return `
      <h2>Nueva solicitud</h2>
      <form class="f card" id="nf" novalidate>
        <label>Tipo de trámite
          <select id="nt">
            <option value="">Seleccione…</option>
            ${TY.map(t => `<option>${t}</option>`).join("")}
          </select>
        </label>
        <label>Asunto<input id="ns"></label>
        <label>Descripción<textarea id="nd" rows="4"></textarea></label>
        <label>Facultad
          <select id="nfa">
            ${FA.map(f => `<option ${f == stu(me.sid).f ? "selected" : ""}>${f}</option>`).join("")}
          </select>
        </label>
        <label>Fecha de registro<input id="ndt" value="${today()}" readonly></label>
        <label>Archivo adjunto (opcional)<input id="nfi" type="file"></label>
        <p class="err" id="ne"></p>
        <button class="btn">Enviar solicitud</button>
      </form>`;
  },

  // Detalle de una solicitud (estudiante y administrador)
  detail(c) {
    const r = D.find(x => x.code == c);
    if (!r || (me.role == "student" && r.sid != me.sid)) {
      return "<p>Solicitud no encontrada.</p>";
    }
    const adm = me.role == "admin";

    return `
      <h2>${r.code} ${pill(r.status)}</h2>

      <div class="tl">
        ${ST.map(s => `<div class="${r.status == s ? "cur" : r.hist.some(h => h.s == s) ? "ok" : ""}">${s}</div>`).join("")}
      </div>

      <div class="g2">
        <div class="card">
          <h3>Datos</h3>
          <p>
            <b>Estudiante:</b> ${esc(stu(r.sid).n)}<br>
            <b>Tipo:</b> ${esc(r.type)}<br>
            <b>Facultad:</b> ${r.fac}<br>
            <b>Asunto:</b> ${esc(r.subject)}<br>
            <b>Presentada:</b> ${r.date}<br>
            <b>Descripción:</b> ${esc(r.desc)}<br>
            <b>Adjunto:</b> ${esc(r.file || "ninguno")}<br>
            <b>Observaciones:</b> ${esc(r.obs || "ninguna")}
          </p>
          ${adm ? `
            <h3>Gestionar</h3>
            <form class="f" id="af" data-c="${r.code}">
              <select id="as">
                ${ST.map(s => `<option ${s == r.status ? "selected" : ""}>${s}</option>`).join("")}
              </select>
              <textarea id="ao" rows="3" placeholder="Observación o acción realizada">${esc(r.obs)}</textarea>
              <button class="btn">Guardar cambios</button>
            </form>` : ""}
        </div>

        <div class="card">
          <h3>Historial de movimientos</h3>
          <div class="hs">
            ${[...r.hist].reverse().map(h => `
              <div>${pill(h.s)} <small>${h.d}</small><br>${esc(h.t)}</div>`).join("")}
          </div>
        </div>
      </div>

      <button class="btn alt" onclick="go(me.role=='admin'?'manage':'smine')">← Volver</button>`;
  },

  // Panel del administrador
  adash() {
    const k = kp(D);
    return `
      <h2>Panel administrativo</h2>
      <div class="grid">
        ${kc(k.n, "Recibidas")}
        ${kc(k.p, "Pendientes")}
        ${kc(k.e, "En proceso")}
        ${kc(k.o, "Observadas")}
        ${kc(k.a, "Atendidas")}
        ${kc(k.avg + " días", "Tiempo promedio de resolución")}
      </div>
      <div class="g2">
        <div class="card"><h3>Por tipo de trámite</h3>${bars(grp(D, r => r.type))}</div>
        <div class="card"><h3>Por estado</h3>${bars(grp(D, r => r.status))}</div>
        <div class="card"><h3>Evolución mensual</h3>${cols(grp(D, r => r.date.slice(0, 7)))}</div>
      </div>`;
  },

  // Gestión de solicitudes (búsqueda y filtros)
  manage() {
    return `
      <h2>Gestión de solicitudes</h2>
      <div class="card">
        <div class="fl">
          <input id="fq" placeholder="Buscar código, estudiante o tipo" value="${esc(F.q)}">
          <select id="fs">
            <option value="">Todos los estados</option>
            ${ST.map(s => `<option ${F.s == s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
          <select id="ff">
            <option value="">Todas las facultades</option>
            ${FA.map(s => `<option ${F.f == s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
          <input id="fd" type="date" value="${F.d}" title="Registradas desde">
        </div>
        <div id="tb"></div>
      </div>`;
  },

  // Reportes e indicadores
  reports() {
    const k = kp(D);
    return `
      <h2>Reportes e indicadores (KPI)</h2>
      <p class="tag">Calculados con datos ficticios de demostración; no son resultados institucionales.</p><br>
      <div class="grid">
        ${kc(k.avg + " días", "Tiempo promedio de atención")}
        ${kc(k.n, "Solicitudes recibidas")}
        ${kc(k.pa + " %", "Atendidas")}
        ${kc(k.p, "Pendientes")}
        ${kc(k.po + " %", "Observadas")}
      </div>
      <div class="card">
        <h3>Distribución por facultad</h3>
        ${bars(grp(D, r => r.fac))}
      </div>
      <br>
      <button class="btn alt"
        onclick="if(confirm('¿Restaurar datos de demostración?')){D=seed();save();go('reports');toast('Datos restaurados')}">
        Restaurar datos de demostración
      </button>`;
  }
};

/* ---------- Tabla filtrada (administrador) ---------- */
function tbl() {
  const q = F.q.toLowerCase();
  const R = D
    .filter(r =>
      (!q || (r.code + stu(r.sid).n + r.type).toLowerCase().includes(q)) &&
      (!F.s || r.status == F.s) &&
      (!F.f || r.fac == F.f) &&
      (!F.d || r.date >= F.d)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  $("#tb").innerHTML = table(R, 1);
}

/* ---------- Navegación ---------- */
const NAV = {
  student: [["sdash", "Mi panel"], ["new", "Nueva solicitud"], ["smine", "Mis trámites"]],
  admin:   [["adash", "Panel"], ["manage", "Solicitudes"], ["reports", "Reportes KPI"]]
};

function go(v, a) {
  $("#sb").classList.remove("open");

  // Menú lateral
  $("#nv").innerHTML = NAV[me.role]
    .map(([k, l]) =>
      `<a class="${k == v || (v == "detail" && k == "manage") ? "on" : ""}" onclick="go('${k}')">${l}</a>`
    )
    .join("");

  // Vista actual
  $("#main").innerHTML = V[v](a);

  // Eventos de la vista "Gestión": búsqueda y filtros
  if (v == "manage") {
    tbl();
    [["fq", "q", "input"], ["fs", "s", "change"], ["ff", "f", "change"], ["fd", "d", "change"]]
      .forEach(([i, k, e]) =>
        $("#" + i).addEventListener(e, x => {
          F[k] = x.target.value;
          tbl();
        })
      );
  }

  // Evento de la vista "Nueva solicitud": validar y registrar
  if (v == "new") {
    $("#nf").onsubmit = e => {
      e.preventDefault();

      const t = $("#nt").value;
      const s = $("#ns").value.trim();
      const d = $("#nd").value.trim();

      if (!t || s.length < 5 || d.length < 10) {
        $("#ne").textContent = "Complete tipo, asunto (mín. 5 caracteres) y descripción (mín. 10).";
        return;
      }

      const code = "CC-" + new Date().getFullYear() + "-" + String(D.length + 1).padStart(4, "0");

      D.push({
        code,
        sid: me.sid,
        type: t,
        subject: s,
        desc: d,
        fac: $("#nfa").value,
        date: today(),
        status: "Pendiente",
        obs: "",
        file: $("#nfi").files[0]?.name || "",
        hist: [{ d: today(), s: "Pendiente", t: "Solicitud registrada" }]
      });

      save();
      toast("Solicitud registrada: " + code);
      go("detail", code);
    };
  }

  // Evento de la vista "Detalle" (administrador): actualizar estado
  if (v == "detail" && me.role == "admin") {
    $("#af").onsubmit = e => {
      e.preventDefault();

      const r = D.find(x => x.code == e.target.dataset.c);
      const s = $("#as").value;
      const o = $("#ao").value.trim();

      if (s == "Observada" && !o) {
        toast("Indique la observación");
        return;
      }

      r.status = s;
      r.obs = o;
      r.hist.push({ d: today(), s, t: o || "Estado actualizado a " + s });

      save();
      toast("Cambios guardados");
      go("detail", r.code);
    };
  }
}

/* ---------- Sesión: inicio y cierre ---------- */
function start() {
  $("#login").hidden = !!me;
  $("#app").hidden = !me;

  if (me) {
    $("#wh").textContent = me.role == "admin"
      ? ADM.n
      : stu(me.sid).n + " · " + stu(me.sid).f;
    go(me.role == "admin" ? "adash" : "sdash");
  }
}

function enter(u) {
  me = u;
  localStorage.setItem(U, JSON.stringify(u));
  start();
}

// Formulario de inicio de sesión
$("#lf").onsubmit = e => {
  e.preventDefault();

  const em = $("#em").value.trim().toLowerCase();
  const pw = $("#pw").value;
  const er = $("#le");

  if (!/^\S+@\S+\.\S+$/.test(em) || !pw) {
    er.textContent = "Ingrese un correo válido y su contraseña.";
    return;
  }
  if (pw != "demo123") {
    er.textContent = "Contraseña de prueba: demo123";
    return;
  }
  er.textContent = "";

  if (em == "admin@novatech.test") return enter({ role: "admin" });

  const s = STU.find(x => x.e == em);
  s
    ? enter({ role: "student", sid: s.id })
    : er.textContent = "Usuario no registrado. Use un acceso de demostración.";
};

// Botones de acceso rápido (demo)
document.querySelectorAll("[data-d]").forEach(b =>
  b.onclick = () => enter(
    b.dataset.d == "admin"
      ? { role: "admin" }
      : { role: "student", sid: "S1" }
  )
);

// Cerrar sesión
$("#lo").onclick = () => {
  localStorage.removeItem(U);
  me = null;
  $("#em").value = $("#pw").value = "";
  start();
};

// Menú móvil
$("#mb").onclick = () => $("#sb").classList.toggle("open");

// Arranque
start();