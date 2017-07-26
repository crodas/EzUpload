<?php

namespace EzUpload;

use ConcurrentFileWriter\ConcurrentFileWriter;

class Server
{
    protected $config;

    public function __construct(ConfigurationInterface $config)
    {
        $this->config = $config;
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
    
    protected function chunkSize()
    {
        return min(
            self::return_bytes(ini_get('upload_max_filesize')),
            self::return_bytes(ini_get('post_max_size'))
        );
    }
    
    protected function handlePost()
    {
        if (empty($_POST['action'])) {
            $this->error('Missing action');
        }
        switch ($_POST['action']) {
        case 'begin-upload':
            $this->handleInitUpload();
            break;
        case 'finish':
            $this->handleFinishUpload();
        default:
            $this->Error('Invalid action');
        }
    }

    protected function handleFinishUpload()
    {
        $this->requireData('HTTP_X_FILE_ID');
        $tmp = $this->config->getTemporaryDirectory();
        $writer = new ConcurrentFileWriter(
            $this->config->getUploadDirectory() . '/' . basename($_SERVER['HTTP_X_FILE_ID']),
            $this->config->getTemporaryDirectory()
        );
        $this->send_response(['finished' => $writer->finalize()]);
    }

    protected function handleInitUpload()
    {
        if (empty($_POST['size']) || $_POST['size'] <= 0) {
            $this->error('Invalid file size');
        }

        $id   = $this->config->generateUploadId();
        $meta = array_intersect_key($_POST, ['name' => 1, 'type' => 1, 'size' => 1, 'lastModified' => 1]); 

        if (!$this->config->shouldProcess($id, $meta)) {
            throw new RuntimeException("cannot process upload");
        }

        $writer = new ConcurrentFileWriter(
            $this->config->getUploadDirectory() . '/' . $id,
            $this->config->getTemporaryDirectory()
        );
        $writer->create();
        $this->send_response([
            'file_id' => $id,
            'min_chunk_size' => min($this->chunkSize() / 2, 1024 * 1024),
            'chunk_limit' => $this->chunkSize(),
        ]);
    }

    protected function requireData($fields)
    {
        foreach ((array)$fields as $key) {
            if (!array_key_exists($key, $_SERVER)) {
                $this->error('Invalid arguments (' . $key . ')');
            }
        }
    }

    protected function handleChunkUpload()
    {
        $this->requireData(['HTTP_X_HASH', 'HTTP_X_OFFSET', 'HTTP_X_FILE_ID']);

        $tmp = $this->config->getTemporaryDirectory();
        $writer = new ConcurrentFileWriter(
            $this->config->getUploadDirectory() . '/' . basename($_SERVER['HTTP_X_FILE_ID']),
            $this->config->getTemporaryDirectory()
        );

        $hash   = $_SERVER['HTTP_X_HASH'];
        $offset = $_SERVER['HTTP_X_OFFSET'];
        if (!is_numeric($offset) || $offset < 0) {
            $this->error('Invalid offset');
        }

        $offset = (int)$offset;

        $fp = fopen('php://input', 'r');
        $chunk = $writer->write($offset, $fp);
        fclose($fp);

        $end = $offset + filesize($chunk->getFileName());

        if (hash_file('sha256', $chunk->getFileName()) !== $hash) {
            unlink($chunk->getFileName());
            $this->error('Invalid hash');
        }

        $this->send_response(compact('hash', 'offset', 'end'));
    }

    public function main()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
            $this->handleChunkUpload();
        }
        $this->handlePost();
    }
}
