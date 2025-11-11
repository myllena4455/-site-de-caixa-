<?php
// config/db.php
// Preencha com os dados do banco MySQL fornecidos pela InfinityFree (painel -> MySQL Databases).
class DB {
    public static function pdo(): PDO {
        static $pdo = null;
        if ($pdo) return $pdo;
        $host = 'sql212.infinityfree.com';      // MySQL Hostname
        $db   = 'if0_40131870_lkimports';       // MySQL Database Name
        $user = 'if0_40131870';                 // MySQL Username
        $pass =  'myllena1234567';               // MySQL Password
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
