/* =========================================================
   Young Investor Unpad - script.js (versi beta)
   Isi file ini:
   1. Roset (pola garis seperti uang kertas) di hero
   2. Simulasi nabung saham rutin
   ========================================================= */

/* ---------- 1. Roset ---------- */

// Mengambil warna dari CSS supaya ikut berubah di mode gelap
function ambilWarna(nama, cadangan) {
  const nilai = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return nilai || cadangan;
}

function gambarRoset() {
  const canvas = document.getElementById("roset");
  if (!canvas || !canvas.getContext) return;

  const ukuran = canvas.clientWidth;
  if (!ukuran) return;

  // Supaya garis tetap tajam di layar beresolusi tinggi
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(ukuran * dpr);
  canvas.height = Math.round(ukuran * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ukuran, ukuran);

  const pusat = ukuran / 2;
  ctx.strokeStyle = ambilWarna("--note-blue", "#2B5CA6");
  ctx.lineWidth = Math.max(0.6, ukuran / 650);

  // Tiap cincin terdiri dari banyak garis bergelombang yang digeser sedikit.
  // jari = jarak dari tengah, ombak = tinggi gelombang, gelombang = jumlah puncak
  const cincin = [
    { jari: 0.405, ombak: 0.05, gelombang: 18, garis: 26, alpha: 0.55 },
    { jari: 0.27, ombak: 0.042, gelombang: 12, garis: 20, alpha: 0.45 },
    { jari: 0.165, ombak: 0.022, gelombang: 9, garis: 12, alpha: 0.35 },
  ];

  for (const c of cincin) {
    ctx.globalAlpha = c.alpha;
    for (let i = 0; i < c.garis; i++) {
      const geser = (i / c.garis) * Math.PI * 2;
      ctx.beginPath();
      for (let s = 0; s <= 720; s++) {
        const t = (s / 720) * Math.PI * 2;
        const r =
          (c.jari +
            c.ombak * Math.sin(c.gelombang * t + geser) +
            c.ombak * 0.35 * Math.sin(c.gelombang * 2 * t - geser)) *
          ukuran;
        const x = pusat + r * Math.cos(t);
        const y = pusat + r * Math.sin(t);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // Lingkaran tepi, seperti cap
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(pusat, pusat, ukuran * 0.485, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(pusat, pusat, ukuran * 0.47, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Gambar ulang saat ukuran berubah atau tema terang/gelap berganti
gambarRoset();
if (window.ResizeObserver) {
  const kanvasRoset = document.getElementById("roset");
  if (kanvasRoset) new ResizeObserver(gambarRoset).observe(kanvasRoset);
}
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", gambarRoset);
new MutationObserver(gambarRoset).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
if (document.fonts) document.fonts.ready.then(gambarRoset);

/* ---------- 2. Simulasi nabung saham rutin ---------- */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const ringkas = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Menghitung nilai tabungan investasi bulan demi bulan.
 * Setiap bulan: saldo tumbuh sesuai imbal hasil, lalu ditambah setoran bulanan.
 */
function hitungSimulasi(awal, bulanan, persenPerTahun, tahun) {
  const imbalBulanan = persenPerTahun / 100 / 12;
  let saldo = awal;
  let totalSetor = awal;
  const perTahun = [];

  for (let bulan = 1; bulan <= tahun * 12; bulan++) {
    saldo = saldo * (1 + imbalBulanan) + bulanan;
    totalSetor += bulanan;
    if (bulan % 12 === 0) {
      perTahun.push({ tahun: bulan / 12, saldo: saldo, setor: totalSetor });
    }
  }

  return {
    saldo: saldo,
    totalSetor: totalSetor,
    pertumbuhan: saldo - totalSetor,
    perTahun: perTahun,
  };
}

function gambarGrafik(perTahun) {
  const grafik = document.getElementById("grafik");
  const sumbu = document.getElementById("sumbu");
  const keterangan = document.getElementById("grafik-cap");
  grafik.innerHTML = "";
  sumbu.innerHTML = "";

  const terakhir = perTahun[perTahun.length - 1];
  const tertinggi = terakhir.saldo;
  if (tertinggi <= 0) {
    keterangan.textContent = "Isi setoran lebih dari 0 untuk melihat grafiknya.";
    return;
  }

  // Kalau tahunnya banyak, label sumbu ditampilkan tiap 5 tahun saja
  const jarakLabel = perTahun.length <= 10 ? 1 : 5;

  perTahun.forEach(function (d) {
    const kolom = document.createElement("div");
    kolom.className = "kolom";

    const batang = document.createElement("div");
    batang.className = "batang";
    batang.style.height = (d.saldo / tertinggi) * 100 + "%";
    batang.title = "Tahun " + d.tahun + ": " + rupiah.format(d.saldo);

    const bagianTumbuh = document.createElement("div");
    bagianTumbuh.className = "seg-tumbuh";
    bagianTumbuh.style.height = ((d.saldo - d.setor) / d.saldo) * 100 + "%";

    const bagianSetor = document.createElement("div");
    bagianSetor.className = "seg-setor";
    bagianSetor.style.height = (d.setor / d.saldo) * 100 + "%";

    batang.append(bagianTumbuh, bagianSetor);
    kolom.append(batang);
    grafik.append(kolom);

    const label = document.createElement("span");
    const tampil = d.tahun === 1 || d.tahun === terakhir.tahun || d.tahun % jarakLabel === 0;
    label.textContent = tampil ? d.tahun : "";
    sumbu.append(label);
  });

  keterangan.textContent =
    "Nilai di akhir setiap tahun. Batang tertinggi: Rp " +
    ringkas.format(tertinggi) +
    " di tahun ke-" +
    terakhir.tahun +
    ".";
  grafik.setAttribute(
    "aria-label",
    "Grafik nilai per tahun, dari " +
      rupiah.format(perTahun[0].saldo) +
      " di tahun pertama sampai " +
      rupiah.format(tertinggi) +
      " di tahun ke-" +
      terakhir.tahun
  );
}

// Membaca angka dari input. Mengembalikan null kalau tidak valid.
function bacaAngka(id, min, max) {
  const input = document.getElementById(id);
  const nilai = Number(input.value);
  if (input.value === "" || Number.isNaN(nilai) || nilai < min || nilai > max) return null;
  return nilai;
}

function perbaruiSimulasi() {
  const awal = bacaAngka("awal", 0, 1e12);
  const bulanan = bacaAngka("bulanan", 0, 1e12);
  const imbal = bacaAngka("imbal", 0, 30);
  const tahun = bacaAngka("tahun", 1, 30);
  const pesan = document.getElementById("pesan-error");

  document.getElementById("tahun-teks").textContent = tahun + " tahun";
  if (awal !== null) document.getElementById("awal-teks").textContent = rupiah.format(awal);
  if (bulanan !== null) document.getElementById("bulanan-teks").textContent = rupiah.format(bulanan);

  if (awal === null || bulanan === null) {
    pesan.textContent = "Setoran harus berupa angka 0 atau lebih.";
    pesan.hidden = false;
    return;
  }
  if (imbal === null) {
    pesan.textContent = "Imbal hasil harus berupa angka antara 0 sampai 30.";
    pesan.hidden = false;
    return;
  }
  pesan.hidden = true;

  const hasil = hitungSimulasi(awal, bulanan, imbal, tahun);
  document.getElementById("hasil-akhir").textContent = rupiah.format(hasil.saldo);
  document.getElementById("hasil-setor").textContent = rupiah.format(hasil.totalSetor);
  document.getElementById("hasil-tumbuh").textContent = "+" + rupiah.format(hasil.pertumbuhan);
  gambarGrafik(hasil.perTahun);
}

const formSimulasi = document.getElementById("form-simulasi");
formSimulasi.addEventListener("input", perbaruiSimulasi);
formSimulasi.addEventListener("submit", function (e) {
  e.preventDefault(); // tombol Enter tidak memuat ulang halaman
});
perbaruiSimulasi();
