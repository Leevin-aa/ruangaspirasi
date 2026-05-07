// ============================================================
// RUANG ASPIRASI ESEMKASA - script.js
// ============================================================


// ============================================================
// BAGIAN 1: AMBIL ELEMEN HTML
// ============================================================

const hamburger = document.getElementById('hamburger');
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('overlay');
const navLinks  = document.querySelectorAll('.nav-link');


// ============================================================
// BAGIAN 2: DAFTAR SEMUA ID HALAMAN
// Jika buat halaman baru, tambahkan ID-nya di sini
// ============================================================

const semuaHalaman = ['Beranda', 'Pengumuman', 'KritikSaran', 'LaporPrasarana'];


// ============================================================
// BAGIAN 3: FUNGSI BUKA/TUTUP SIDEBAR (khusus mobile)
// ============================================================

function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');

    const icon = hamburger.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
}

hamburger.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);


// ============================================================
// BAGIAN 4: FUNGSI PINDAH HALAMAN
// Sembunyikan semua → tampilkan yang dituju
// ============================================================

// Tandai halaman yang sudah pernah diinisialisasi
const sudahInit = {};

function tampilkanHalaman(idHalaman) {

    // Sembunyikan semua halaman dulu
    semuaHalaman.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Tampilkan halaman yang dituju
    const halamanTuju = document.getElementById(idHalaman);
    if (halamanTuju) {
        halamanTuju.style.display = 'block';
    } else {
        console.warn('Halaman tidak ditemukan: ' + idHalaman);
        return;
    }

    // Inisialisasi form hanya SEKALI saat pertama kali halaman dibuka
    // Tujuan: agar event listener tidak terpasang dobel
    if (!sudahInit[idHalaman]) {
        sudahInit[idHalaman] = true;

        if (idHalaman === 'KritikSaran')    initFormKritikSaran();
        if (idHalaman === 'LaporPrasarana') initFormLaporan();
    }
}


// ============================================================
// BAGIAN 5: FUNGSI NAVIGASI + UPDATE ACTIVE NAVBAR
// ============================================================

function navigasiKe(idHalaman) {

    // Pindah ke halaman yang dituju
    tampilkanHalaman(idHalaman);

    // Update tampilan active di navbar
    navLinks.forEach(function(link) {
        link.classList.remove('active');
        if (link.dataset.target === idHalaman) {
            link.classList.add('active');
        }
    });
}


// ============================================================
// BAGIAN 6: EVENT KLIK PADA NAV-LINK
// ============================================================

navLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();

        const target = this.dataset.target;

        if (target) {
            navigasiKe(target);
        }

        // Tutup sidebar otomatis jika di mobile
        if (window.innerWidth <= 992) {
            toggleSidebar();
        }
    });
});


// ============================================================
// BAGIAN 7: TOMBOL ACTION CARD DI BERANDA
// ============================================================

function bindTombolActionCard() {
    const tombolKritik     = document.querySelector('.action-card:nth-child(1) .btn-primary');
    const tombolLapor      = document.querySelector('.action-card:nth-child(2) .btn-primary');
    const tombolPengumuman = document.querySelector('.action-card:nth-child(3) .btn-primary');

    if (tombolKritik)     tombolKritik.addEventListener('click',     function() { navigasiKe('KritikSaran'); });
    if (tombolLapor)      tombolLapor.addEventListener('click',      function() { navigasiKe('LaporPrasarana'); });
    if (tombolPengumuman) tombolPengumuman.addEventListener('click', function() { navigasiKe('Pengumuman'); });
}


// ============================================================
// BAGIAN 8: STATISTIK ASPIRASI (Donut Chart)
// ============================================================

const dataDummy = {
    kritik  : 45,
    lapor   : 50,
    selesai : 33
};

