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
    bindTombolActionCard();
    loadPengumumanWebUtama();
    loadStatistikDariDB();    // ← tambahkan ini
};


// ============================================================
// BAGIAN 10: FORM KRITIK & SARAN → KIRIM KE DATABASE
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
    let daftarFoto  = [];

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
        img.src   = srcGambar;
        img.alt   = 'Foto ' + (index + 1);

        img.addEventListener('click', function () {
            modalImg.src           = srcGambar;
            modal.style.display    = 'flex';
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
        modalImg.src        = '';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            modalImg.src        = '';
        }
    });

    // ── Submit → kirim ke API PHP ──
    btnKirim.addEventListener('click', function () {
        const isiDeskripsi = deskripsi.value.trim();

        if (isiDeskripsi === '') {
            alert('Deskripsi tidak boleh kosong!');
            deskripsi.focus();
            return;
        }

        // Nonaktifkan tombol
        btnKirim.disabled   = true;
        btnKirim.innerText  = 'Mengirim...';

        // Gunakan FormData karena ada file upload
        const formData = new FormData();
        formData.append('deskripsi', isiDeskripsi);

        // Tambahkan semua foto
        daftarFoto.forEach(function(file, i) {
            formData.append('foto[]', file, file.name);
        });

        fetch('api/kritik.php', {
            method : 'POST',
            body   : formData
            // JANGAN set Content-Type, biarkan browser yang atur untuk FormData
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.status === 'success') {
                alert('Kritik & Saran berhasil dikirim! Terima kasih.');

                // Reset form
                deskripsi.value       = '';
                daftarFoto            = [];
                previewList.innerHTML = '';
                updateCounterKritik();

            } else {
                alert('Gagal mengirim: ' + data.message);
            }
        })
        .catch(function() {
            alert('Gagal terhubung ke server. Coba lagi.');
        })
        .finally(function() {
            btnKirim.disabled  = false;
            btnKirim.innerText = 'Submit';
        });
    });

} // ← TUTUP initFormKritikSaran


// ============================================================
// BAGIAN 11: FORM LAPORAN PRASARANA → KIRIM KE DATABASE
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
    let daftarFoto  = [];

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
        img.src   = srcGambar;
        img.alt   = 'Foto ' + (index + 1);

        img.addEventListener('click', function () {
            modalImg.src        = srcGambar;
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
        modalImg.src        = '';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            modalImg.src        = '';
        }
    });

    // ── Submit → kirim ke API PHP ──
    btnKirim.addEventListener('click', function () {
        const isiDeskripsi = deskripsi.value.trim();

        if (isiDeskripsi === '') {
            alert('Deskripsi tidak boleh kosong!');
            deskripsi.focus();
            return;
        }

        btnKirim.disabled  = true;
        btnKirim.innerText = 'Mengirim...';

        const formData = new FormData();
        formData.append('deskripsi', isiDeskripsi);

        daftarFoto.forEach(function(file, i) {
            formData.append('foto[]', file, file.name);
        });

        fetch('api/laporan.php', {
            method : 'POST',
            body   : formData
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.status === 'success') {
                alert('Laporan Prasarana berhasil dikirim! Terima kasih.');

                // Reset form
                deskripsi.value       = '';
                daftarFoto            = [];
                previewList.innerHTML = '';
                updateCounterLaporan();

            } else {
                alert('Gagal mengirim: ' + data.message);
            }
        })
        .catch(function() {
            alert('Gagal terhubung ke server. Coba lagi.');
        })
        .finally(function() {
            btnKirim.disabled  = false;
            btnKirim.innerText = 'Submit';
        });
    });

} // ← TUTUP initFormLaporan

// ============================================================
// BAGIAN 12: LOAD PENGUMUMAN DARI DATABASE KE WEB UTAMA
// ============================================================

function loadPengumumanWebUtama() {

    fetch('api/pengumuman.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status !== 'success') return;

        // Update di halaman Beranda (preview 2 terbaru)
        const listBeranda = document.querySelector('#Beranda .announcement-list');

        // Update di halaman Pengumuman (semua)
        const listPengumuman = document.querySelector('#Pengumuman .announcement-list');

        if (listBeranda) listBeranda.innerHTML   = '';
        if (listPengumuman) listPengumuman.innerHTML = '';

        data.data.forEach(function(item, index) {
            const tgl  = new Date(item.tanggal);
            const hari = tgl.getDate();

            const itemHTML = `
                <div class="news-item">
                    <div class="date-badge">${hari}</div>
                    <div class="news-content">
                        <h4>${item.judul}</h4>
                        <p>${item.deskripsi}</p>
                    </div>
                </div>
            `;

            // Beranda hanya tampilkan 2 terbaru
            if (listBeranda && index < 2) {
                listBeranda.innerHTML += itemHTML;
            }

            // Halaman pengumuman tampilkan semua
            if (listPengumuman) {
                listPengumuman.innerHTML += itemHTML;
            }
        });
    })
    .catch(function() {
        console.warn('Gagal memuat pengumuman');
    });
}

// ============================================================
// BAGIAN 13: STATISTIK ASPIRASI DARI DATABASE
// ============================================================

function loadStatistikDariDB() {

    // Ambil data kritik & saran dan laporan prasarana secara bersamaan
    Promise.all([
        fetch('api/kritik.php').then(function(res) { return res.json(); }),
        fetch('api/laporan.php').then(function(res) { return res.json(); })
    ])
    .then(function(hasil) {
        const dataKritik  = hasil[0].status === 'success' ? hasil[0].data : [];
        const dataLaporan = hasil[1].status === 'success' ? hasil[1].data : [];

        // Hitung total masing-masing
        const jumlahKritik  = dataKritik.length;
        const jumlahLaporan = dataLaporan.length;

        // Hitung yang sudah selesai (gabungan dari kedua jenis)
        const jumlahSelesai =
            dataKritik.filter(function(i)  { return i.status === 'selesai'; }).length +
            dataLaporan.filter(function(i) { return i.status === 'selesai'; }).length;

        const total = jumlahKritik + jumlahLaporan;

        // Hitung persentase
        const pKritik  = total > 0 ? Math.round((jumlahKritik  / total) * 100) : 0;
        const pLaporan = total > 0 ? Math.round((jumlahLaporan / total) * 100) : 0;
        const pSelesai = total > 0 ? (100 - pKritik - pLaporan)               : 0;

        // Update angka di UI
        const elTotal   = document.getElementById('totalCount');
        const elKritik  = document.getElementById('percKritik');
        const elLapor   = document.getElementById('percLapor');
        const elSelesai = document.getElementById('percSelesai');

        if (elTotal)   elTotal.innerText   = total;
        if (elKritik)  elKritik.innerText  = pKritik;
        if (elLapor)   elLapor.innerText   = pLaporan;
        if (elSelesai) elSelesai.innerText = pSelesai;

        // Update donut chart
        const chart = document.getElementById('statChart');
        if (chart) {
            // Kalau total 0, tampilkan chart abu-abu kosong
            if (total === 0) {
                chart.style.background = '#e0e0e0';
            } else {
                chart.style.background = `conic-gradient(
                    #4a90e2 0% ${pKritik}%,
                    #f1c40f ${pKritik}% ${pKritik + pLaporan}%,
                    #2ecc71 ${pKritik + pLaporan}% 100%
                )`;
            }
        }
    })
    .catch(function() {
        console.warn('Gagal memuat statistik');
    });
}