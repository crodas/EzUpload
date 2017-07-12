<?php

namespace EzUpload;

use EzUpload\Metadata\Metadata;
use RuntimeException;

class Writer
{
    protected $dir;

    public function __construct($dir)
    {
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $this->dir = $dir;
    }

    public function createEmptyFile(Metadata $metadata)
    {
        $filename = $this->dir . '/' . $metadata->getId();
        $fp = fopen($filename, "w+");
        fseek($fp, $metadata->getFileSize() - 1, SEEK_CUR);
        fwrite($fp, 'a');
        fclose($fp);
    }

    public function writeChunk(Metadata $metadata, $bytes, $chunk)
    {
        $fp = fopen($this->dir . '/' . $metadata->getId(), 'r+b');
        if (!flock($fp, LOCK_EX)) {
            throw new RuntimeException('Cannot lock file');
        }
        fseek($fp, $metadata->getChunkSize() * $chunk, SEEK_SET);
        fwrite($fp, $bytes);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        $metadata->commitChunk($chunk);
    }
}