function updateStatistik(data) {
    const total    = data.kritik + data.lapor + data.selesai;
    const pKritik  = Math.round((data.kritik  / total) * 100);
    const pLapor   = Math.round((data.lapor   / total) * 100);
    const pSelesai = 100 - (pKritik + pLapor);

    const elTotal   = document.getElementById('totalCount');
    const elKritik  = document.getElementById('percKritik');
    const elLapor   = document.getElementById('percLapor');
    const elSelesai = document.getElementById('percSelesai');

    if (elTotal)   elTotal.innerText   = total;
    if (elKritik)  elKritik.innerText  = pKritik;
    if (elLapor)   elLapor.innerText   = pLapor;
    if (elSelesai) elSelesai.innerText = pSelesai;

    const chart = document.getElementById('statChart');
    if (chart) {
        chart.style.background = `conic-gradient(
            #4a90e2 0% ${pKritik}%,
            #f1c40f ${pKritik}% ${pKritik + pLapor}%,
            #2ecc71 ${pKritik + pLapor}% 100%
        )`;
    }
}


// ============================================================
// BAGIAN 9: INISIALISASI SAAT HALAMAN PERTAMA LOAD
// ============================================================

window.onload = function() {
    tampilkanHalaman('Beranda');
    updateStatistik(dataDummy);
    bindTombolActionCard();
};


// ============================================================
// BAGIAN 10: FORM KRITIK & SARAN
// ============================================================

function initFormKritikSaran() {

    const uploadArea  = document.getElementById('uploadAreaKritik');
    const fileInput   = document.getElementById('fileKritik');
    const previewList = document.getElementById('previewListKritik');
    const counter     = document.getElementById('counterKritik');
    const btnKirim    = document.getElementById('btnKirimKritik');
    const deskripsi   = document.getElementById('deskripsiKritik');
    const modal       = document.getElementById('modalPreview');
    const modalImg    = document.getElementById('modalImg');
    const modalClose  = document.getElementById('modalClose');

    const MAKS_FOTO = 5;
    let daftarFoto = [];

    // Klik area upload → buka file picker
    uploadArea.addEventListener('click', function () {
        if (daftarFoto.length >= MAKS_FOTO) {
            alert('Maksimal ' + MAKS_FOTO + ' foto!');
            return;
        }
        fileInput.click();
    });

    // Saat file dipilih
    fileInput.addEventListener('change', function () {
        const fileBaru = Array.from(this.files);

        fileBaru.forEach(function (file) {
            if (daftarFoto.length >= MAKS_FOTO) return;
            if (!file.type.startsWith('image/')) return;

            daftarFoto.push(file);

            const reader = new FileReader();
            reader.onload = function (e) {
                buatThumbnailKritik(e.target.result, daftarFoto.length - 1);
                updateCounterKritik();
            };
            reader.readAsDataURL(file);
        });

        fileInput.value = '';
    });

    // Buat thumbnail
    function buatThumbnailKritik(srcGambar, index) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('thumb-wrapper');

        const img = document.createElement('img');
        img.src = srcGambar;
        img.alt = 'Foto ' + (index + 1);

        img.addEventListener('click', function () {
            modalImg.src = srcGambar;
            modal.style.display = 'flex';
        });

        const btnHapus = document.createElement('button');
        btnHapus.classList.add('thumb-delete');
        btnHapus.innerHTML = '<i class="fas fa-times"></i>';
        btnHapus.addEventListener('click', function (e) {
            e.stopPropagation();
            hapusFotoKritik(index);
        });

        wrapper.appendChild(img);
        wrapper.appendChild(btnHapus);
        previewList.appendChild(wrapper);
    }

    // Hapus foto
    function hapusFotoKritik(index) {
        daftarFoto.splice(index, 1);
        previewList.innerHTML = '';

        daftarFoto.forEach(function (file, i) {
            const reader = new FileReader();
            reader.onload = function (e) {
                buatThumbnailKritik(e.target.result, i);
            };
            reader.readAsDataURL(file);
        });

        updateCounterKritik();
    }

    // Update counter
    function updateCounterKritik() {
        counter.innerText = daftarFoto.length + ' / ' + MAKS_FOTO + ' foto dipilih';

        if (daftarFoto.length >= MAKS_FOTO) {
            uploadArea.style.opacity = '0.4';
            uploadArea.style.cursor  = 'not-allowed';
        } else {
            uploadArea.style.opacity = '1';
            uploadArea.style.cursor  = 'pointer';
        }
    }

    // Tutup modal
    modalClose.addEventListener('click', function () {
        modal.style.display = 'none';
        modalImg.src = '';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            modalImg.src = '';
        }
    });

    // Submit
    btnKirim.addEventListener('click', function () {
        const isiDeskripsi = deskripsi.value.trim();

        if (isiDeskripsi === '') {
            alert('Deskripsi tidak boleh kosong!');
            deskripsi.focus();
            return;
        }

        alert('Kritik & Saran berhasil dikirim! Terima kasih.');

        deskripsi.value = '';
        daftarFoto = [];
        previewList.innerHTML = '';
        updateCounterKritik();
    });

} // ← TUTUP initFormKritikSaran


