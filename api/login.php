<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

session_start();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {

    if (isset($_SESSION['admin_id'])) {
        kirimResponse('success', 'Sudah login', [
            'username' => $_SESSION['admin_username'],
            'role'     => $_SESSION['admin_role']
        ]);
    }

    $input    = json_decode(file_get_contents('php://input'), true);
    $username = isset($input['username']) ? trim($input['username']) : '';
    $password = isset($input['password']) ? $input['password']       : '';

    if (empty($username) || empty($password)) {
        kirimResponse('error', 'Username dan password harus diisi');
    }

    $stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = ?");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();
    $stmt->close();

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        kirimResponse('error', 'Username atau password salah');
    }

    $_SESSION['admin_id']       = $user['id'];
    $_SESSION['admin_username'] = $user['username'];
    $_SESSION['admin_role']     = $user['role'];

    kirimResponse('success', 'Login berhasil', [
        'username' => $user['username'],
        'role'     => $user['role']
    ]);
}

elseif ($method === 'DELETE') {
    session_destroy();
    kirimResponse('success', 'Logout berhasil');
}

else {
    kirimResponse('error', 'Method tidak diizinkan');
}
?>