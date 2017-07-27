<?php

require __DIR__ . '/../vendor/autoload.php';

use EzUpload\Server;
use EzUpload\Configuration;

$server = new Server(new Configuration('/tmp/foobar'));
$server->main();
