<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {

    $result = $conn->query("SELECT * FROM pengumuman ORDER BY tanggal DESC");
    $data   = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    kirimResponse('success', 'Data pengumuman berhasil diambil', $data);
}

elseif ($method === 'POST') {

    cekLogin();

    $input    = json_decode(file_get_contents('php://input'), true);
    $tanggal  = isset($input['tanggal'])  ? trim($input['tanggal'])  : '';
    $judul    = isset($input['judul'])    ? trim($input['judul'])    : '';
    $deskripsi = isset($input['deskripsi']) ? trim($input['deskripsi']) : '';

    if (empty($tanggal) || empty($judul) || empty($deskripsi)) {
        kirimResponse('error', 'Semua kolom harus diisi');
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