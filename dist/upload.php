<?php

require __DIR__ . '/../vendor/autoload.php';

use EzUpload\Metadata\File;
use EzUpload\Handler;
use EzUpload\Writer;

$server = new Handler(new Writer('/tmp/dir'), File::class);
$server->main();
