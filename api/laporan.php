<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE');

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {

    $result = $conn->query("SELECT * FROM laporan_prasarana ORDER BY created_at DESC");
    $data   = [];

    while ($row = $result->fetch_assoc()) {
        $id       = $row['id'];
        $fotoStmt = $conn->prepare("SELECT nama_file FROM foto_laporan WHERE jenis = 'laporan_prasarana' AND laporan_id = ?");
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

    kirimResponse('success', 'Data laporan prasarana berhasil diambil', $data);
}

elseif ($method === 'POST') {

    $deskripsi = isset($_POST['deskripsi']) ? trim($_POST['deskripsi']) : '';

    if (empty($deskripsi)) {
        kirimResponse('error', 'Deskripsi tidak boleh kosong');
    }

    $stmt = $conn->prepare("INSERT INTO laporan_prasarana (deskripsi) VALUES (?)");
    $stmt->bind_param('s', $deskripsi);

    if (!$stmt->execute()) {
        $stmt->close();
        kirimResponse('error', 'Gagal menyimpan data');
    }

    $laporanId = $stmt->insert_id;
    $stmt->close();

    if (!empty($_FILES['foto'])) {
        $uploadDir = '../uploads/laporan_prasarana/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $files = $_FILES['foto'];
        $total = count($files['name']);

        for ($i = 0; $i < $total && $i < 5; $i++) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;

            $tipe = mime_content_type($files['tmp_name'][$i]);
            if (!in_array($tipe, ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])) continue;

            $ekstensi   = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
            $namaFile   = 'foto_' . time() . '_' . $i . '.' . $ekstensi;
            $targetPath = $uploadDir . $namaFile;

            if (move_uploaded_file($files['tmp_name'][$i], $targetPath)) {
                $fotoStmt = $conn->prepare("INSERT INTO foto_laporan (jenis, laporan_id, nama_file) VALUES ('laporan_prasarana', ?, ?)");
                $fotoStmt->bind_param('is', $laporanId, $namaFile);
                $fotoStmt->execute();
                $fotoStmt->close();
            }
        }
    }

    kirimResponse('success', 'Laporan Prasarana berhasil dikirim', ['id' => $laporanId]);
}

elseif ($method === 'PATCH') {

    cekLogin();

    $input  = json_decode(file_get_contents('php://input'), true);
    $id     = isset($input['id'])     ? (int)$input['id']     : 0;
    $status = isset($input['status']) ? trim($input['status']) : '';

    if ($id <= 0 || !in_array($status, ['pending', 'selesai'])) {
        kirimResponse('error', 'Data tidak valid');
    }

    $stmt = $conn->prepare("UPDATE laporan_prasarana SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $status, $id);

    if ($stmt->execute()) {
        $stmt->close();
        kirimResponse('success', 'Status berhasil diupdate');
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal mengupdate status');
    }
}

elseif ($method === 'DELETE') {

    cekLogin();

    $input = json_decode(file_get_contents('php://input'), true);
    $id    = isset($input['id']) ? (int)$input['id'] : 0;

    if ($id <= 0) {
        kirimResponse('error', 'ID tidak valid');
    }

    $fotoStmt = $conn->prepare("SELECT nama_file FROM foto_laporan WHERE jenis = 'laporan_prasarana' AND laporan_id = ?");
    $fotoStmt->bind_param('i', $id);
    $fotoStmt->execute();
    $fotoResult = $fotoStmt->get_result();

    while ($f = $fotoResult->fetch_assoc()) {
        $path = '../uploads/laporan_prasarana/' . $f['nama_file'];
        if (file_exists($path)) unlink($path);
    }
    $fotoStmt->close();

    $stmt = $conn->prepare("DELETE FROM foto_laporan WHERE jenis = 'laporan_prasarana' AND laporan_id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM laporan_prasarana WHERE id = ?");
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