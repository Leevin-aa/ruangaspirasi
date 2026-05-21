// BAGIAN 1: AMBIL ELEMEN HTML
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');

// BAGIAN 2: DAFTAR SEMUA ID HALAMAN
const semuaHalaman = ['Beranda', 'Pengumuman', 'KritikSaran', 'LaporPrasarana'];

// BAGIAN 3: FUNGSI BUKA/TUTUP SIDEBAR (khusus mobile)
function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');

    const icon = hamburger.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
}

hamburger.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// BAGIAN 4: FUNGSI PINDAH HALAMAN
const sudahInit = {};

function tampilkanHalaman(idHalaman) {
    semuaHalaman.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const halamanTuju = document.getElementById(idHalaman);
    if (halamanTuju) {
        halamanTuju.style.display = 'block';
    } else {
        console.warn('Halaman tidak ditemukan: ' + idHalaman);
        return;
    }

    if (!sudahInit[idHalaman]) {
        sudahInit[idHalaman] = true;

        if (idHalaman === 'KritikSaran') initFormKritikSaran();
        if (idHalaman === 'LaporPrasarana') initFormLaporan();
    }
}

// BAGIAN 5: FUNGSI NAVIGASI + UPDATE ACTIVE NAVBAR
function navigasiKe(idHalaman) {
    tampilkanHalaman(idHalaman);

    navLinks.forEach(function (link) {
        link.classList.remove('active');
        if (link.dataset.target === idHalaman) {
            link.classList.add('active');
        }
    });
}

// BAGIAN 6: EVENT KLIK PADA NAV-LINK
navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
        e.preventDefault();

        const target = this.dataset.target;

        if (target) {
            navigasiKe(target);
        }

        if (window.innerWidth <= 992) {
            toggleSidebar();
        }
    });
});

// BAGIAN 7: TOMBOL ACTION CARD DI BERANDA
function bindTombolActionCard() {
    const tombolKritik = document.querySelector('.action-card:nth-child(1) .btn-primary');
    const tombolLapor = document.querySelector('.action-card:nth-child(2) .btn-primary');
    const tombolPengumuman = document.querySelector('.action-card:nth-child(3) .btn-primary');

    // Lihat Semua di card pengumuman beranda
    const viewAll = document.querySelector('.view-all[data-target="Pengumuman"]');
    if (viewAll) {
        viewAll.addEventListener('click', function (e) {
            e.preventDefault();
            navigasiKe('Pengumuman');
        });
    }

    if (tombolKritik) tombolKritik.addEventListener('click', function () { navigasiKe('KritikSaran'); });
    if (tombolLapor) tombolLapor.addEventListener('click', function () { navigasiKe('LaporPrasarana'); });
    if (tombolPengumuman) tombolPengumuman.addEventListener('click', function () { navigasiKe('Pengumuman'); });
}

// BAGIAN 8: FORMAT TANGGAL OTOMATIS
// Mengubah string datetime dari DB menjadi format "Senin, 18/05/2026 07.00 WIB"
function formatTanggalLengkap(datetimeStr) {
    if (!datetimeStr) return '';

    let tgl;
    try {
        tgl = new Date(datetimeStr.replace(' ', 'T'));
    } catch (e) {
        return datetimeStr;
    }

    if (isNaN(tgl.getTime())) return datetimeStr;

    // Konversi ke WIB (UTC+7)
    const offsetWIB = 7 * 60;
    const utc = tgl.getTime() + (tgl.getTimezoneOffset() * 60000);
    const wib = new Date(utc + (offsetWIB * 60000));

    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hari = namaHari[wib.getDay()];

    const hh = String(wib.getHours()).padStart(2, '0');
    const mm = String(wib.getMinutes()).padStart(2, '0');
    const dd = String(wib.getDate()).padStart(2, '0');
    const mo = String(wib.getMonth() + 1).padStart(2, '0');
    const yy = wib.getFullYear();

    return `${hari}, ${dd}/${mo}/${yy} ${hh}.${mm} WIB`;
}

// BAGIAN 9: INISIALISASI SAAT HALAMAN PERTAMA LOAD
window.onload = function () {
    tampilkanHalaman('Beranda');
    bindTombolActionCard();
    loadPengumumanWebUtama();
    loadStatistikDariDB();
};

