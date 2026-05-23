// ============================================================
// DASHBOARD - scriptdash.js (VERSI LENGKAP & BERSIH)
// ============================================================

// BAGIAN 1: PROTEKSI & LOGOUT
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {

    if (sessionStorage.getItem('sudahLogin') !== 'true') {
        window.location.href = 'login.html';
    }

    btnLogout.addEventListener('click', function() {
        fetch('../api/login.php', {
            method  : 'DELETE',
            headers : { 'Content-Type': 'application/json' }
        })
        .finally(function() {
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    });
}

// BAGIAN 2: LOGIN PAGE
const btnLogin = document.getElementById('btnLogin');
if (btnLogin) {

    if (sessionStorage.getItem('sudahLogin') === 'true') {
        window.location.href = 'index.html';
    }

    function prosesLogin() {
        const username = document.getElementById('inputUsername').value.trim();
        const password = document.getElementById('inputPassword').value;
        const errorMsg = document.getElementById('errorMsg');

        if (!username || !password) {
            errorMsg.innerText     = 'Username dan password harus diisi!';
            errorMsg.style.display = 'block';
            return;
        }

        btnLogin.disabled      = true;
        btnLogin.innerText     = 'Memproses...';
        errorMsg.style.display = 'none';

        fetch('../api/login.php', {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ username, password })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.status === 'success') {
                sessionStorage.setItem('sudahLogin', 'true');
                sessionStorage.setItem('namaAdmin', data.data.username);
                window.location.href = 'index.html';
            } else {
                errorMsg.innerText     = data.message;
                errorMsg.style.display = 'block';
                btnLogin.disabled      = false;
                btnLogin.innerText     = 'LOGIN';
            }
        })
        .catch(function() {
            errorMsg.innerText     = 'Gagal terhubung ke server. Coba lagi.';
            errorMsg.style.display = 'block';
            btnLogin.disabled      = false;
            btnLogin.innerText     = 'LOGIN';
        });
    }

    btnLogin.addEventListener('click', prosesLogin);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') prosesLogin();
    });
}

// BAGIAN 3: SPA DASHBOARD
const dbPages    = ['db-Beranda', 'db-Pengumuman', 'db-KritikSaran', 'db-LaporPrasarana', 'db-pengaturan'];
const dbNavLinks = document.querySelectorAll('.db-nav-link');

function dbTampilkanHalaman(idHalaman) {
    dbPages.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const tuju = document.getElementById(idHalaman);
    if (tuju) tuju.style.display = 'block';

    dbNavLinks.forEach(function(link) {
        link.classList.remove('active');
        if (link.dataset.target === idHalaman) link.classList.add('active');
    });
}

dbNavLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = this.dataset.target;
        if (target) dbTampilkanHalaman(target);
    });
});

document.querySelectorAll('.db-stat-link, .db-lihat-semua').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = this.dataset.target;
        if (target) dbTampilkanHalaman(target);
    });
});

if (document.getElementById('db-Beranda')) {
    dbTampilkanHalaman('db-Beranda');
}

// BAGIAN 4: HELPER FORMAT WAKTU
function formatTanggalPengumuman(tanggalStr, createdAt) {
    const namaHari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const tgl  = new Date(createdAt.replace(' ', 'T'));
    const hari = namaHari[tgl.getDay()];
    const dd   = String(tgl.getDate()).padStart(2,'0');
    const mm   = String(tgl.getMonth()+1).padStart(2,'0');
    const yy   = tgl.getFullYear();
    const hh   = String(tgl.getHours()).padStart(2,'0');
    const mn   = String(tgl.getMinutes()).padStart(2,'0');
    return hari + ', ' + dd + '/' + mm + '/' + yy + ' ' + hh + '.' + mn + ' WIB';
}

function formatDatetime(datetimeStr) {
    const dt = new Date(datetimeStr.replace(' ','T'));
    const dd = String(dt.getDate()).padStart(2,'0');
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    const yy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2,'0');
    const mn = String(dt.getMinutes()).padStart(2,'0');
    return dd+'/'+mm+'/'+yy+' '+hh+'.'+mn;
}

