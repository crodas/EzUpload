<?php

namespace EzUpload\Metadata;

use RuntimeException;

class File extends Metadata
{
    protected static $dir = '/tmp';
    protected $metadata;
    protected $fileId;

    public function __construct($fileId)
    {
        $file = self::$dir . "/" . basename($fileId) . ".meta";
        if (!is_file($file)) {
            throw new RuntimeException("Invalid fileId");
        }
        $this->metadata = json_decode(file_get_contents($file));
        $this->fileId   = $fileId;
    }

    public function getId()
    {
        return $this->metadata->fileId;
    }

    public function getChunks()
    {
        return $this->metadata->chunks;
    }

    public function getChunkSize()
    {
        return $this->metadata->chunk_size;
    }

    public function getFileSize()
    {
        return $this->metadata->size;
    }

    public function commitChunk($offset)
    {
        $fp = fopen(self::$dir . "/{$this->fileId}.map", 'r+b');
        if (!flock($fp, LOCK_EX)) {
            throw new RuntimeException('Cannot lock file');
        }
        fseek($fp, $offset);
        fwrite($fp, '*');
        fclose($fp);
    }

    public static function create($name, $type, $size, $lastModified)
    {
        $fileId = self::generateId();
        $chunk_size = self::guessChunkSize();
        $chunks = ceil($size / $chunk_size);
        $metadata = compact('fileId', 'name', 'type', 'size', 'lastModified', 'chunks', 'chunk_size');
        file_put_contents(self::$dir . "/$fileId.map", str_repeat('.', $chunks), LOCK_EX);
        file_put_contents(self::$dir . "/$fileId.meta", json_encode($metadata), LOCK_EX);
        return new self($fileId);
    }
}