// ============================================================
// BAGIAN 11: FORM LAPORAN PRASARANA
// ============================================================

function initFormLaporan() {

    const uploadArea  = document.getElementById('uploadAreaLaporan');
    const fileInput   = document.getElementById('fileLaporan');
    const previewList = document.getElementById('previewListLaporan');
    const counter     = document.getElementById('counterLaporan');
    const btnKirim    = document.getElementById('btnKirimLaporan');
    const deskripsi   = document.getElementById('deskripsiLaporan');
    const modal       = document.getElementById('modalPreviewLaporan');
    const modalImg    = document.getElementById('modalImgLaporan');
    const modalClose  = document.getElementById('modalCloseLaporan');

    const MAKS_FOTO = 5;
    let daftarFoto = [];

    // Klik area upload → buka file picker
    uploadArea.addEventListener('click', function () {
        if (daftarFoto.length >= MAKS_FOTO) {
            alert('Maksimal ' + MAKS_FOTO + ' foto!');
            return;
        }
        fileInput.click();
    });

    // Saat file dipilih
    fileInput.addEventListener('change', function () {
        const fileBaru = Array.from(this.files);

        fileBaru.forEach(function (file) {
            if (daftarFoto.length >= MAKS_FOTO) return;
            if (!file.type.startsWith('image/')) return;

            daftarFoto.push(file);

            const reader = new FileReader();
            reader.onload = function (e) {
                buatThumbnailLaporan(e.target.result, daftarFoto.length - 1);
                updateCounterLaporan();
            };
            reader.readAsDataURL(file);
        });

        fileInput.value = '';
    });

    // Buat thumbnail
    function buatThumbnailLaporan(srcGambar, index) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('thumb-wrapper');

        const img = document.createElement('img');
        img.src = srcGambar;
        img.alt = 'Foto ' + (index + 1);

        img.addEventListener('click', function () {
            modalImg.src = srcGambar;
            modal.style.display = 'flex';
        });

        const btnHapus = document.createElement('button');
        btnHapus.classList.add('thumb-delete');
        btnHapus.innerHTML = '<i class="fas fa-times"></i>';
        btnHapus.addEventListener('click', function (e) {
            e.stopPropagation();
            hapusFotoLaporan(index);
        });

        wrapper.appendChild(img);
        wrapper.appendChild(btnHapus);
        previewList.appendChild(wrapper);
    }

    // Hapus foto
    function hapusFotoLaporan(index) {
        daftarFoto.splice(index, 1);
        previewList.innerHTML = '';

        daftarFoto.forEach(function (file, i) {
            const reader = new FileReader();
            reader.onload = function (e) {
                buatThumbnailLaporan(e.target.result, i);
            };
            reader.readAsDataURL(file);
        });

        updateCounterLaporan();
    }

    // Update counter
    function updateCounterLaporan() {
        counter.innerText = daftarFoto.length + ' / ' + MAKS_FOTO + ' foto dipilih';

        if (daftarFoto.length >= MAKS_FOTO) {
            uploadArea.style.opacity = '0.4';
            uploadArea.style.cursor  = 'not-allowed';
        } else {
            uploadArea.style.opacity = '1';
            uploadArea.style.cursor  = 'pointer';
        }
    }

    // Tutup modal
    modalClose.addEventListener('click', function () {
        modal.style.display = 'none';
        modalImg.src = '';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            modalImg.src = '';
        }
    });

    // Submit
    btnKirim.addEventListener('click', function () {
        const isiDeskripsi = deskripsi.value.trim();

        if (isiDeskripsi === '') {
            alert('Deskripsi tidak boleh kosong!');
            deskripsi.focus();
            return;
        }

        alert('Laporan Prasarana berhasil dikirim! Terima kasih.');

        deskripsi.value = '';
        daftarFoto = [];
        previewList.innerHTML = '';
        updateCounterLaporan();
    });

} // ← TUTUP initFormLaporan