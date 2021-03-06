import Status from './status'
import Client from './client';
import {saveAs} from 'file-saver'
import File from './file';
import Memory from './file-memory';
import sha256 from './sha256.min.js'

class Sequential_Queue {
    constructor(worker) {
        this.next_id = 0;
        this.queue = [];
        this.worker = worker;
        this.busy  = false;
    }

    queue_size() {
        return this.queue.length;
    }

    _run() {
        if (!this.busy && this.queue.length > 0 && this.next_id === this.queue[0].id) {
            this.busy = true;
            this.worker.apply(null, [this.queue.shift().data, () => {
                this.busy = false;
                ++this.next_id;
                this._run();
            }]);
        }
    }

    push(id, data) {
        this.queue.push({id, data});
        this.queue.sort((a, b) => a.id - b.id);
        this._run();
    }
}

export default class Download extends Client {
    constructor(url) {
        super(url)
        this.block_size = 2 * 1024 * 1024;
        this._writer = new Sequential_Queue((args, next) => {
            let {block, socket, bytes} = args;
            let fileWriter = this.fileWriter;
            fileWriter.once('wrote', () => {
                socket.status = Status.WAITING;
                block.status  = Status.DONE;
                this._download();
                next();
                this._maybe_is_ready();
            });
            this.decode_block(block.offset, bytes, (err, _bytes) => {
                fileWriter.write(_bytes);
            });
        });
    }

    decode_block(offset, bytes, next) {
        next(null, bytes);
    }

    // _get_filesize() {{{
    _get_filesize(xhr) {
        let size = xhr.getAllResponseHeaders().match(/content-length\s*:\s*(\d+)/i)
        return parseInt(size[1]);
    }
    // }}}

    _download_block(block, socket) {
        let xhr = this._xhr('GET', {
            'pragma':'no-cache',
            'accept': '*/*',
            'range': 'bytes=' + block.offset + '-' + (block.end-1)
        })
        xhr.getXhr().responseType = "arraybuffer";
        xhr.then(r => {
            this.transfered += r.responseText.byteLength;
            this._writer.push(block.id, {block, socket, bytes: r.responseText});
            this.progress();
        }).catch(r => {
            socket.status = Status.WAITING; // release socket slot.
            block.status = Status.WAITING
            socket.transfered = 0;
            this.progress();
            this._download();
        });
        xhr.send();
    }

    _download() {
        let socket;
        while (socket = this._get_free_socket()) {
            let h = 0;
            for (let i=0; i < this.blocks.length; ++i) {
                if (this.blocks[i].status === Status.WAITING) {
                    socket.status = Status.BUSY;
                    this.blocks[i].status = Status.LOADING;

                    this._download_block(this.blocks[i], socket);
                    h = 1;
                    break;
                }
            }
            if (!h) {
                break;
            }
        }
    }

    _is_ready() {
        this.fileWriter.finalize(file => {
            saveAs(file, this.download_file_name);
        });
    }

    download(download_file_name) {
        if (!download_file_name) {
            throw new Error("You must provide a file name for the download");
        }
        this.download_file_name = download_file_name;
        this._xhr('HEAD')
            .send()
            .then(r => {
                this.file_size = this._get_filesize(r.xhr);
                this._calculate_blocks();
                console.error(this.blocks);

                this.fileWriter = new File(sha256(this.url), this.file_size);
                this.fileWriter.on('ready', () => this._download());
                this.fileWriter.on('error', (e) => {
                    if (e === 'SECURITY_ERR') {
                        this.fileWriter = new Memory(sha256(this.url), this.file_size);
                        this.fileWriter.on('ready', () => this._download());
                        this.fileWriter.on('error', (e) => this.emit('error', e));
                        return;
                    }
                    this.emit('error', e);
                });
            });

    }
}
