// ============================================================
// DASHBOARD - script.js
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
const dbPages    = ['db-Beranda', 'db-Pengumuman', 'db-KritikSaran', 'db-LaporPrasarana'];
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
    const tgl = new Date(createdAt.replace(' ', 'T'));
    const hari = namaHari[tgl.getDay()];
    const dd = String(tgl.getDate()).padStart(2,'0');
    const mm = String(tgl.getMonth()+1).padStart(2,'0');
    const yy = tgl.getFullYear();
    const hh = String(tgl.getHours()).padStart(2,'0');
    const mn = String(tgl.getMinutes()).padStart(2,'0');
    return hari + ', ' + dd + '/' + mm + '/' + yy + ' ' + hh + '.' + mn + ' WIB';
}

function formatDatetime(datetimeStr) {
    const dt  = new Date(datetimeStr.replace(' ','T'));
    const dd  = String(dt.getDate()).padStart(2,'0');
    const mm  = String(dt.getMonth()+1).padStart(2,'0');
    const yy  = dt.getFullYear();
    const hh  = String(dt.getHours()).padStart(2,'0');
    const mn  = String(dt.getMinutes()).padStart(2,'0');
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

            // ── History list (format baru seperti tampilan user) ──
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

                div.querySelector('.db-btn-edit').addEventListener('click', function() {
                    bukaModalEdit(item);
                });

                div.querySelector('.db-btn-hapus').addEventListener('click', function() {
                    hapusPengumuman(item.id, div);
                });

                list.appendChild(div);
            }

            // ── Preview di beranda (format baru) ──
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
        if (data.status === 'success') {
            elDiv.remove();
            loadPengumuman();
        } else {
            alert('Gagal menghapus: ' + data.message);
        }
    });
}

// ── Modal Edit Pengumuman ──
function bukaModalEdit(item) {
    document.getElementById('editId').value       = item.id;
    document.getElementById('editTanggal').value  = item.tanggal;
    document.getElementById('editJudul').value    = item.judul;
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
        const id       = document.getElementById('editId').value;
        const tanggal  = document.getElementById('editTanggal').value;
        const judul    = document.getElementById('editJudul').value.trim();
        const deskripsi = document.getElementById('editDeskripsi').value.trim();

        if (!tanggal || !judul || !deskripsi) {
            alert('Semua kolom harus diisi!');
            return;
        }

        btnSimpanEdit.disabled  = true;
        btnSimpanEdit.innerText = 'Menyimpan...';

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
            } else {
                alert('Gagal: ' + data.message);
            }
        })
        .finally(function() {
            btnSimpanEdit.disabled  = false;
            btnSimpanEdit.innerHTML = '<i class="fas fa-save"></i> Simpan';
        });
    });
}

// ── Form Tambah Pengumuman ──
const btnUmumkan = document.getElementById('btnUmumkan');
if (btnUmumkan) {
    btnUmumkan.addEventListener('click', function() {
        const tanggal   = document.getElementById('inputTanggal').value;
        const judul     = document.getElementById('inputJudul').value.trim();
        const deskripsi = document.getElementById('inputDeskripsi').value.trim();

        if (!tanggal || !judul || !deskripsi) {
            alert('Semua kolom harus diisi!');
            return;
        }

        btnUmumkan.disabled  = true;
        btnUmumkan.innerText = 'Menyimpan...';

        fetch('../api/pengumuman.php', {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ tanggal, judul, deskripsi })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.status === 'success') {
                alert('Pengumuman berhasil ditambahkan!');
                document.getElementById('inputTanggal').value   = '';
                document.getElementById('inputJudul').value     = '';
                document.getElementById('inputDeskripsi').value = '';
                loadPengumuman();
            } else {
                alert('Gagal: ' + data.message);
            }
        })
        .finally(function() {
            btnUmumkan.disabled  = false;
            btnUmumkan.innerHTML = '<i class="fas fa-paper-plane"></i> Umumkan';
        });
    });
}

// BAGIAN 6: KRITIK & SARAN
let filterKritikAktif = 'semua';

