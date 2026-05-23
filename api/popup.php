<?php
// api/popup.php — CRUD gambar popup
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Buat tabel jika belum ada
// $conn->query("CREATE TABLE IF NOT EXISTS popup_images (
//     id         INT AUTO_INCREMENT PRIMARY KEY,
//     nama_file  VARCHAR(255) NOT NULL,
//     urutan     INT DEFAULT 0,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// )");

// Pastikan folder upload ada
$uploadDir = '../uploads/popup/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: ambil semua gambar popup ──
if ($method === 'GET') {
    $result = $conn->query("SELECT * FROM popup_images ORDER BY urutan ASC, created_at ASC");
    $data   = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode(['status' => 'success', 'data' => $data]);
    exit;
}

// ── POST: upload gambar baru ──
if ($method === 'POST') {
    if (empty($_FILES['foto'])) {
        echo json_encode(['status' => 'error', 'message' => 'Tidak ada file yang diupload']);
        exit;
    }

    $files        = $_FILES['foto'];
    $berhasil     = [];
    $gagal        = [];
    $MAKS_SIZE    = 2 * 1024 * 1024; // 2MB
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    // Ambil urutan terakhir
    $resUrutan  = $conn->query("SELECT COALESCE(MAX(urutan), 0) + 1 AS next_urutan FROM popup_images");
    $rowUrutan  = $resUrutan->fetch_assoc();
    $nextUrutan = (int)$rowUrutan['next_urutan'];

    // Normalisasi $_FILES array (single atau multiple)
    $fileCount = is_array($files['name']) ? count($files['name']) : 1;

    for ($i = 0; $i < $fileCount; $i++) {
        $nama    = is_array($files['name'])     ? $files['name'][$i]     : $files['name'];
        $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $size    = is_array($files['size'])     ? $files['size'][$i]     : $files['size'];
        $error   = is_array($files['error'])    ? $files['error'][$i]    : $files['error'];

        if ($error !== UPLOAD_ERR_OK) {
            $gagal[] = $nama . ' (upload error)';
            continue;
        }

        if ($size > $MAKS_SIZE) {
            $mb      = round($size / (1024 * 1024), 1);
            $gagal[] = $nama . ' (' . $mb . 'MB, melebihi 2MB)';
            continue;
        }

        // Deteksi MIME dari file asli
        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($tmpName);

        if (!in_array($mimeType, $allowedTypes)) {
            $gagal[] = $nama . ' (bukan gambar yang didukung)';
            continue;
        }

        $ext      = strtolower(pathinfo($nama, PATHINFO_EXTENSION));
        $namaFile = 'popup_' . time() . '_' . $i . '.' . $ext;
        $dest     = $uploadDir . $namaFile;

        if (move_uploaded_file($tmpName, $dest)) {
            $namaFileSafe = $conn->real_escape_string($namaFile);
            $conn->query("INSERT INTO popup_images (nama_file, urutan) VALUES ('$namaFileSafe', $nextUrutan)");
            $berhasil[] = ['id' => $conn->insert_id, 'nama_file' => $namaFile];
            $nextUrutan++;
        } else {
            $gagal[] = $nama . ' (gagal menyimpan file)';
        }
    }

    echo json_encode([
        'status'   => 'success',
        'berhasil' => $berhasil,
        'gagal'    => $gagal
    ]);
    exit;
}

// ── DELETE: hapus gambar ──
if ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id   = isset($body['id']) ? (int)$body['id'] : 0;

    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'ID tidak valid']);
        exit;
    }

    // Ambil nama file dulu
    $result = $conn->query("SELECT nama_file FROM popup_images WHERE id = $id");
    $row    = $result->fetch_assoc();

    if (!$row) {
        echo json_encode(['status' => 'error', 'message' => 'Data tidak ditemukan']);
        exit;
    }

    // Hapus file fisik
    $filePath = $uploadDir . $row['nama_file'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    // Hapus dari DB
    $conn->query("DELETE FROM popup_images WHERE id = $id");

    echo json_encode(['status' => 'success', 'message' => 'Gambar berhasil dihapus']);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan']);