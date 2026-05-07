<?php
// ================================================
// API KRITIK & SARAN
// GET    → ambil semua kritik saran
// POST   → tambah kritik saran baru (dari siswa)
// PATCH  → update status (pending/selesai)
// DELETE → hapus kritik saran
// ================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE');

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Ambil semua data ──
if ($method === 'GET') {

    $result = $conn->query("SELECT * FROM kritik_saran ORDER BY created_at DESC");
    $data   = [];

    while ($row = $result->fetch_assoc()) {
        // Ambil foto-foto milik laporan ini
        $id       = $row['id'];
        $fotoStmt = $conn->prepare("SELECT nama_file FROM foto_laporan WHERE jenis = 'kritik_saran' AND laporan_id = ?");
        $fotoStmt->bind_param('i', $id);
        $fotoStmt->execute();
        $fotoResult = $fotoStmt->get_result();

        $foto = [];
        while ($f = $fotoResult->fetch_assoc()) {
            $foto[] = $f['nama_file'];
        }
        $fotoStmt->close();

        $row['foto'] = $foto;
        $data[]      = $row;
    }

    kirimResponse('success', 'Data kritik saran berhasil diambil', $data);
}

// ── POST: Tambah kritik saran baru (dari siswa) ──
elseif ($method === 'POST') {

    $deskripsi = isset($_POST['deskripsi']) ? trim($_POST['deskripsi']) : '';

    if (empty($deskripsi)) {
        kirimResponse('error', 'Deskripsi tidak boleh kosong');
    }

    // Simpan data utama
    $stmt = $conn->prepare("INSERT INTO kritik_saran (deskripsi) VALUES (?)");
    $stmt->bind_param('s', $deskripsi);

    if (!$stmt->execute()) {
        $stmt->close();
        kirimResponse('error', 'Gagal menyimpan data');
    }

    $laporanId = $stmt->insert_id;
    $stmt->close();

    // Proses upload foto (jika ada)
    if (!empty($_FILES['foto'])) {
        $uploadDir = '../uploads/kritik_saran/';

        // Buat folder jika belum ada
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $files = $_FILES['foto'];
        $total = count($files['name']);

        for ($i = 0; $i < $total && $i < 5; $i++) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;

            // Validasi tipe file
            $tipe = mime_content_type($files['tmp_name'][$i]);
            if (!in_array($tipe, ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])) continue;

            // Buat nama file unik
            $ekstensi  = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
            $namaFile  = 'foto_' . time() . '_' . $i . '.' . $ekstensi;
            $targetPath = $uploadDir . $namaFile;

            if (move_uploaded_file($files['tmp_name'][$i], $targetPath)) {
                // Simpan nama file ke database
                $fotoStmt = $conn->prepare("INSERT INTO foto_laporan (jenis, laporan_id, nama_file) VALUES ('kritik_saran', ?, ?)");
                $fotoStmt->bind_param('is', $laporanId, $namaFile);
                $fotoStmt->execute();
                $fotoStmt->close();
            }
        }
    }

    kirimResponse('success', 'Kritik & Saran berhasil dikirim', ['id' => $laporanId]);
}

// ── PATCH: Update status ──
elseif ($method === 'PATCH') {

    cekLogin();

    $input  = json_decode(file_get_contents('php://input'), true);
    $id     = isset($input['id'])     ? (int)$input['id']       : 0;
    $status = isset($input['status']) ? trim($input['status'])   : '';

    if ($id <= 0 || !in_array($status, ['pending', 'selesai'])) {
        kirimResponse('error', 'Data tidak valid');
    }

    $stmt = $conn->prepare("UPDATE kritik_saran SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $status, $id);

    if ($stmt->execute()) {
        $stmt->close();
        kirimResponse('success', 'Status berhasil diupdate');
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal mengupdate status');
    }
}

// ── DELETE: Hapus kritik saran ──
elseif ($method === 'DELETE') {

    cekLogin();

    $input = json_decode(file_get_contents('php://input'), true);
    $id    = isset($input['id']) ? (int)$input['id'] : 0;

    if ($id <= 0) {
        kirimResponse('error', 'ID tidak valid');
    }

    // Hapus foto dari folder uploads
    $fotoStmt = $conn->prepare("SELECT nama_file FROM foto_laporan WHERE jenis = 'kritik_saran' AND laporan_id = ?");
    $fotoStmt->bind_param('i', $id);
    $fotoStmt->execute();
    $fotoResult = $fotoStmt->get_result();

    while ($f = $fotoResult->fetch_assoc()) {
        $path = '../uploads/kritik_saran/' . $f['nama_file'];
        if (file_exists($path)) unlink($path);
    }
    $fotoStmt->close();

    // Hapus dari tabel foto_laporan
    $stmt = $conn->prepare("DELETE FROM foto_laporan WHERE jenis = 'kritik_saran' AND laporan_id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();

    // Hapus dari tabel utama
    $stmt = $conn->prepare("DELETE FROM kritik_saran WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        $stmt->close();
        kirimResponse('success', 'Data berhasil dihapus');
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal menghapus data');
    }
}

else {
    kirimResponse('error', 'Method tidak diizinkan');
}
?>