<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'ruangaspirasi');

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([
        'status'  => 'error',
        'message' => 'Koneksi database gagal: ' . $conn->connect_error
    ]));
}

$conn->set_charset('utf8mb4');

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

function cekMethod($method) {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        kirimResponse('error', 'Method tidak diizinkan');
    }
}

function cekLogin() {
    session_start();
    if (!isset($_SESSION['admin_id'])) {
        http_response_code(401);
        kirimResponse('error', 'Unauthorized - Silakan login terlebih dahulu');
    }
}
?>