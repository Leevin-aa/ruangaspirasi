<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // ganti sesuai user MySQL kamu
define('DB_PASS', '');           // ganti sesuai password MySQL kamu
define('DB_NAME', 'ruangaspirasi');

// Buat koneksi
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Cek jika koneksi gagal
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([
        'status'  => 'error',
        'message' => 'Koneksi database gagal: ' . $conn->connect_error
    ]));
}

// Set charset agar karakter Indonesia tidak error
$conn->set_charset('utf8mb4');

// Kirim response JSON
function kirimResponse($status, $message, $data = null) {
    header('Content-Type: application/json');
    $response = [
        'status'  => $status,
        'message' => $message
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

// Cek apakah request method sesuai
function cekMethod($method) {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        kirimResponse('error', 'Method tidak diizinkan');
    }
}

// Cek session login (untuk proteksi API dashboard)
function cekLogin() {
    session_start();
    if (!isset($_SESSION['admin_id'])) {
        http_response_code(401);
        kirimResponse('error', 'Unauthorized - Silakan login terlebih dahulu');
    }
}
?>