function loadKritikSaran() {
    fetch('../api/kritik.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status !== 'success') return;

        const list    = document.getElementById('historyKritik');
        const preview = document.getElementById('previewKritik');

        if (list)    list.innerHTML    = '';
        if (preview) preview.innerHTML = '';

        const elStat = document.getElementById('statKritik');
        if (elStat) elStat.innerText = data.data.length;

        // Filter data
        let tampilkan = data.data;
        if (filterKritikAktif !== 'semua') {
            tampilkan = data.data.filter(function(i) {
                return i.jenis === filterKritikAktif;
            });
        }

        if (tampilkan.length === 0) {
            if (list) list.innerHTML = '<p style="color:#aaa;font-size:0.85rem;">Tidak ada data.</p>';
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

            if (list) {
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
                        <button class="db-btn-wa" title="Chat WhatsApp">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </button>
                        <button class="db-btn-hapus" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;

                div.querySelector('.db-btn-wa').addEventListener('click', function() {
                    bukaModalWA();
                });

                div.querySelector('.db-btn-hapus').addEventListener('click', function() {
                    hapusKritik(item.id, div);
                });

                list.appendChild(div);
            }

            // Preview beranda
            if (preview) {
                const div = document.createElement('div');
                div.classList.add('db-laporan-item');
                div.innerHTML = `
                    ${badgeJenis}
                    <p class="db-laporan-teks">${item.deskripsi}</p>
                    <div class="db-foto-list">${fotoHTML}</div>
                    <span class="db-tanggal">${formatDatetime(item.created_at)}</span>
                `;
                preview.appendChild(div);
            }
        });
    });
}

// Filter buttons
document.querySelectorAll('.db-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.db-filter-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        filterKritikAktif = this.dataset.filter;
        loadKritikSaran();
    });
});

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
            loadKritikSaran();
        } else {
            alert('Gagal menghapus: ' + data.message);
        }
    });
}

// ── Modal WhatsApp ──
function bukaModalWA() {
    document.getElementById('inputNomorWA').value = '';
    document.getElementById('modalWA').style.display = 'flex';
    document.getElementById('inputNomorWA').focus();
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

        if (!nomor) {
            alert('Nomor WhatsApp harus diisi!');
            return;
        }

        // Normalisasi nomor: 08xxx → 628xxx
        if (nomor.startsWith('0')) {
            nomor = '62' + nomor.slice(1);
        }

        // Buka WhatsApp
        const urlWA = 'https://wa.me/' + nomor;
        window.open(urlWA, '_blank');

        document.getElementById('modalWA').style.display = 'none';
    });
}

// BAGIAN 7: LAPORAN PRASARANA
function loadLaporanPrasarana() {
    fetch('../api/laporan.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status !== 'success') return;

        const list    = document.getElementById('historyLaporan');
        const preview = document.getElementById('previewLaporan');

        if (list)    list.innerHTML    = '';
        if (preview) preview.innerHTML = '';

        const elStat = document.getElementById('statLaporan');
        if (elStat) elStat.innerText = data.data.length;

        if (data.data.length === 0) {
            if (list) list.innerHTML = '<p style="color:#aaa;font-size:0.85rem;">Belum ada laporan.</p>';
            return;
        }

        data.data.forEach(function(item) {
            let fotoHTML = '';
            if (item.foto && item.foto.length > 0) {
                item.foto.forEach(function(namaFile) {
                    fotoHTML += `<img src="../uploads/laporan_prasarana/${namaFile}" class="db-foto-thumb" onclick="bukaModalFoto(this.src)" alt="Foto">`;
                });
            }

            const badgeClass  = item.status === 'selesai' ? 'db-badge-selesai' : 'db-badge-pending';
            const badgeTeks   = item.status === 'selesai' ? 'Selesai' : 'Pending';
            const btnDisabled = item.status === 'selesai' ? 'disabled' : '';

            if (list) {
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
                            <i class="fas fa-check"></i>
                            ${item.status === 'selesai' ? 'Selesai' : 'Tandai Selesai'}
                        </button>
                        <button class="db-btn-hapus"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                const btnSelesai = div.querySelector('.db-btn-selesai');
                if (!btnSelesai.disabled) {
                    btnSelesai.addEventListener('click', function() {
                        updateStatusLaporan(item.id, div);
                    });
                }

                div.querySelector('.db-btn-hapus').addEventListener('click', function() {
                    hapusLaporan(item.id, div);
                });

                list.appendChild(div);
            }

            if (preview) {
                const div = document.createElement('div');
                div.classList.add('db-laporan-item');
                div.innerHTML = `
                    <p class="db-laporan-teks">${item.deskripsi}</p>
                    <div class="db-foto-list">${fotoHTML}</div>
                    <span class="db-tanggal">${formatDatetime(item.created_at)}</span>
                `;
                preview.appendChild(div);
            }
        });
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
            loadLaporanPrasarana();
        } else {
            alert('Gagal update status: ' + data.message);
        }
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
            elDiv.remove();
            loadLaporanPrasarana();
        } else {
            alert('Gagal menghapus: ' + data.message);
        }
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

// BAGIAN 9: LOAD SEMUA DATA
if (document.getElementById('db-Beranda')) {
    loadPengumuman();
    loadKritikSaran();
    loadLaporanPrasarana();
}