// BAGIAN 10: FORM KRITIK & SARAN → KIRIM KE DATABASE
btnKirim.addEventListener('click', function () {
    const jenisLaporan = document.getElementById('jenisKritik').value;
    const isiDeskripsi = deskripsi.value.trim();

    // Validasi dropdown
    if (!jenisLaporan) {
        alert('Pilih jenis laporan terlebih dahulu!');
        document.getElementById('jenisKritik').focus();
        return;
    }

    if (isiDeskripsi === '') {
        alert('Deskripsi tidak boleh kosong!');
        deskripsi.focus();
        return;
    }

    btnKirim.disabled = true;
    btnKirim.innerText = 'Mengirim...';

    const formData = new FormData();
    formData.append('deskripsi', isiDeskripsi);
    formData.append('jenis', jenisLaporan); // ← tambahkan ini

    daftarFoto.forEach(function (file) {
        formData.append('foto[]', file, file.name);
    });

    fetch('api/kritik.php', {
        method: 'POST',
        body: formData
    })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.status === 'success') {
                alert('Laporan berhasil dikirim! Terima kasih.');

                // Reset form termasuk dropdown
                document.getElementById('jenisKritik').value = '';
                deskripsi.value = '';
                daftarFoto = [];
                previewList.innerHTML = '';
                updateCounterKritik();
            } else {
                alert('Gagal mengirim: ' + data.message);
            }
        })
        .catch(function () {
            alert('Gagal terhubung ke server. Coba lagi.');
        })
        .finally(function () {
            btnKirim.disabled = false;
            btnKirim.innerText = 'Submit';
        });
});

