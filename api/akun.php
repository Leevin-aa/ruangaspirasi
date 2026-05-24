<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

session_start();

// Hanya superadmin yang bisa akses
function cekSuperAdmin() {
    if (!isset($_SESSION['admin_role']) || $_SESSION['admin_role'] !== 'superadmin') {
        http_response_code(403);
        kirimResponse('error', 'Akses ditolak');
    }
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Ambil semua akun admin ──
if ($method === 'GET') {
    cekSuperAdmin();

    $result = $conn->query("SELECT id, username, role, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC");
    $data   = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    kirimResponse('success', 'Data akun', $data);
}

// ── POST: Buat akun baru ──
elseif ($method === 'POST') {
    cekSuperAdmin();

    $input    = json_decode(file_get_contents('php://input'), true);
    $username = isset($input['username']) ? trim($input['username']) : '';
    $password = isset($input['password']) ? $input['password']       : '';

    if (empty($username) || empty($password)) {
        kirimResponse('error', 'Username dan password harus diisi');
    }

    if (strlen($password) < 6) {
        kirimResponse('error', 'Password minimal 6 karakter');
    }

    // Cek duplikat username
    $cek = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $cek->bind_param('s', $username);
    $cek->execute();
    $cek->store_result();
    if ($cek->num_rows > 0) {
        $cek->close();
        kirimResponse('error', 'Username sudah digunakan');
    }
    $cek->close();

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $conn->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')");
    $stmt->bind_param('ss', $username, $hash);

    if ($stmt->execute()) {
        $idBaru = $stmt->insert_id;
        $stmt->close();
        kirimResponse('success', 'Akun berhasil dibuat', ['id' => $idBaru]);
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal membuat akun');
    }
}

// ── PUT: Edit akun ──
elseif ($method === 'PUT') {
    cekSuperAdmin();

    $input       = json_decode(file_get_contents('php://input'), true);
    $id          = isset($input['id'])          ? (int)$input['id']           : 0;
    $username    = isset($input['username'])    ? trim($input['username'])    : '';
    $passwordBaru = isset($input['password'])   ? $input['password']          : '';

    if ($id <= 0 || empty($username)) {
        kirimResponse('error', 'Data tidak valid');
    }

    // Cek duplikat username (kecuali diri sendiri)
    $cek = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $cek->bind_param('si', $username, $id);
    $cek->execute();
    $cek->store_result();
    if ($cek->num_rows > 0) {
        $cek->close();
        kirimResponse('error', 'Username sudah digunakan');
    }
    $cek->close();

    if (!empty($passwordBaru)) {
        if (strlen($passwordBaru) < 6) {
            kirimResponse('error', 'Password minimal 6 karakter');
        }
        $hash = password_hash($passwordBaru, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("UPDATE users SET username=?, password=? WHERE id=? AND role='admin'");
        $stmt->bind_param('ssi', $username, $hash, $id);
    } else {
        $stmt = $conn->prepare("UPDATE users SET username=? WHERE id=? AND role='admin'");
        $stmt->bind_param('si', $username, $id);
    }

    if ($stmt->execute()) {
        $stmt->close();
        kirimResponse('success', 'Akun berhasil diupdate');
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal mengupdate akun');
    }
}

// ── DELETE: Hapus akun ──
elseif ($method === 'DELETE') {
    cekSuperAdmin();

    $input = json_decode(file_get_contents('php://input'), true);
    $id    = isset($input['id']) ? (int)$input['id'] : 0;

    if ($id <= 0) {
        kirimResponse('error', 'ID tidak valid');
    }

    $stmt = $conn->prepare("DELETE FROM users WHERE id=? AND role='admin'");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        $stmt->close();
        kirimResponse('success', 'Akun berhasil dihapus');
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal menghapus akun');
    }
}

// ── PATCH: Update profil sendiri ──
elseif ($method === 'PATCH') {

    if (!isset($_SESSION['admin_id'])) {
        http_response_code(401);
        kirimResponse('error', 'Belum login');
    }

    $input        = json_decode(file_get_contents('php://input'), true);
    $username     = isset($input['username'])     ? trim($input['username'])     : '';
    $passwordLama = isset($input['passwordLama']) ? $input['passwordLama']       : '';
    $passwordBaru = isset($input['passwordBaru']) ? $input['passwordBaru']       : '';

    if (empty($username)) {
        kirimResponse('error', 'Username tidak boleh kosong');
    }

    $id = $_SESSION['admin_id'];

    // Ambil data user saat ini
    $stmt = $conn->prepare("SELECT username, password FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Jika mau ganti password
    if (!empty($passwordBaru)) {
        if (empty($passwordLama)) {
            kirimResponse('error', 'Password lama harus diisi untuk mengganti password');
        }
        if (!password_verify($passwordLama, $user['password'])) {
            kirimResponse('error', 'Password lama salah');
        }
        if (strlen($passwordBaru) < 6) {
            kirimResponse('error', 'Password baru minimal 6 karakter');
        }

        $hash = password_hash($passwordBaru, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("UPDATE users SET username=?, password=? WHERE id=?");
        $stmt->bind_param('ssi', $username, $hash, $id);
    } else {
        $stmt = $conn->prepare("UPDATE users SET username=? WHERE id=?");
        $stmt->bind_param('si', $username, $id);
    }

    if ($stmt->execute()) {
        $stmt->close();
        $_SESSION['admin_username'] = $username;
        kirimResponse('success', 'Profil berhasil diupdate', ['username' => $username]);
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal mengupdate profil');
    }
}

else {
    kirimResponse('error', 'Method tidak diizinkan');
}
?>