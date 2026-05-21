<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Ambil semua pengumuman ──
if ($method === 'GET') {

    $result = $conn->query("SELECT * FROM pengumuman ORDER BY created_at DESC");
    $data   = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    kirimResponse('success', 'Data pengumuman berhasil diambil', $data);
}

// ── POST: Tambah pengumuman baru ──
elseif ($method === 'POST') {

    cekLogin();

    $input     = json_decode(file_get_contents('php://input'), true);
    $tanggal   = isset($input['tanggal'])   ? trim($input['tanggal'])   : '';
    $judul     = isset($input['judul'])     ? trim($input['judul'])     : '';
    $deskripsi = isset($input['deskripsi']) ? trim($input['deskripsi']) : '';

    if (empty($judul) || empty($deskripsi)) {
        kirimResponse('error', 'Judul dan deskripsi harus diisi');
    }

    // Jika tanggal kosong, pakai tanggal hari ini
    if (empty($tanggal)) {
        $tanggal = date('Y-m-d');
    }

    $stmt = $conn->prepare("INSERT INTO pengumuman (tanggal, judul, deskripsi) VALUES (?, ?, ?)");
    $stmt->bind_param('sss', $tanggal, $judul, $deskripsi);

    if ($stmt->execute()) {
        $idBaru = $stmt->insert_id;
        $stmt->close();
        kirimResponse('success', 'Pengumuman berhasil ditambahkan', ['id' => $idBaru]);
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal menyimpan pengumuman');
    }
}

// ── PUT: Edit pengumuman ──
elseif ($method === 'PUT') {

    cekLogin();

    $input     = json_decode(file_get_contents('php://input'), true);
    $id        = isset($input['id'])        ? (int)$input['id']          : 0;
    $tanggal   = isset($input['tanggal'])   ? trim($input['tanggal'])    : '';
    $judul     = isset($input['judul'])     ? trim($input['judul'])      : '';
    $deskripsi = isset($input['deskripsi']) ? trim($input['deskripsi'])  : '';

    if ($id <= 0 || empty($judul) || empty($deskripsi)) {
        kirimResponse('error', 'Data tidak valid');
    }

    if (empty($tanggal)) {
        $tanggal = date('Y-m-d');
    }

    $stmt = $conn->prepare("UPDATE pengumuman SET tanggal=?, judul=?, deskripsi=? WHERE id=?");
    $stmt->bind_param('sssi', $tanggal, $judul, $deskripsi, $id);

    if ($stmt->execute()) {
        $stmt->close();
        kirimResponse('success', 'Pengumuman berhasil diupdate');
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal mengupdate: ' . $conn->error);
    }
}

// ── DELETE: Hapus pengumuman ──
elseif ($method === 'DELETE') {

    cekLogin();

    $input = json_decode(file_get_contents('php://input'), true);
    $id    = isset($input['id']) ? (int)$input['id'] : 0;

    if ($id <= 0) {
        kirimResponse('error', 'ID tidak valid');
    }

    $stmt = $conn->prepare("DELETE FROM pengumuman WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        $stmt->close();
        kirimResponse('success', 'Pengumuman berhasil dihapus');
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal menghapus pengumuman');
    }
}

else {
    kirimResponse('error', 'Method tidak diizinkan');
}
?>