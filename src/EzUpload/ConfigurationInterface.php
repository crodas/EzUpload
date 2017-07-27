<?php

namespace EzUpload;

interface ConfigurationInterface
{
    public function getUploadDirectory();

    public function getTemporaryDirectory();

    public function shouldProcess($id, array $metadata);
}
