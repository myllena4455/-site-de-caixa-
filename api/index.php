<?php
// api/index.php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normaliza base path /api
$path = $uri;
if (($pos = strpos($path, '/api')) !== false) {
    $path = substr($path, $pos + 4); // remove '/api'
}
$path = '/' . ltrim($path, '/');

// -------- AUTH --------
if ($method === 'POST' && $path === '/auth/register') {
    $body = json_input();
    require_fields($body, ['name','email','password']);
    $pdo = DB::pdo();
    // e-mail único
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$body['email']]);
    if ($stmt->fetch()) {
        send_json(['message'=>'E-mail já cadastrado'], 409);
    }
    $hash = password_hash($body['password'], PASSWORD_DEFAULT);
    $ins = $pdo->prepare("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)");
    $ins->execute([$body['name'], $body['email'], $hash]);
    send_json(['message'=>'Usuário registrado com sucesso']);
}

if ($method === 'POST' && $path === '/auth/login') {
    $body = json_input();
    require_fields($body, ['email','password']);
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT id,name,email,password_hash FROM users WHERE email = ?");
    $stmt->execute([$body['email']]);
    $u = $stmt->fetch();
    if (!$u || !password_verify($body['password'], $u['password_hash'])) {
        send_json(['message'=>'Credenciais inválidas'], 401);
    }
    unset($u['password_hash']);
    send_json(['message'=>'Login ok', 'user'=>$u]);
}

// -------- PRODUCTS --------
if ($method === 'GET' && $path === '/products') {
    $pdo = DB::pdo();
    $rows = $pdo->query("SELECT id, name, price, stock FROM products ORDER BY name")->fetchAll();
    send_json(['products'=>$rows]);
}

if ($method === 'DELETE' && preg_match('#^/products/([^/]+)$#', $path, $m)) {
    $id = $m[1];
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);
    send_json(['message'=>'Produto removido']);
}
// -------- PRODUCTS --------

// LISTAR
if ($method === 'GET' && $path === '/products') {
    $pdo = DB::pdo();
    $rows = $pdo->query("SELECT id, name, price, stock FROM products ORDER BY name")->fetchAll();
    send_json(['products'=>$rows]);
}

// CRIAR/ATUALIZAR (o front usa POST /api/products)
if ($method === 'POST' && $path === '/products') {
    $b = json_input();
    require_fields($b, ['id','name','price','stock']);
    $pdo = DB::pdo();

    // upsert: cria se não existe, atualiza se já existe
    $stmt = $pdo->prepare("
        INSERT INTO products (id, name, price, stock)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            price = VALUES(price),
            stock = VALUES(stock)
    ");
    $stmt->execute([
        $b['id'],
        $b['name'],
        floatval($b['price']),
        intval($b['stock'])
    ]);

    send_json(['message' => 'Produto salvo com sucesso']);
}

// REMOVER
if ($method === 'DELETE' && preg_match('#^/products/([^/]+)$#', $path, $m)) {
    $id = $m[1];
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$id]);
    send_json(['message'=>'Produto removido']);
}

// -------- SALES --------
if ($method === 'POST' && $path === '/sales/finish') {
    $body = json_input();
    require_fields($body, ['items','total','payment_method']);
    $discount = isset($body['discount']) ? floatval($body['discount']) : 0.0;
    $pdo = DB::pdo();
    $pdo->beginTransaction();
    try {
        $sale_id = bin2hex(random_bytes(8));
        $insSale = $pdo->prepare("INSERT INTO sales (id, sale_date, total, payment_method, discount) VALUES (?, NOW(), ?, ?, ?)");
        $insSale->execute([$sale_id, $body['total'], $body['payment_method'], $discount]);

        $insItem = $pdo->prepare("INSERT INTO sale_items (sale_id, product_id, quantity, price_unit) VALUES (?,?,?,?)");
        $updStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

        foreach ($body['items'] as $it) {
            $pid = $it['product_id'];
            $qty = intval($it['quantity']);
            $price = floatval($it['price_unit']);
            $insItem->execute([$sale_id, $pid, $qty, $price]);
            $updStock->execute([$qty, $pid]);
        }

        $pdo->commit();
        send_json([
            'message' => 'Venda finalizada',
            'sale' => [
                'id' => $sale_id,
                'total' => $body['total'],
                'payment_method' => $body['payment_method'],
                'discount' => $discount,
                'items' => $body['items']
            ]
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        send_json(['message'=>'Erro ao finalizar venda','error'=>$e->getMessage()], 500);
    }
}

if ($method === 'GET' && $path === '/sales/report') {
    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;
    $pdo = DB::pdo();
    $sql = "SELECT id, sale_date, total, payment_method, discount FROM sales";
    $params = [];
    if ($from && $to) {
        $sql .= " WHERE sale_date BETWEEN ? AND ?";
        $params = [$from . " 00:00:00", $to . " 23:59:59"];
    }
    $sql .= " ORDER BY sale_date DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    send_json(['sales'=>$rows]);
}

send_json(['message'=>'Rota não encontrada','path'=>$path], 404);
