<?php

namespace EzUpload\Metadata;

abstract class Metadata
{
    public static function generateId()
    {
        return uniqid(true);
    }

    protected static function return_bytes($val)
    {
        $val  = trim($val);
        $last = strtolower($val[strlen($val)-1]);
        $val  = substr($val, 0, -1); // necessary since PHP 7.1; otherwise optional

        switch($last) {
        case 'g':
            $val *= 1024;
        case 'm':
            $val *= 1024;
        case 'k':
            $val *= 1024;
        }
        return $val;
    }


    public static function guessChunkSize()
    {
        return min(
            self::return_bytes(ini_get('upload_max_filesize')),
            self::return_bytes(ini_get('post_max_size'))
        );
    }

    abstract public static function create($name, $type, $size, $lastModified);

    abstract public function getId();

    abstract public function getChunks();

    abstract public function getChunkSize();

    abstract public function getFileSize();

    abstract public function commitChunk($offset);

}
