<?php

namespace EzUpload;

class Handler
{
    protected $metadata;
    protected $dir;
    protected $writer;

    public function __construct(Writer $writer, $metadataClass)
    {
        $this->metadata = $metadataClass;
        $this->writer   = $writer;
    }

    protected function error($text)
    {
        $this->send_response(['error' => $text], false);
    }

    protected function send_response(array $response, $success = true)
    {
        header("Content-Type: application/json");
        echo json_encode(compact('success', 'response'));
        exit;
    }
    
    protected function handleInitUpload()
    {
        if (empty($_POST['begin_upload'])) {
            $this->error('Missing begin_upload argument');
        }

        if (empty($_POST['size']) || $_POST['size'] <= 0) {
            $this->error('Invalid file size');
        }
        $class = $this->metadata;
        $meta  = $class::create($_POST['name'], $_POST['type'], $_POST['size'], $_POST['lastModified']);
        $this->writer->createEmptyFile($meta);
        $this->send_response([
            'file_id' => $meta->getId(),
            'chunk_limit' => $meta->getChunkSize(),
            'chunks' => $meta->getChunks(),
        ]);
    }

    protected function handleChunkUpload()
    {
        $exists = ['HTTP_X_HASH', 'HTTP_X_OFFSET', 'HTTP_X_FILE_ID'];
        foreach ($exists as $key) {
            if (!array_key_exists($key, $_SERVER)) {
                $this->error('Invalid arguments');
            }
        }
        
        try {
            $metadata = new $this->metadata($_SERVER['HTTP_X_FILE_ID']);
        } catch (\RuntimeException $e) {
            $this->error('Invalid fileId');
        }
        $hash   = $_SERVER['HTTP_X_HASH'];
        $offset = $_SERVER['HTTP_X_OFFSET'];
        if (!is_numeric($offset) || $offset < 0) {
            $this->error('Invalid offset');
        }

        $bytes = file_get_contents('php://input');
        if (hash('sha256', $bytes) !== $hash) {
            $this->error('Invalid hash');
        }

        try {
            $this->writer->writeChunk($metadata, $bytes, $offset);
        } catch (RuntimeException $e) {
            $this->error('Internal error');
        }
        $this->send_response([]);
    }

    public function main()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
            $this->handleChunkUpload();
        }
        $this->handleInitUpload();
    }
}
