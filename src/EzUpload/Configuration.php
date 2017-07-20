<?php

namespace EzUpload;

use RuntimeException;

class Configuration implements ConfigurationInterface
{
    protected $directory;
    protected $temporary;

    public function __construct($target)
    {
        if (!is_dir($target)) {
            throw new RuntimeException("$target is not a valid directory");
        }
        if (!is_writable($target)) {
            throw new RuntimeException("$target is not writable by PHP");
        }
        $this->directory = $target;
        $this->temporary = sys_get_temp_dir() . '/ezupload';
        !is_dir($this->temporary) && mkdir($this->temporary);
    }

    public function getUploadDirectory()
    {
        return $this->directory;
    }

    public function getTemporaryDirectory()
    {
        return $this->temporary;
    }

    public function shouldProcess($id, array $metadata)
    {
        file_put_contents($this->temporary . '/' . $id . '.meta', serialize($metadata));
        return true;
    }
}
