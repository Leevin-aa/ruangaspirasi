// ============================================================
// DASHBOARD - dashboard.js
// ============================================================


// ============================================================
// BAGIAN 1: PROTEKSI & LOGOUT
// ============================================================

const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {

    // Jika belum login → lempar ke login
    if (sessionStorage.getItem('sudahLogin') !== 'true') {
        window.location.href = 'login.html';
    }

    // Logout
    btnLogout.addEventListener('click', function() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
}


// ============================================================
// BAGIAN 2: LOGIN PAGE
// ============================================================

const btnLogin = document.getElementById('btnLogin');
if (btnLogin) {

    const USERNAME_VALID = 'etminsekolah';
    const PASSWORD_VALID = 'admin#1234';

    // Jika sudah login, langsung masuk
    if (sessionStorage.getItem('sudahLogin') === 'true') {
        window.location.href = 'index.html';
    }

    function prosesLogin() {
        const username = document.getElementById('inputUsername').value.trim();
        const password = document.getElementById('inputPassword').value;
        const errorMsg = document.getElementById('errorMsg');

        if (username === USERNAME_VALID && password === PASSWORD_VALID) {
            sessionStorage.setItem('sudahLogin', 'true');
            sessionStorage.setItem('namaAdmin', username);
            window.location.href = 'index.html';
        } else {
            errorMsg.style.display = 'block';
        }
    }

    btnLogin.addEventListener('click', prosesLogin);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') prosesLogin();
    });
}


// ============================================================
// BAGIAN 3: SPA DASHBOARD - PINDAH HALAMAN
// ============================================================

const dbPages    = ['db-Beranda', 'db-Pengumuman', 'db-KritikSaran', 'db-LaporPrasarana'];
const dbNavLinks = document.querySelectorAll('.db-nav-link');

function dbTampilkanHalaman(idHalaman) {

    // Sembunyikan semua halaman
    dbPages.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Tampilkan halaman yang dituju
    const tuju = document.getElementById(idHalaman);
    if (tuju) tuju.style.display = 'block';

    // Update active nav
    dbNavLinks.forEach(function(link) {
        link.classList.remove('active');
        if (link.dataset.target === idHalaman) {
            link.classList.add('active');
        }
    });
}

// Klik nav link
dbNavLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = this.dataset.target;
        if (target) dbTampilkanHalaman(target);
    });
});

// Klik "Lihat Semua" di stat card & preview card
document.querySelectorAll('.db-stat-link, .db-lihat-semua').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = this.dataset.target;
        if (target) dbTampilkanHalaman(target);
    });
});

// Tampilkan Beranda saat pertama buka
if (document.getElementById('db-Beranda')) {
    dbTampilkanHalaman('db-Beranda');
}

// ============================================================
// BAGIAN 4: FORM TAMBAH PENGUMUMAN
// ============================================================

const btnUmumkan = document.getElementById('btnUmumkan');
if (btnUmumkan) {
    btnUmumkan.addEventListener('click', function() {

        const tanggal  = document.getElementById('inputTanggal').value;
        const judul    = document.getElementById('inputJudul').value.trim();
        const deskripsi = document.getElementById('inputDeskripsi').value.trim();

        // Validasi
        if (!tanggal || !judul || !deskripsi) {
            alert('Semua kolom harus diisi!');
            return;
        }

        // Format tanggal → ambil hari saja untuk badge
        const tgl = new Date(tanggal);
        const hari = tgl.getDate();
        const bulanNama = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        // Buat item baru
        const itemBaru = document.createElement('div');
        itemBaru.classList.add('db-history-item');
        itemBaru.innerHTML = `
            <div class="db-date-badge">${hari}</div>
            <div class="db-news-content">
                <h4>${judul}</h4>
                <p>${deskripsi}</p>
                <span class="db-tanggal">${bulanNama}</span>
            </div>
            <button class="db-btn-hapus" title="Hapus"><i class="fas fa-trash"></i></button>
        `;

        // Tambahkan ke history list
        const historyList = document.getElementById('historyPengumuman');
        historyList.prepend(itemBaru); // taruh di paling atas

        // Bind tombol hapus pada item baru
        itemBaru.querySelector('.db-btn-hapus').addEventListener('click', function() {
            if (confirm('Hapus pengumuman ini?')) {
                itemBaru.remove();
            }
        });

        // Reset form
        document.getElementById('inputTanggal').value  = '';
        document.getElementById('inputJudul').value    = '';
        document.getElementById('inputDeskripsi').value = '';

        alert('Pengumuman berhasil ditambahkan!');
    });

    // Bind tombol hapus pada item dummy yang sudah ada
    document.querySelectorAll('#historyPengumuman .db-btn-hapus').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (confirm('Hapus pengumuman ini?')) {
                btn.closest('.db-history-item').remove();
            }
        });
    });
}