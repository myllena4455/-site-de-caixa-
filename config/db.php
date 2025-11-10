<?php
// config/db.php
// Preencha com os dados do banco MySQL fornecidos pela InfinityFree (painel -> MySQL Databases).
class DB {
    public static function pdo(): PDO {
        static $pdo = null;
        if ($pdo) return $pdo;
        $host = getenv('DB_HOST') ?: 'sqlXXX.epizy.com'; // substitua
        $db   = getenv('DB_NAME') ?: 'epiz_xxxxxx_app';
        $user = getenv('DB_USER') ?: 'epiz_xxxxxx';
        $pass = getenv('DB_PASS') ?: 'SUA_SENHA_AQUI';
        $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
        $opts = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, $user, $pass, $opts);
        return $pdo;
    }
}
