<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit;
}

$method = $_SERVER['REQUEST_METHOD'];


// ── GET: Ambil semua kata blacklist ──
if ($method === 'GET') {

    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if ($action === 'list') {
        $result = $conn->query("SELECT id, kata FROM kata_blacklist ORDER BY kata ASC");
        $data   = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        kirimResponse('success', 'Data blacklist', $data);
    }

    // Cek teks (untuk web utama - POST saja, tapi fallback ke GET jika perlu)
    kirimResponse('error', 'Action tidak valid');
}


// ── POST: Tambah kata baru ATAU cek teks ──
elseif ($method === 'POST') {

    $input = json_decode(file_get_contents('php://input'), true);

    // Jika ada 'kata' → tambah ke blacklist (dari dashboard)
    if (isset($input['kata'])) {

        cekLogin();

        $kata = strtolower(trim($input['kata']));

        if (empty($kata)) {
            kirimResponse('error', 'Kata tidak boleh kosong');
        }

        // Cek duplikat
        $cek = $conn->prepare("SELECT id FROM kata_blacklist WHERE kata = ?");
        $cek->bind_param('s', $kata);
        $cek->execute();
        $cek->store_result();

        if ($cek->num_rows > 0) {
            $cek->close();
            kirimResponse('error', 'Kata sudah ada di blacklist');
        }
        $cek->close();

        $stmt = $conn->prepare("INSERT INTO kata_blacklist (kata) VALUES (?)");
        $stmt->bind_param('s', $kata);

        if ($stmt->execute()) {
            $idBaru = $stmt->insert_id;
            $stmt->close();
            kirimResponse('success', 'Kata berhasil ditambahkan', ['id' => $idBaru]);
        } else {
            $stmt->close();
            kirimResponse('error', 'Gagal menyimpan kata');
        }
    }

    // Jika ada 'teks' → cek blacklist (dari web utama)
    elseif (isset($input['teks'])) {

        $teks = $input['teks'];

        if (empty($teks)) {
            kirimResponse('ok', 'Teks kosong', ['aman' => true, 'kata_terlarang' => []]);
        }

        function normalisasiTeks($teks) {
            $teks = strtolower($teks);
            $ganti = [
                '0'=>'o','1'=>'i','3'=>'e','4'=>'a','5'=>'s',
                '7'=>'t','8'=>'b','@'=>'a','$'=>'s','!'=>'i',
                '+'=>'t','|'=>'i'
            ];
            $teks = str_replace(array_keys($ganti), array_values($ganti), $teks);
            $teks = preg_replace('/[^a-z\s]/', '', $teks);
            $teksTanpaSpasi = preg_replace('/\s+/', '', $teks);
            return ['normal' => $teks, 'tanpa_spasi' => $teksTanpaSpasi];
        }

        $result          = $conn->query("SELECT kata FROM kata_blacklist");
        $daftarBlacklist = [];
        while ($row = $result->fetch_assoc()) {
            $daftarBlacklist[] = strtolower(trim($row['kata']));
        }

        $hasil      = normalisasiTeks($teks);
        $normal     = $hasil['normal'];
        $tanpaSpasi = $hasil['tanpa_spasi'];

        $kataTermukan = [];

        foreach ($daftarBlacklist as $kataBlacklist) {
            $sudah = false;

            if (strpos($normal, $kataBlacklist) !== false) {
                $kataTermukan[] = $kataBlacklist; $sudah = true;
            }
            if (!$sudah && strpos($tanpaSpasi, $kataBlacklist) !== false) {
                $kataTermukan[] = $kataBlacklist; $sudah = true;
            }
            if (!$sudah) {
                foreach (explode(' ', $normal) as $kataSatu) {
                    if (strlen($kataSatu) < 3) continue;
                    similar_text($kataSatu, $kataBlacklist, $persen);
                    if ($persen >= 80) {
                        $kataTermukan[] = $kataBlacklist; $sudah = true; break;
                    }
                }
            }
        }

        $kataTermukan = array_values(array_unique($kataTermukan));

        if (!empty($kataTermukan)) {
            kirimResponse('ok', 'Teks mengandung kata terlarang', [
                'aman' => false, 'kata_terlarang' => $kataTermukan
            ]);
        } else {
            kirimResponse('ok', 'Teks aman', ['aman' => true, 'kata_terlarang' => []]);
        }
    }

    else {
        kirimResponse('error', 'Data tidak valid');
    }
}


// ── DELETE: Hapus kata dari blacklist ──
elseif ($method === 'DELETE') {

    cekLogin();

    $input = json_decode(file_get_contents('php://input'), true);
    $id    = isset($input['id']) ? (int)$input['id'] : 0;

    if ($id <= 0) {
        kirimResponse('error', 'ID tidak valid');
    }

    $stmt = $conn->prepare("DELETE FROM kata_blacklist WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        $stmt->close();
        kirimResponse('success', 'Kata berhasil dihapus');
    } else {
        $stmt->close();
        kirimResponse('error', 'Gagal menghapus kata');
    }
}

else {
    kirimResponse('error', 'Method tidak diizinkan');
}
?>