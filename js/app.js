const LS_PRODUK = "shopee_aff_produk_v1";
const LS_VIDEO = "shopee_aff_video_v1";
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const rp = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let produk = load(LS_PRODUK, []);
let video = load(LS_VIDEO, []);
let riset = [];

/* ---------- tabs ---------- */
document.getElementById("tabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-tab]");
  if (!b) return;
  document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".pane").forEach(p => p.classList.toggle("on", p.id === "pane-" + b.dataset.tab));
});

/* ---------- riset ---------- */
async function loadRiset() {
  try {
    const r = await fetch("data/research.json?v=" + Date.now());
    if (r.ok) {
      const j = await r.json();
      riset = j.products || [];
      const u = document.getElementById("riset-updated");
      u.textContent = "Terakhir diperbarui: " + (j.updated || "-");
    }
  } catch { /* biarkan kosong */ }
  renderRiset();
}
function renderRiset() {
  const box = document.getElementById("riset-list");
  if (!riset.length) {
    box.innerHTML = `<div class="empty"><b>Belum ada data riset</b>Riset pasar lagi berjalan — produk terlaris akan muncul di sini otomatis.</div>`;
  } else {
    box.innerHTML = riset.map(p => `
      <div class="card">
        <h3>${esc(p.nama)}</h3>
        <div class="meta">${esc(p.toko || "")} · Terjual ${esc(p.terjual || "-")}</div>
        <div class="row"><span class="price">${rp(p.harga)}</span><span class="pill riset">⭐ ${esc(p.skor || "-")}</span></div>
        <div class="meta">${esc(p.catatan || "")}</div>
        <div class="row">
          <a class="btn small ghost" href="${esc(p.url || "#")}" target="_blank" rel="noopener" style="text-decoration:none">Lihat di Shopee</a>
          <button class="btn small primary" data-pilih="${esc(p.nama)}" data-harga="${p.harga || ""}" data-toko="${esc(p.toko || "")}">＋ Pilih produk</button>
        </div>
      </div>`).join("");
  }
  document.getElementById("k-riset").textContent = riset.length;
}
document.getElementById("btn-riset-refresh").addEventListener("click", loadRiset);
document.getElementById("riset-list").addEventListener("click", e => {
  const b = e.target.closest("[data-pilih]");
  if (!b) return;
  produk.unshift({ id: Date.now(), nama: b.dataset.pilih, harga: b.dataset.harga, toko: b.dataset.toko, link: "", komisi: "", status: "dipilih" });
  save(LS_PRODUK, produk);
  renderProduk();
  document.querySelector('[data-tab="produk"]').click();
});

