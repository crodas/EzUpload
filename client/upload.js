import Event from 'tiny-emitter';
import {array, build_http_query} from './utils'
import Queue from './queue';

const WAITING = 1;
const LOADING = 2;
const UPLOAD  = 3;
const BUSY = 4;
const DONE = 5;

if (typeof Promise !== "function") {
    throw new Error("This browser does not have any promisse. Please load bluebird first");
}

export class Upload extends Event {
    constructor(file, url, hash = window.sha256) {
        super();
        if (typeof hash !== "function") {
            throw new Error("The hash is not a valid function");
        }
        this.file = file;
        this.hash = hash;
        this.url  = url;
        this.max_block_size = 1024 * 1024;
        this.file_size  = file.size;

        // The file is split into blocks which are uploaded. This is a "map"
        // which contains information about the file block. We just read up to 
        // 4 blocks at a time. So at most we would have 4MB of a file in RAM at 
        // most.
        this.blocks = [];

        // "Sockets". This is not really any socket, just an array which represents
        // a request which is going on.
        let id = 0;
        this.sockets = Array(4).fill(1).map(m => { return {status: WAITING, block: 0, id: id++} });

        this.file_reader = new Queue((args, next) => {
            let {socket, block} = args;
            
            if (block.blob) {
                this._upload_block(socket, block);
                return next();
            }

            let reader = new FileReader;
            reader.onloadend = evt => {
                let target = evt.target;
                if (target.readyState === FileReader.DONE) {
                    this.transform_block(block.offset, target.result, (err, bytes) => {
                        if (err) bytes = target.result;
                        block.blob = bytes;
                        block.real_size = block.blob.byteLength;
                        if (block.id === 0) {
                            block.real_offset = 0;
                        } else {
                            let prevBlock = this.blocks[block.id-1];
                            block.real_offset = prevBlock.real_size + prevBlock.real_offset;
                        }

                        this._upload_block(socket, block);
                        next();
                    });
                }
            };
            reader.readAsArrayBuffer(this.file.slice(block.offset, block.end))
        }, 1);

    }

    // Last change to transform a block Nbefore uploading
    transform_block(offset, bytes, next) {
        next(null, bytes);
    }

    _xhr(action, headers = {}) {
        let xhr = new XMLHttpRequest;
        xhr.open(action, this.url, true);
        if (this.file_id) {
            headers['X-FILE-ID'] = this.file_id;
        }
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        for (let header in headers) {
            if (headers.hasOwnProperty(header)) {
                xhr.setRequestHeader(header, headers[header]);
            }
        }

        let promise = new Promise((resolve, reject) => {
            xhr.onload = () => {
                resolve({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    xhr: xhr,
                });
            }
        });

        promise.send = (bytes) => {
            xhr.send(bytes);
        }

        promise.upload = xhr.upload;

        return promise;
    }

    _do_post(data) {
        let xhr = this._xhr('POST', {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'});
        this.emit('post', data);
        xhr.send(build_http_query(data));
        return xhr;
    }

    _check_upload_finished() {

        for (let i=0; i < this.sockets.length; ++i) {
            if (this.sockets[i].status !== WAITING) {
                return;
            }
        }

        this._do_post({
            'action': 'finish',
        });
    }

    upload() {
        this._do_post({
            name: this.file.name,
            type: this.file.type,
            size: this.file.size,
            lastModified: this.file.lastModified,
            action: 'begin-upload',
        }).then(results => {
            if (results.status !== 200) {
                throw new Error('request failed');
            }

            let response = results.responseText;
            if (typeof response === "string") {
                response = JSON.parse(response);
            }

            response = response.response;
            if (typeof response.block_limit === "number") {
                this.block_size = Math.min(parseInt(response.block_limit), this.max_block_size);
            }
            this.file_id = response.file_id;
            this._begin_upload();
        });
    }

    _begin_upload() {
        let pos = 0;
        this.blocks = Array(Math.ceil(this.file.size / this.block_size)).fill(1)
            .map(() => {
                let offset = pos * this.block_size;
                let end = Math.min(++pos * this.block_size, this.file.size);
                return {
                    id: pos - 1,
                    status: WAITING,
                    offset,
                    end,
                    size: end - offset,
                    uploaded: 0,
                    blob: null,

                    real_offset: null,
                    real_size: null,
                };
            })
        this._upload_next_block();
    }

    _get_free_socket() {
        for (let i=0; i < this.sockets.length; ++i) {
            if (this.sockets[i].status === WAITING) {
                return this.sockets[i];
            }
        }

        return false;
    }

    _upload_next_block() {
        let socket;
        while (socket = this._get_free_socket()) {
            let h = 0;
            for (let i=0; i < this.blocks.length; ++i) {
                if (this.blocks[i].status === WAITING) {
                    socket.status = BUSY;
                    this.blocks[i].status = LOADING;

                    this.file_reader.push({socket: socket, block: this.blocks[i]});
                    h = 1;
                    break;
                }
            }
            if (!h) {
                return this._check_upload_finished();
            }
        }
    }

    progress() {
        this.emit('progress', this.file_size, this.blocks.map(m => m.uploaded).reduce((a, b) => a+b, 0));
    }

    _upload_block(socket, block) {
        let xhr = this._xhr('PUT', {
            'Content-Type': 'application/binary',
            'X-HASH':  this.hash.apply(null, [block.blob]),
            'X-OFFSET': block.real_offset,
        })
        socket.status = BUSY;
        block.status  = UPLOAD;
        xhr.then(result => {
            let response = result.responseText;
            if (typeof response === "string") {
                response = JSON.parse(response);
            }
            if (result.status !== 200 || !response || !response.success) {
                throw new Error('internal error');
            }

            block.status = DONE;
            block.uploaded = block.blob.byteLength;
            block.blob = null; // release memory

            socket.status = WAITING; // release socket slot.

            this.progress();
            this._upload_next_block();
        }).catch(r => {
            socket.status = WAITING; // release socket slot.
            block.status = WAITING
            block.uploaded = 0;
            this.progress();
            this._upload_next_block();
        });
        xhr.upload.onprogress = e => {
            block.uploaded = e.loaded;
            this.progress();
        };
        xhr.send(new Uint8Array(block.blob));
    }
}
