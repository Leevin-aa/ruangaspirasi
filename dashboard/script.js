// BAGIAN 1: PROTEKSI & LOGOUT
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {

    if (sessionStorage.getItem('sudahLogin') !== 'true') {
        window.location.href = 'login.html';
    }

    const namaAdmin = sessionStorage.getItem('namaAdmin');
    const elSapaan  = document.getElementById('sapaan');
    if (elSapaan && namaAdmin) {
        elSapaan.innerText = 'Selamat datang, ' + namaAdmin + '!';
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
            errorMsg.innerText  = 'Username dan password harus diisi!';
            errorMsg.style.display = 'block';
            return;
        }

        btnLogin.disabled    = true;
        btnLogin.innerText   = 'Memproses...';
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

                btnLogin.disabled  = false;
                btnLogin.innerText = 'LOGIN';
            }
        })
        .catch(function(err) {
            errorMsg.innerText     = 'Gagal terhubung ke server. Coba lagi.';
            errorMsg.style.display = 'block';

            btnLogin.disabled  = false;
            btnLogin.innerText = 'LOGIN';
        });
    }

    btnLogin.addEventListener('click', prosesLogin);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') prosesLogin();
    });
}


// BAGIAN 3: SPA DASHBOARD - PINDAH HALAMAN
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
        if (link.dataset.target === idHalaman) {
            link.classList.add('active');
        }
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

// BAGIAN 4: LOAD DATA DARI DATABASE
function formatTanggal(tanggalStr) {
    const bulan = [
        'Januari','Februari','Maret','April','Mei','Juni',
        'Juli','Agustus','September','Oktober','November','Desember'
    ];
    const tgl = new Date(tanggalStr);
    return tgl.getDate() + ' ' + bulan[tgl.getMonth()] + ' ' + tgl.getFullYear();
}

function formatDatetime(datetimeStr) {
    const dt = new Date(datetimeStr);
    const tgl = dt.getDate().toString().padStart(2, '0');
    const bln = (dt.getMonth() + 1).toString().padStart(2, '0');
    const thn = dt.getFullYear();
    const jam = dt.getHours().toString().padStart(2, '0');
    const mnt = dt.getMinutes().toString().padStart(2, '0');
    return tgl + '/' + bln + '/' + thn + ' ' + jam + '.' + mnt;
}

// BAGIAN 5: PENGUMUMAN
function loadPengumuman() {
    fetch('../api/pengumuman.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status !== 'success') return;

        const list    = document.getElementById('historyPengumuman');
        const preview = document.getElementById('previewPengumuman'); // di beranda

        if (list) list.innerHTML = '';
        if (preview) preview.innerHTML = '';

        const elStat = document.getElementById('statPengumuman');
        if (elStat) elStat.innerText = data.data.length;

        data.data.forEach(function(item) {
            const tgl  = new Date(item.tanggal);
            const hari = tgl.getDate();

            if (list) {
                const div = document.createElement('div');
                div.classList.add('db-history-item');
                div.dataset.id = item.id;
                div.innerHTML = `
                    <div class="db-date-badge">${hari}</div>
                    <div class="db-news-content">
                        <h4>${item.judul}</h4>
                        <p>${item.deskripsi}</p>
                        <span class="db-tanggal">${formatTanggal(item.tanggal)}</span>
                    </div>
                    <button class="db-btn-hapus" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

                div.querySelector('.db-btn-hapus').addEventListener('click', function() {
                    hapusPengumuman(item.id, div);
                });

                list.appendChild(div);
            }

            if (preview) {
                const div = document.createElement('div');
                div.classList.add('db-news-item');
                div.innerHTML = `
                    <div class="db-date-badge">${hari}</div>
                    <div class="db-news-content">
                        <h4>${item.judul}</h4>
                        <p>${item.deskripsi}</p>
                    </div>
                `;
                preview.appendChild(div);
            }
        });
    })
    .catch(function() {
        console.warn('Gagal memuat data pengumuman');
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

        btnUmumkan.disabled   = true;
        btnUmumkan.innerText  = 'Menyimpan...';

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
function loadKritikSaran() {
    fetch('../api/kritik.php')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status !== 'success') return;

        const list    = document.getElementById('historyKritik');
        const preview = document.getElementById('previewKritik');

        if (list) list.innerHTML = '';
        if (preview) preview.innerHTML = '';

        const elStat = document.getElementById('statKritik');
        if (elStat) elStat.innerText = data.data.length;

        data.data.forEach(function(item) {

            let fotoHTML = '';
            if (item.foto && item.foto.length > 0) {
                item.foto.forEach(function(namaFile) {
                    fotoHTML += `
                        <img 
                            src="../uploads/kritik_saran/${namaFile}" 
                            class="db-foto-thumb"
                            onclick="bukaModalFoto(this.src)"
                            alt="Foto"
                        >
                    `;
                });
            }

            const badgeClass = item.status === 'selesai' ? 'db-badge-selesai' : 'db-badge-pending';
            const badgeTeks  = item.status === 'selesai' ? 'Selesai' : 'Pending';
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
                        updateStatusKritik(item.id, div);
                    });
                }

                div.querySelector('.db-btn-hapus').addEventListener('click', function() {
                    hapusKritik(item.id, div);
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
    })
    .catch(function() {
        console.warn('Gagal memuat data kritik saran');
    });
}

function updateStatusKritik(id, elDiv) {
    fetch('../api/kritik.php', {
        method  : 'PATCH',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: id, status: 'selesai' })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.status === 'success') {
            loadKritikSaran();
        } else {
            alert('Gagal update status: ' + data.message);
        }
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
            loadKritikSaran();
        } else {
            alert('Gagal menghapus: ' + data.message);
        }
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

        if (list) list.innerHTML = '';
        if (preview) preview.innerHTML = '';

        const elStat = document.getElementById('statLaporan');
        if (elStat) elStat.innerText = data.data.length;

        data.data.forEach(function(item) {

            let fotoHTML = '';
            if (item.foto && item.foto.length > 0) {
                item.foto.forEach(function(namaFile) {
                    fotoHTML += `
                        <img 
                            src="../uploads/laporan_prasarana/${namaFile}" 
                            class="db-foto-thumb"
                            onclick="bukaModalFoto(this.src)"
                            alt="Foto"
                        >
                    `;
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
    })
    .catch(function() {
        console.warn('Gagal memuat data laporan prasarana');
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
        if (e.target === modalFotoDB) {
            modalFotoDB.style.display = 'none';
        }
    });

    document.getElementById('modalFotoCloseDB').addEventListener('click', function() {
        modalFotoDB.style.display = 'none';
    });
}
// BAGIAN 9: LOAD SEMUA DATA SAAT DASHBOARD DIBUKA
if (document.getElementById('db-Beranda')) {
    loadPengumuman();
    loadKritikSaran();
    loadLaporanPrasarana();
}