/* ---------- produk ---------- */
const statusLabel = s => ({ dipilih: "Dipilih", produksi: "Produksi video", tayang: "Tayang" }[s] || s);
function renderProduk() {
  const box = document.getElementById("produk-list");
  if (!produk.length) {
    box.innerHTML = `<div class="empty"><b>Belum ada produk</b>Tambahkan produk pakaian anak yang mau kamu promosikan — tempel link affiliate dari akunmu.</div>`;
  } else {
    box.innerHTML = produk.map(p => `
      <div class="card">
        <h3>${esc(p.nama)}</h3>
        <div class="meta">${esc(p.toko || "-")}${p.komisi ? " · komisi " + esc(p.komisi) + "%" : ""}</div>
        <div class="row"><span class="price">${rp(p.harga)}</span><span class="pill ${p.status}">${statusLabel(p.status)}</span></div>
        <div class="row">
          ${p.link ? `<a class="btn small ghost" href="${esc(p.link)}" target="_blank" rel="noopener" style="text-decoration:none">🔗 Affiliate link</a>` : `<span class="meta">Link affiliate belum diisi</span>`}
          <span>
            <button class="btn small ghost" data-edit="${p.id}">✏️</button>
            <button class="btn small ghost" data-del="${p.id}">🗑️</button>
          </span>
        </div>
      </div>`).join("");
  }
  document.getElementById("k-pilih").textContent = produk.length;
  const sel = document.getElementById("vf-produk");
  sel.innerHTML = produk.map(p => `<option value="${p.id}">${esc(p.nama)}</option>`).join("") || `<option value="">— belum ada produk —</option>`;
}
let editingId = null;
const f = id => document.getElementById(id);
function bukaForm(edit) {
  editingId = edit ? edit.id : null;
  f("pf-nama").value = edit?.nama || ""; f("pf-harga").value = edit?.harga || "";
  f("pf-toko").value = edit?.toko || ""; f("pf-link").value = edit?.link || "";
  f("pf-komisi").value = edit?.komisi || ""; f("pf-status").value = edit?.status || "dipilih";
  f("produk-form").hidden = false;
  f("produk-form").scrollIntoView({ behavior: "smooth", block: "center" });
}
f("btn-produk-add").addEventListener("click", () => bukaForm());
f("pf-batal").addEventListener("click", () => f("produk-form").hidden = true);
f("produk-form").addEventListener("submit", e => {
  e.preventDefault();
  const d = { nama: f("pf-nama").value.trim(), harga: f("pf-harga").value.trim(), toko: f("pf-toko").value.trim(), link: f("pf-link").value.trim(), komisi: f("pf-komisi").value.trim(), status: f("pf-status").value };
  if (!d.nama) return;
  if (editingId) { const p = produk.find(x => x.id === editingId); Object.assign(p, d); }
  else produk.unshift({ id: Date.now(), ...d });
  save(LS_PRODUK, produk); f("produk-form").hidden = true; renderProduk();
});
document.getElementById("produk-list").addEventListener("click", e => {
  const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
  if (ed) bukaForm(produk.find(x => x.id == ed.dataset.edit));
  if (del && confirm("Hapus produk ini?")) { produk = produk.filter(x => x.id != del.dataset.del); save(LS_PRODUK, produk); renderProduk(); }
});

/* ---------- video ---------- */
const vLabel = s => ({ rencana: "Rencana", dibuat: "Dibuat", tayang: "Tayang" }[s] || s);
function renderVideo() {
  const box = document.getElementById("video-list");
  if (!video.length) {
    box.innerHTML = `<div class="empty"><b>Belum ada video</b>Catat tiap video promo yang kamu buat biar nggak dobel produk.</div>`;
  } else {
    box.innerHTML = video.map(v => {
      const p = produk.find(x => x.id == v.produkId);
      return `<div class="card">
        <h3>${esc(v.judul)}</h3>
        <div class="meta">Untuk: ${esc(p?.nama || "—")}</div>
        <div class="row"><span class="pill ${v.status}">${vLabel(v.status)}</span>
        ${v.link ? `<a class="btn small ghost" href="${esc(v.link)}" target="_blank" rel="noopener" style="text-decoration:none">▶️ Lihat</a>` : ""}
        <button class="btn small ghost" data-vdel="${v.id}">🗑️</button></div>
      </div>`;
    }).join("");
  }
  document.getElementById("k-video").textContent = video.length;
  document.getElementById("k-tayang").textContent = video.filter(v => v.status === "tayang").length;
}
f("btn-video-add").addEventListener("click", () => { f("video-form").hidden = false; f("video-form").scrollIntoView({ behavior: "smooth", block: "center" }); });
f("vf-batal").addEventListener("click", () => f("video-form").hidden = true);
f("video-form").addEventListener("submit", e => {
  e.preventDefault();
  if (!f("vf-produk").value || !f("vf-judul").value.trim()) { alert("Pilih produk & isi judul dulu."); return; }
  video.unshift({ id: Date.now(), produkId: f("vf-produk").value, judul: f("vf-judul").value.trim(), status: f("vf-status").value, link: f("vf-link").value.trim() });
  save(LS_VIDEO, video); f("video-form").hidden = true; f("vf-judul").value = ""; f("vf-link").value = ""; renderVideo();
});
document.getElementById("video-list").addEventListener("click", e => {
  const del = e.target.closest("[data-vdel]");
  if (del && confirm("Hapus catatan video ini?")) { video = video.filter(x => x.id != del.dataset.vdel); save(LS_VIDEO, video); renderVideo(); }
});

renderProduk(); renderVideo(); loadRiset();