// BAGIAN 5: PENGUMUMAN
function loadPengumuman() {
    fetch('../api/pengumuman.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status !== 'success') return;

        const list    = document.getElementById('historyPengumuman');
        const preview = document.getElementById('previewPengumuman');

        if (list)    list.innerHTML    = '';
        if (preview) preview.innerHTML = '';

        const elStat = document.getElementById('statPengumuman');
        if (elStat) elStat.innerText = data.data.length;

        if (data.data.length === 0) {
            if (list) list.innerHTML = '<p style="color:#aaa;font-size:0.85rem;">Belum ada pengumuman.</p>';
            return;
        }

        data.data.forEach(function(item) {
            const waktu = formatTanggalPengumuman(item.tanggal, item.created_at);

            if (list) {
                const div = document.createElement('div');
                div.classList.add('db-pengumuman-item');
                div.dataset.id = item.id;
                div.innerHTML = `
                    <span class="db-pengumuman-waktu">${waktu}</span>
                    <p class="db-pengumuman-judul">${item.judul}</p>
                    <p class="db-pengumuman-deskripsi">${item.deskripsi}</p>
                    <div class="db-pengumuman-actions">
                        <button class="db-btn-edit" title="Edit">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="db-btn-hapus" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                div.querySelector('.db-btn-edit').addEventListener('click', function() { bukaModalEdit(item); });
                div.querySelector('.db-btn-hapus').addEventListener('click', function() { hapusPengumuman(item.id, div); });
                list.appendChild(div);
            }

            if (preview) {
                const div = document.createElement('div');
                div.classList.add('db-preview-pengumuman');
                div.innerHTML = `
                    <span class="db-preview-waktu">${waktu}</span>
                    <p class="db-preview-judul">${item.judul}</p>
                    <p class="db-preview-deskripsi">${item.deskripsi}</p>
                `;
                preview.appendChild(div);
            }
        });
    });
}

function hapusPengumuman(id, elDiv) {
    if (!confirm('Hapus pengumuman ini?')) return;
    fetch('../api/pengumuman.php', {
        method  : 'DELETE',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: id })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') { elDiv.remove(); loadPengumuman(); }
        else alert('Gagal menghapus: ' + data.message);
    });
}

function bukaModalEdit(item) {
    document.getElementById('editId').value        = item.id;
    document.getElementById('editJudul').value     = item.judul;
    document.getElementById('editDeskripsi').value = item.deskripsi;
    document.getElementById('modalEditPengumuman').style.display = 'flex';
}

const btnTutupEdit = document.getElementById('btnTutupEdit');
if (btnTutupEdit) {
    btnTutupEdit.addEventListener('click', function() {
        document.getElementById('modalEditPengumuman').style.display = 'none';
    });
}

const btnSimpanEdit = document.getElementById('btnSimpanEdit');
if (btnSimpanEdit) {
    btnSimpanEdit.addEventListener('click', function() {
        const id        = document.getElementById('editId').value;
        const judul     = document.getElementById('editJudul').value.trim();
        const deskripsi = document.getElementById('editDeskripsi').value.trim();

        if (!judul || !deskripsi) { alert('Judul dan deskripsi harus diisi!'); return; }

        btnSimpanEdit.disabled  = true;
        btnSimpanEdit.innerText = 'Menyimpan...';

        const tanggal = new Date().toISOString().split('T')[0];

        fetch('../api/pengumuman.php', {
            method  : 'PUT',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ id, tanggal, judul, deskripsi })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.status === 'success') {
                document.getElementById('modalEditPengumuman').style.display = 'none';
                loadPengumuman();
            } else alert('Gagal: ' + data.message);
        })
        .catch(function() { alert('Gagal terhubung ke server.'); })
        .finally(function() {
            btnSimpanEdit.disabled  = false;
            btnSimpanEdit.innerHTML = '<i class="fas fa-save"></i> Simpan';
        });
    });
}

const btnUmumkan = document.getElementById('btnUmumkan');
if (btnUmumkan) {
    btnUmumkan.addEventListener('click', function() {
        const judul     = document.getElementById('inputJudul').value.trim();
        const deskripsi = document.getElementById('inputDeskripsi').value.trim();

        if (!judul || !deskripsi) { alert('Judul dan deskripsi harus diisi!'); return; }

        btnUmumkan.disabled  = true;
        btnUmumkan.innerText = 'Menyimpan...';

        const tanggal = new Date().toISOString().split('T')[0];

        fetch('../api/pengumuman.php', {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ tanggal, judul, deskripsi })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.status === 'success') {
                alert('Pengumuman berhasil ditambahkan!');
                document.getElementById('inputJudul').value     = '';
                document.getElementById('inputDeskripsi').value = '';
                loadPengumuman();
            } else alert('Gagal: ' + data.message);
        })
        .catch(function() { alert('Gagal terhubung ke server.'); })
        .finally(function() {
            btnUmumkan.disabled  = false;
            btnUmumkan.innerHTML = '<i class="fas fa-paper-plane"></i> Umumkan';
        });
    });
}

// BAGIAN 6: KRITIK & SARAN
let filterKritikAktif     = 'semua';
let filterTglDariKritik   = '';
let filterTglSampaiKritik = '';
let dataKritikSemua       = [];

function bukaModalWA() {
    document.getElementById('inputNomorWA').value = '';
    document.getElementById('modalWA').style.display = 'flex';
    setTimeout(function() { document.getElementById('inputNomorWA').focus(); }, 100);
}

const btnTutupWA = document.getElementById('btnTutupWA');
if (btnTutupWA) {
    btnTutupWA.addEventListener('click', function() {
        document.getElementById('modalWA').style.display = 'none';
    });
}

const btnChatSekarang = document.getElementById('btnChatSekarang');
if (btnChatSekarang) {
    btnChatSekarang.addEventListener('click', function() {
        let nomor = document.getElementById('inputNomorWA').value.trim();
        if (!nomor) { alert('Nomor WhatsApp harus diisi!'); return; }
        if (nomor.startsWith('0')) nomor = '62' + nomor.slice(1);
        nomor = nomor.replace(/\D/g, '');
        window.open('https://wa.me/' + nomor, '_blank');
        document.getElementById('modalWA').style.display = 'none';
    });
}

const modalWA = document.getElementById('modalWA');
if (modalWA) {
    modalWA.addEventListener('click', function(e) {
        if (e.target === modalWA) modalWA.style.display = 'none';
    });
}

function loadKritikSaran() {
    fetch('../api/kritik.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status !== 'success') return;
        dataKritikSemua = data.data;

        const elStat = document.getElementById('statKritik');
        if (elStat) elStat.innerText = data.data.length;

        const preview = document.getElementById('previewKritik');
        if (preview) {
            preview.innerHTML = '';
            data.data.slice(0, 3).forEach(function(item) {
                let fotoHTML = '';
                if (item.foto && item.foto.length > 0) {
                    item.foto.forEach(function(f) {
                        fotoHTML += `<img src="../uploads/kritik_saran/${f}" class="db-foto-thumb" onclick="bukaModalFoto(this.src)" alt="Foto">`;
                    });
                }
                const badgeJenis = item.jenis === 'Kritik'
                    ? '<span class="db-badge" style="background:#fdecea;color:#c0392b;">Kritik</span>'
                    : '<span class="db-badge" style="background:#eaf4fb;color:#2980b9;">Saran</span>';
                const div = document.createElement('div');
                div.classList.add('db-laporan-item');
                div.innerHTML = `${badgeJenis}<p class="db-laporan-teks">${item.deskripsi}</p><div class="db-foto-list">${fotoHTML}</div><span class="db-tanggal">${formatDatetime(item.created_at)}</span>`;
                preview.appendChild(div);
            });
        }
        tampilkanKritik();
    })
    .catch(function(err) { console.error('Gagal load kritik:', err); });
}

function tampilkanKritik() {
    const list = document.getElementById('historyKritik');
    if (!list) return;
    list.innerHTML = '';

    let tampilkan = dataKritikSemua;
    if (filterKritikAktif !== 'semua') {
        tampilkan = tampilkan.filter(function(i) { return i.jenis === filterKritikAktif; });
    }
    if (filterTglDariKritik) {
        const dari = new Date(filterTglDariKritik + 'T00:00:00');
        tampilkan = tampilkan.filter(function(i) { return new Date(i.created_at.replace(' ','T')) >= dari; });
    }
    if (filterTglSampaiKritik) {
        const sampai = new Date(filterTglSampaiKritik + 'T23:59:59');
        tampilkan = tampilkan.filter(function(i) { return new Date(i.created_at.replace(' ','T')) <= sampai; });
    }

    if (tampilkan.length === 0) {
        list.innerHTML = '<p style="color:#aaa;font-size:0.85rem;padding:10px 0;">Tidak ada data.</p>';
        return;
    }

    tampilkan.forEach(function(item) {
        let fotoHTML = '';
        if (item.foto && item.foto.length > 0) {
            item.foto.forEach(function(namaFile) {
                fotoHTML += `<img src="../uploads/kritik_saran/${namaFile}" class="db-foto-thumb" onclick="bukaModalFoto(this.src)" alt="Foto">`;
            });
        }
        const badgeJenis = item.jenis === 'Kritik'
            ? '<span class="db-badge" style="background:#fdecea;color:#c0392b;">Kritik</span>'
            : '<span class="db-badge" style="background:#eaf4fb;color:#2980b9;">Saran</span>';

        const div = document.createElement('div');
        div.classList.add('db-history-item', 'db-laporan-card');
        div.dataset.id = item.id;
        div.innerHTML = `
            <div class="db-laporan-body">
                ${badgeJenis}
                <p class="db-laporan-teks">${item.deskripsi}</p>
                <div class="db-foto-list">${fotoHTML}</div>
                <span class="db-tanggal">${formatDatetime(item.created_at)}</span>
            </div>
            <div class="db-laporan-actions">
                <button class="db-btn-wa"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                <button class="db-btn-hapus"><i class="fas fa-trash"></i></button>
            </div>
        `;
        div.querySelector('.db-btn-wa').addEventListener('click', function() { bukaModalWA(); });
        div.querySelector('.db-btn-hapus').addEventListener('click', function() { hapusKritik(item.id, div); });
        list.appendChild(div);
    });
}

document.querySelectorAll('.db-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.db-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        filterKritikAktif = this.dataset.filter;
        tampilkanKritik();
    });
});

const btnFilterKritik = document.getElementById('btnFilterKritik');
if (btnFilterKritik) {
    btnFilterKritik.addEventListener('click', function() {
        filterTglDariKritik   = document.getElementById('filterTanggalDariKritik').value;
        filterTglSampaiKritik = document.getElementById('filterTanggalSampaiKritik').value;
        if (!filterTglDariKritik && !filterTglSampaiKritik) { alert('Pilih minimal satu tanggal untuk filter!'); return; }
        tampilkanKritik();
    });
}

const btnResetKritik = document.getElementById('btnResetKritik');
if (btnResetKritik) {
    btnResetKritik.addEventListener('click', function() {
        filterTglDariKritik   = '';
        filterTglSampaiKritik = '';
        document.getElementById('filterTanggalDariKritik').value   = '';
        document.getElementById('filterTanggalSampaiKritik').value = '';
        tampilkanKritik();
    });
}

function hapusKritik(id, elDiv) {
    if (!confirm('Hapus laporan ini?')) return;
    fetch('../api/kritik.php', {
        method  : 'DELETE',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: id })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') {
            elDiv.remove();
            dataKritikSemua = dataKritikSemua.filter(function(i) { return i.id !== id; });
            const elStat = document.getElementById('statKritik');
            if (elStat) elStat.innerText = dataKritikSemua.length;
        } else alert('Gagal menghapus: ' + data.message);
    });
}

// BAGIAN 7: LAPORAN PRASARANA
let filterTglDariLaporan   = '';
let filterTglSampaiLaporan = '';
let dataLaporanSemua       = [];

function loadLaporanPrasarana() {
    fetch('../api/laporan.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status !== 'success') return;
        dataLaporanSemua = data.data;

        const elStat = document.getElementById('statLaporan');
        if (elStat) elStat.innerText = data.data.length;

        const preview = document.getElementById('previewLaporan');
        if (preview) {
            preview.innerHTML = '';
            data.data.slice(0, 3).forEach(function(item) {
                let fotoHTML = '';
                if (item.foto && item.foto.length > 0) {
                    item.foto.forEach(function(f) {
                        fotoHTML += `<img src="../uploads/laporan_prasarana/${f}" class="db-foto-thumb" onclick="bukaModalFoto(this.src)" alt="Foto">`;
                    });
                }
                const div = document.createElement('div');
                div.classList.add('db-laporan-item');
                div.innerHTML = `<p class="db-laporan-teks">${item.deskripsi}</p><div class="db-foto-list">${fotoHTML}</div><span class="db-tanggal">${formatDatetime(item.created_at)}</span>`;
                preview.appendChild(div);
            });
        }
        tampilkanLaporan();
    })
    .catch(function(err) { console.error('Gagal load laporan:', err); });
}

function tampilkanLaporan() {
    const list = document.getElementById('historyLaporan');
    if (!list) return;
    list.innerHTML = '';

    let tampilkan = dataLaporanSemua;
    if (filterTglDariLaporan) {
        const dari = new Date(filterTglDariLaporan + 'T00:00:00');
        tampilkan = tampilkan.filter(function(i) { return new Date(i.created_at.replace(' ','T')) >= dari; });
    }
    if (filterTglSampaiLaporan) {
        const sampai = new Date(filterTglSampaiLaporan + 'T23:59:59');
        tampilkan = tampilkan.filter(function(i) { return new Date(i.created_at.replace(' ','T')) <= sampai; });
    }

    if (tampilkan.length === 0) {
        list.innerHTML = '<p style="color:#aaa;font-size:0.85rem;padding:10px 0;">Tidak ada data.</p>';
        return;
    }

    tampilkan.forEach(function(item) {
        let fotoHTML = '';
        if (item.foto && item.foto.length > 0) {
            item.foto.forEach(function(namaFile) {
                fotoHTML += `<img src="../uploads/laporan_prasarana/${namaFile}" class="db-foto-thumb" onclick="bukaModalFoto(this.src)" alt="Foto">`;
            });
        }
        const badgeClass  = item.status === 'selesai' ? 'db-badge-selesai' : 'db-badge-pending';
        const badgeTeks   = item.status === 'selesai' ? 'Selesai' : 'Pending';
        const btnDisabled = item.status === 'selesai' ? 'disabled' : '';

        const div = document.createElement('div');
        div.classList.add('db-history-item', 'db-laporan-card');
        div.dataset.id = item.id;
        div.innerHTML = `
            <div class="db-laporan-body">
                <p class="db-laporan-teks">${item.deskripsi}</p>
                <div class="db-foto-list">${fotoHTML}</div>
                <span class="db-tanggal">${formatDatetime(item.created_at)}</span>
            </div>
            <div class="db-laporan-actions">
                <span class="db-badge ${badgeClass}">${badgeTeks}</span>
                <button class="db-btn-selesai" ${btnDisabled}>
                    <i class="fas fa-check"></i> ${item.status === 'selesai' ? 'Selesai' : 'Tandai Selesai'}
                </button>
                <button class="db-btn-hapus"><i class="fas fa-trash"></i></button>
            </div>
        `;
        const btnSelesai = div.querySelector('.db-btn-selesai');
        if (!btnSelesai.disabled) {
            btnSelesai.addEventListener('click', function() { updateStatusLaporan(item.id, div); });
        }
        div.querySelector('.db-btn-hapus').addEventListener('click', function() { hapusLaporan(item.id, div); });
        list.appendChild(div);
    });
}

const btnFilterLaporan = document.getElementById('btnFilterLaporan');
if (btnFilterLaporan) {
    btnFilterLaporan.addEventListener('click', function() {
        filterTglDariLaporan   = document.getElementById('filterTanggalDariLaporan').value;
        filterTglSampaiLaporan = document.getElementById('filterTanggalSampaiLaporan').value;
        if (!filterTglDariLaporan && !filterTglSampaiLaporan) { alert('Pilih minimal satu tanggal untuk filter!'); return; }
        tampilkanLaporan();
    });
}

const btnResetLaporan = document.getElementById('btnResetLaporan');
if (btnResetLaporan) {
    btnResetLaporan.addEventListener('click', function() {
        filterTglDariLaporan   = '';
        filterTglSampaiLaporan = '';
        document.getElementById('filterTanggalDariLaporan').value   = '';
        document.getElementById('filterTanggalSampaiLaporan').value = '';
        tampilkanLaporan();
    });
}

function updateStatusLaporan(id, elDiv) {
    fetch('../api/laporan.php', {
        method  : 'PATCH',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: id, status: 'selesai' })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') {
            dataLaporanSemua = dataLaporanSemua.map(function(i) {
                if (i.id === id) i.status = 'selesai';
                return i;
            });
            tampilkanLaporan();
        } else alert('Gagal update status: ' + data.message);
    });
}

function hapusLaporan(id, elDiv) {
    if (!confirm('Hapus laporan ini?')) return;
    fetch('../api/laporan.php', {
        method  : 'DELETE',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: id })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') {
            dataLaporanSemua = dataLaporanSemua.filter(function(i) { return i.id !== id; });
            const elStat = document.getElementById('statLaporan');
            if (elStat) elStat.innerText = dataLaporanSemua.length;
            tampilkanLaporan();
        } else alert('Gagal menghapus: ' + data.message);
    });
}

// BAGIAN 8: MODAL PREVIEW FOTO
function bukaModalFoto(src) {
    const modal = document.getElementById('modalFotoDB');
    const img   = document.getElementById('modalFotoImgDB');
    if (modal && img) {
        img.src = src;
        modal.style.display = 'flex';
    }
}

const modalFotoDB = document.getElementById('modalFotoDB');
if (modalFotoDB) {
    modalFotoDB.addEventListener('click', function(e) {
        if (e.target === modalFotoDB) modalFotoDB.style.display = 'none';
    });
    document.getElementById('modalFotoCloseDB').addEventListener('click', function() {
        modalFotoDB.style.display = 'none';
    });
}

// BAGIAN 9: BLACKLIST
function loadBlacklist() {
    fetch('../api/blacklist.php?action=list')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        const container = document.getElementById('daftarBlacklist');
        if (!container) return;
        container.innerHTML = '';
        if (!data.data || data.data.length === 0) {
            container.innerHTML = '<span class="db-blacklist-kosong">Belum ada kata blacklist.</span>';
            return;
        }
        data.data.forEach(function(item) { buatTagBlacklist(item.id, item.kata); });
    })
    .catch(function() { console.warn('Gagal memuat blacklist'); });
}

function buatTagBlacklist(id, kata) {
    const container = document.getElementById('daftarBlacklist');
    if (!container) return;
    const tag = document.createElement('div');
    tag.classList.add('db-blacklist-tag');
    tag.dataset.id = id;
    tag.innerHTML = `<span>${kata}</span><button class="db-tag-hapus" title="Hapus kata ini"><i class="fas fa-times"></i></button>`;
    tag.querySelector('.db-tag-hapus').addEventListener('click', function() { hapusKataBlacklist(id, tag); });
    container.appendChild(tag);
}

function hapusKataBlacklist(id, elTag) {
    if (!confirm('Hapus kata "' + elTag.querySelector('span').innerText + '" dari blacklist?')) return;
    fetch('../api/blacklist.php', {
        method  : 'DELETE',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: id })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') {
            elTag.remove();
            const container = document.getElementById('daftarBlacklist');
            if (container && container.children.length === 0) {
                container.innerHTML = '<span class="db-blacklist-kosong">Belum ada kata blacklist.</span>';
            }
        } else alert('Gagal menghapus: ' + data.message);
    });
}

const btnTambahBlacklist = document.getElementById('btnTambahBlacklist');
if (btnTambahBlacklist) {
    btnTambahBlacklist.addEventListener('click', function() {
        const input = document.getElementById('inputKataBlacklist');
        const kata  = input.value.trim().toLowerCase();
        if (!kata) { alert('Kata tidak boleh kosong!'); input.focus(); return; }

        btnTambahBlacklist.disabled  = true;
        btnTambahBlacklist.innerText = 'Menyimpan...';

        fetch('../api/blacklist.php', {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ kata: kata })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.status === 'success') {
                const container = document.getElementById('daftarBlacklist');
                const kosong = container.querySelector('.db-blacklist-kosong');
                if (kosong) kosong.remove();
                buatTagBlacklist(data.data.id, kata);
                input.value = '';
                input.focus();
            } else alert('Gagal: ' + data.message);
        })
        .catch(function() { alert('Gagal terhubung ke server.'); })
        .finally(function() {
            btnTambahBlacklist.disabled  = false;
            btnTambahBlacklist.innerHTML = '<i class="fas fa-plus"></i> Tambah';
        });
    });

    document.getElementById('inputKataBlacklist').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') btnTambahBlacklist.click();
    });
}

// BAGIAN 10: POPUP IMAGES
let dataPopupImages = [];

function updatePopupCounter() {
    const counter = document.getElementById('dbPopupCounter');
    if (counter) counter.innerText = dataPopupImages.length + ' foto diupload';
}

function loadPopupImages() {
    fetch('../api/popup.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        dataPopupImages = data.status === 'success' ? data.data : [];
        renderPopupGrid();
    })
    .catch(function() { console.warn('Gagal memuat gambar popup'); });
}

function renderPopupGrid() {
    const grid   = document.getElementById('dbPopupGrid');
    const kosong = document.getElementById('dbPopupKosong');
    if (!grid) return;

    Array.from(grid.children).forEach(function(child) {
        if (!child.classList.contains('db-popup-kosong')) child.remove();
    });

    updatePopupCounter();

    if (dataPopupImages.length === 0) {
        if (kosong) kosong.style.display = 'block';
        return;
    }
    if (kosong) kosong.style.display = 'none';

    dataPopupImages.forEach(function(item, index) {
        const card   = document.createElement('div');
        card.classList.add('db-popup-card');
        card.dataset.id = item.id;
        const imgSrc = '../uploads/popup/' + item.nama_file;
        card.innerHTML = `
            <img src="${imgSrc}" alt="Popup ${index + 1}" title="Klik untuk zoom">
            <button class="db-popup-btn-hapus" title="Hapus"><i class="fas fa-times"></i></button>
        `;
        card.querySelector('img').addEventListener('click', function() { bukaModalFoto(imgSrc); });
        card.querySelector('.db-popup-btn-hapus').addEventListener('click', function(e) {
            e.stopPropagation();
            hapusPopupImage(item.id, card);
        });
        grid.appendChild(card);
    });
}

function hapusPopupImage(id, elCard) {
    if (!confirm('Hapus gambar popup ini?')) return;
    elCard.style.opacity   = '0.4';
    elCard.style.transform = 'scale(0.9)';
    fetch('../api/popup.php', {
        method  : 'DELETE',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: id })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') {
            dataPopupImages = dataPopupImages.filter(function(i) { return i.id !== id; });
            renderPopupGrid();
        } else {
            alert('Gagal menghapus: ' + data.message);
            elCard.style.opacity   = '1';
            elCard.style.transform = '';
        }
    })
    .catch(function() {
        alert('Gagal terhubung ke server.');
        elCard.style.opacity   = '1';
        elCard.style.transform = '';
    });
}

function initPopupUpload() {
    const uploadArea = document.getElementById('dbPopupUploadArea');
    const fileInput  = document.getElementById('dbPopupFileInput');
    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', function() { fileInput.click(); });

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#4a90e2';
        uploadArea.style.background  = '#f0f7ff';
    });
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.style.borderColor = '#b0bec5';
        uploadArea.style.background  = '#fafafa';
    });
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#b0bec5';
        uploadArea.style.background  = '#fafafa';
        if (e.dataTransfer.files.length > 0) prosesUploadPopup(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) prosesUploadPopup(this.files);
        this.value = '';
    });
}

function prosesUploadPopup(files) {
    const MAKS_SIZE = 2 * 1024 * 1024;
    const grid      = document.getElementById('dbPopupGrid');
    const kosong    = document.getElementById('dbPopupKosong');
    const fileArray = Array.from(files);
    const formData  = new FormData();
    const gagal     = [];

    fileArray.forEach(function(file) {
        if (!file.type.startsWith('image/')) { gagal.push(file.name + ' (bukan gambar)'); return; }
        if (file.size > MAKS_SIZE) {
            const mb = (file.size / (1024 * 1024)).toFixed(1);
            gagal.push(file.name + ' (' + mb + 'MB, melebihi 2MB)');
            return;
        }
        formData.append('foto[]', file, file.name);
    });

    let adaFile = false;
    for (let pair of formData.entries()) { if (pair[0] === 'foto[]') { adaFile = true; break; } }
    if (!adaFile) { if (gagal.length > 0) alert('File ditolak:\n' + gagal.join('\n')); return; }

    let jumlahUpload = 0;
    for (let pair of formData.entries()) { if (pair[0] === 'foto[]') jumlahUpload++; }

    if (kosong) kosong.style.display = 'none';
    const loadingCards = [];
    for (let i = 0; i < jumlahUpload; i++) {
        const lc = document.createElement('div');
        lc.classList.add('db-popup-loading');
        lc.innerHTML = '<i class="fas fa-spinner"></i><span>Mengupload...</span>';
        grid.appendChild(lc);
        loadingCards.push(lc);
    }

    fetch('../api/popup.php', { method: 'POST', body: formData })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        loadingCards.forEach(function(lc) { lc.remove(); });
        if (data.gagal && data.gagal.length > 0) gagal.push(...data.gagal);
        if (gagal.length > 0) alert('Beberapa file ditolak:\n' + gagal.join('\n'));
        loadPopupImages();
    })
    .catch(function() {
        loadingCards.forEach(function(lc) { lc.remove(); });
        alert('Gagal terhubung ke server. Coba lagi.');
    });
}

// BAGIAN 11: LOAD SEMUA DATA
if (document.getElementById('db-Beranda')) {
    loadPengumuman();
    loadKritikSaran();
    loadLaporanPrasarana();
    loadBlacklist();
    loadPopupImages();
    initPopupUpload();
}

// BAGIAN 12: PRINT LAPORAN
let jenisPrintAktif = '';

function bukaModalPrint(jenis) {
    jenisPrintAktif = jenis;
    const desc = document.getElementById('modalPrintDesc');
    if (desc) {
        desc.innerText = 'Pilih rentang tanggal laporan ' +
            (jenis === 'kritik' ? 'Kritik & Saran' : 'Prasarana') +
            ' yang ingin dicetak (maks. 30 hari):';
    }
    document.getElementById('printDari').value   = '';
    document.getElementById('printSampai').value = '';
    document.getElementById('printWarning').style.display = 'none';
    document.getElementById('modalPrint').style.display = 'flex';
}

const btnPrintKritik = document.getElementById('btnPrintKritik');
if (btnPrintKritik) btnPrintKritik.addEventListener('click', function() { bukaModalPrint('kritik'); });

const btnPrintLaporan = document.getElementById('btnPrintLaporan');
if (btnPrintLaporan) btnPrintLaporan.addEventListener('click', function() { bukaModalPrint('laporan'); });

const btnTutupModalPrint = document.getElementById('btnTutupModalPrint');
if (btnTutupModalPrint) {
    btnTutupModalPrint.addEventListener('click', function() {
        document.getElementById('modalPrint').style.display = 'none';
    });
}

document.getElementById('modalPrint') && document.getElementById('modalPrint').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
});

document.getElementById('printSampai') && document.getElementById('printSampai').addEventListener('change', function() {
    const dari    = document.getElementById('printDari').value;
    const sampai  = this.value;
    const warning = document.getElementById('printWarning');
    if (dari && sampai) {
        const selisih = (new Date(sampai) - new Date(dari)) / (1000 * 60 * 60 * 24);
        if (selisih > 30) {
            warning.style.display = 'block';
            warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Maksimal rentang 30 hari';
        } else if (selisih < 0) {
            warning.style.display = 'block';
            warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Tanggal sampai harus setelah tanggal dari';
        } else {
            warning.style.display = 'none';
        }
    }
});

const btnKonfirmasiPrint = document.getElementById('btnKonfirmasiPrint');
if (btnKonfirmasiPrint) {
    btnKonfirmasiPrint.addEventListener('click', function() {
        const dari   = document.getElementById('printDari').value;
        const sampai = document.getElementById('printSampai').value;
        if (!dari || !sampai) { alert('Pilih tanggal dari dan sampai terlebih dahulu!'); return; }
        const selisih = (new Date(sampai) - new Date(dari)) / (1000 * 60 * 60 * 24);
        if (selisih < 0)  { alert('Tanggal sampai harus setelah tanggal dari!'); return; }
        if (selisih > 30) { alert('Maksimal rentang tanggal adalah 30 hari!'); return; }
        const url = 'print.html?jenis=' + jenisPrintAktif + '&dari=' + dari + '&sampai=' + sampai;
        window.open(url, '_blank');
        document.getElementById('modalPrint').style.display = 'none';
    });
}