function initFormKritikSaran() {

    const uploadArea = document.getElementById('uploadAreaKritik');
    const fileInput = document.getElementById('fileKritik');
    const previewList = document.getElementById('previewListKritik');
    const counter = document.getElementById('counterKritik');
    const btnKirim = document.getElementById('btnKirimKritik');
    const deskripsi = document.getElementById('deskripsiKritik');
    const modal = document.getElementById('modalPreview');
    const modalImg = document.getElementById('modalImg');
    const modalClose = document.getElementById('modalClose');

    const MAKS_FOTO = 5;
    let daftarFoto = [];

    uploadArea.addEventListener('click', function () {
        if (daftarFoto.length >= MAKS_FOTO) {
            alert('Maksimal ' + MAKS_FOTO + ' foto!');
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        const fileBaru = Array.from(this.files);
        const MAKS_SIZE = 2 * 1024 * 1024; // 2MB

        // Ambil/buat elemen pesan error ukuran
        let pesanError = document.getElementById('pesanUkuranKritik');
        if (!pesanError) {
            pesanError = document.createElement('p');
            pesanError.id = 'pesanUkuranKritik';
            pesanError.className = 'upload-size-error';
            counter.parentNode.insertBefore(pesanError, counter.nextSibling);
        }
        pesanError.innerHTML = ''; // reset pesan

        fileBaru.forEach(function (file) {
            if (daftarFoto.length >= MAKS_FOTO) return;
            if (!file.type.startsWith('image/')) return;

            // Cek ukuran file
            if (file.size > MAKS_SIZE) {
                const ukuranMB = (file.size / (1024 * 1024)).toFixed(1);
                pesanError.innerHTML += `
                <span>
                    <i class="fas fa-times-circle"></i>
                    "${file.name}" ditolak — ukuran ${ukuranMB}MB melebihi batas 2MB
                </span><br>
            `;
                return; // skip file ini
            }

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

    function updateCounterKritik() {
        counter.innerText = daftarFoto.length + ' / ' + MAKS_FOTO + ' foto dipilih';

        if (daftarFoto.length >= MAKS_FOTO) {
            uploadArea.style.opacity = '0.4';
            uploadArea.style.cursor = 'not-allowed';
        } else {
            uploadArea.style.opacity = '1';
            uploadArea.style.cursor = 'pointer';
        }
    }

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

    btnKirim.addEventListener('click', function () {
        const jenisLaporan = document.getElementById('jenisKritik').value;
        const isiDeskripsi = deskripsi.value.trim();

        // DEBUG - cek nilai yang akan dikirim
        console.log('Jenis:', jenisLaporan);
        console.log('Deskripsi:', isiDeskripsi);

        if (!jenisLaporan) {
            alert('Pilih jenis laporan terlebih dahulu!');
            return;
        }

        if (isiDeskripsi === '') {
            alert('Deskripsi tidak boleh kosong!');
            deskripsi.focus();
            return;
        }

        btnKirim.disabled = true;
        btnKirim.innerText = 'Mengirim...';

        const formData = new FormData();
        formData.append('deskripsi', isiDeskripsi);
        formData.append('jenis', jenisLaporan);

        // DEBUG - cek isi formData
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }

        fetch('api/kritik.php', {
            method: 'POST',
            body: formData
        })
            // ... sisa sama
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.status === 'success') {
                    alert('Kritik & Saran berhasil dikirim! Terima kasih.');

                    deskripsi.value = '';
                    daftarFoto = [];
                    previewList.innerHTML = '';
                    updateCounterKritik();

                } else {
                    alert('Gagal mengirim: ' + data.message);
                }
            })
            .catch(function () {
                alert('Gagal terhubung ke server. Coba lagi.');
            })
            .finally(function () {
                btnKirim.disabled = false;
                btnKirim.innerText = 'Submit';
            });
    });

}

// BAGIAN 11: FORM LAPORAN PRASARANA → KIRIM KE DATABASE
function initFormLaporan() {

    const uploadArea = document.getElementById('uploadAreaLaporan');
    const fileInput = document.getElementById('fileLaporan');
    const previewList = document.getElementById('previewListLaporan');
    const counter = document.getElementById('counterLaporan');
    const btnKirim = document.getElementById('btnKirimLaporan');
    const deskripsi = document.getElementById('deskripsiLaporan');
    const modal = document.getElementById('modalPreviewLaporan');
    const modalImg = document.getElementById('modalImgLaporan');
    const modalClose = document.getElementById('modalCloseLaporan');

    const MAKS_FOTO = 5;
    let daftarFoto = [];

    uploadArea.addEventListener('click', function () {
        if (daftarFoto.length >= MAKS_FOTO) {
            alert('Maksimal ' + MAKS_FOTO + ' foto!');
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        const fileBaru = Array.from(this.files);
        const MAKS_SIZE = 2 * 1024 * 1024; // 2MB

        let pesanError = document.getElementById('pesanUkuranLaporan');
        if (!pesanError) {
            pesanError = document.createElement('p');
            pesanError.id = 'pesanUkuranLaporan';
            pesanError.className = 'upload-size-error';
            counter.parentNode.insertBefore(pesanError, counter.nextSibling);
        }
        pesanError.innerHTML = '';

        fileBaru.forEach(function (file) {
            if (daftarFoto.length >= MAKS_FOTO) return;
            if (!file.type.startsWith('image/')) return;

            if (file.size > MAKS_SIZE) {
                const ukuranMB = (file.size / (1024 * 1024)).toFixed(1);
                pesanError.innerHTML += `
                <span>
                    <i class="fas fa-times-circle"></i>
                    "${file.name}" ditolak — ukuran ${ukuranMB}MB melebihi batas 2MB
                </span><br>
            `;
                return;
            }

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

    function updateCounterLaporan() {
        counter.innerText = daftarFoto.length + ' / ' + MAKS_FOTO + ' foto dipilih';

        if (daftarFoto.length >= MAKS_FOTO) {
            uploadArea.style.opacity = '0.4';
            uploadArea.style.cursor = 'not-allowed';
        } else {
            uploadArea.style.opacity = '1';
            uploadArea.style.cursor = 'pointer';
        }
    }

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

    btnKirim.addEventListener('click', function () {
        const isiDeskripsi = deskripsi.value.trim();

        if (isiDeskripsi === '') {
            alert('Deskripsi tidak boleh kosong!');
            deskripsi.focus();
            return;
        }

        // Validasi foto WAJIB untuk Laporan Prasarana
        if (daftarFoto.length === 0) {
            alert('Upload minimal 1 foto sebagai bukti laporan!');
            return;
        }

        btnKirim.disabled = true;
        btnKirim.innerText = 'Mengirim...';

        const formData = new FormData();
        formData.append('deskripsi', isiDeskripsi);

        daftarFoto.forEach(function (file) {
            formData.append('foto[]', file, file.name);
        });

        fetch('api/laporan.php', {
            method: 'POST',
            body: formData
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.status === 'success') {
                    alert('Laporan Prasarana berhasil dikirim! Terima kasih.');
                    deskripsi.value = '';
                    daftarFoto = [];
                    previewList.innerHTML = '';
                    updateCounterLaporan();
                } else {
                    alert('Gagal mengirim: ' + data.message);
                }
            })
            .catch(function () {
                alert('Gagal terhubung ke server. Coba lagi.');
            })
            .finally(function () {
                btnKirim.disabled = false;
                btnKirim.innerText = 'Submit';
            });
    });

}

// BAGIAN 12: LOAD PENGUMUMAN DARI DATABASE KE WEB UTAMA
// - Tidak ada lagi date-badge
// - Timestamp otomatis dari field created_at / tanggal+jam di DB
function loadPengumumanWebUtama() {

    fetch('api/pengumuman.php')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.status !== 'success') return;

            const listBeranda = document.getElementById('listPengumumanBeranda');
            const listPengumuman = document.getElementById('listPengumumanHalaman');

            if (listBeranda) listBeranda.innerHTML = '';
            if (listPengumuman) listPengumuman.innerHTML = '';

            // Kalau tidak ada data
            if (data.data.length === 0) {
                const kosong = '<p style="color:#aaa; font-size:0.9rem;">Belum ada pengumuman.</p>';
                if (listBeranda) listBeranda.innerHTML = kosong;
                if (listPengumuman) listPengumuman.innerHTML = kosong;
                return;
            }

            data.data.forEach(function (item, index) {

                const tglPost = new Date(item.created_at);
                const hariNama = tglPost.toLocaleDateString('id-ID', { weekday: 'long' });
                const tglLengkap = tglPost.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const jam = tglPost.getHours().toString().padStart(2, '0');
                const mnt = tglPost.getMinutes().toString().padStart(2, '0');

                const waktuPosting = hariNama + ', ' + tglLengkap + ' ' + jam + '.' + mnt + ' WIB';

                const itemHTML = `
                <div class="news-item">
                    <span class="news-date-top">${waktuPosting}</span>
                    <h4>${item.judul}</h4>
                    <p>${item.deskripsi}</p>
                </div>
            `;

                // Beranda: 2 terbaru saja
                if (listBeranda && index < 2) {
                    listBeranda.innerHTML += itemHTML;
                }

                // Halaman Pengumuman: semua
                if (listPengumuman) {
                    listPengumuman.innerHTML += itemHTML;
                }
            });
        })
        .catch(function () {
            console.warn('Gagal memuat pengumuman');
        });
}

// BAGIAN 13: STATISTIK ASPIRASI DARI DATABASE
// - Tampilkan angka total (bukan persen)
// - Selesai = semua item (kritik + laporan) yang status = 'selesai'
// - Kritik & Saran = semua item kritik (berapapun statusnya)
// - Lapor Prasarana = semua item laporan (berapapun statusnya)
function loadStatistikDariDB() {
    Promise.all([
        fetch('api/kritik.php').then(function (res) { return res.json(); }),
        fetch('api/laporan.php').then(function (res) { return res.json(); })
    ])
        .then(function (hasil) {
            const dataKritik = hasil[0].status === 'success' ? hasil[0].data : [];
            const dataLaporan = hasil[1].status === 'success' ? hasil[1].data : [];

            // Total semua data
            const jumlahKritik = dataKritik.length;
            const jumlahLaporan = dataLaporan.length;
            const total = jumlahKritik + jumlahLaporan;

            // Selesai = gabungan kritik + laporan yang statusnya 'selesai'
            const jumlahSelesai =
                dataKritik.filter(function (i) { return i.status === 'selesai'; }).length +
                dataLaporan.filter(function (i) { return i.status === 'selesai'; }).length;

            // Update angka di elemen HTML
            const elTotal = document.getElementById('totalCount');
            const elKritik = document.getElementById('percKritik');
            const elLapor = document.getElementById('percLapor');
            const elSelesai = document.getElementById('percSelesai');

            if (elTotal) elTotal.innerText = total;
            if (elKritik) elKritik.innerText = jumlahKritik;
            if (elLapor) elLapor.innerText = jumlahLaporan;
            if (elSelesai) elSelesai.innerText = jumlahSelesai;

            // Update donut chart (masih pakai % untuk visual chart)
            const chart = document.getElementById('statChart');
            if (chart) {
                if (total === 0) {
                    chart.style.background = '#e0e0e0';
                } else {
                    const pKritik = Math.round((jumlahKritik / total) * 100);
                    const pLaporan = Math.round((jumlahLaporan / total) * 100);
                    chart.style.background = `conic-gradient(
                    #4a90e2 0% ${pKritik}%,
                    #f1c40f ${pKritik}% ${pKritik + pLaporan}%,
                    #2ecc71 ${pKritik + pLaporan}% 100%
                )`;
                }
            }
        })
        .catch(function () {
            console.warn('Gagal memuat statistik');
        });
}