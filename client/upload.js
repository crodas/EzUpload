import Queue from './queue';
import Client from './client'
import Status from './status'
import sha256 from './sha256.min.js'

export default class Upload extends Client {
    constructor(file, url, hash = sha256) {
        super(url);
        if (typeof hash !== "function") {
            throw new Error("The hash is not a valid function");
        }
        this.file = file;
        this.hash = hash;
        this.url  = url;
        this.max_block_size = 1024 * 1024;
        this.file_size  = file.size;

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
                    this.encode_block(block.offset, target.result, (err, bytes) => {
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

    encode_block(offset, bytes, next) {
        next(null, bytes);
    }

    finalize_upload(args, next) {
        next();
    }

    _is_ready() {
        let args = {
            'action': 'finish',
        }

        this.finalize_upload(args, (err) => {
            this._do_post(args)
                .then(r => {
                    let response = this.parse_response(r);
                    this.progress();
                    this.emit('end', true, response, this);
                });
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
            let response = this.parse_response(results);

            if (typeof response.block_limit === "number") {
                this.block_size = Math.min(parseInt(response.block_limit), this.max_block_size);
            }

            if (typeof response.blocks === "object" && response.blocks instanceof Array) {
                this.blocks = response.blocks;
            }

            this.file_id  = response.file_id;
            this.response = response;
            this._begin_upload();
        });
    }

    _begin_upload() {
        this.file_size = this.file.size;
        this._calculate_blocks();
        this._upload_next_block();
    }

    _upload_next_block() {
        let socket;
        while (socket = this._get_free_socket()) {
            let h = 0;
            for (let i=0; i < this.blocks.length; ++i) {
                if (this.blocks[i].status === Status.WAITING) {
                    socket.status = Status.BUSY;
                    this.blocks[i].status = Status.LOADING;

                    this.file_reader.push({socket: socket, block: this.blocks[i]});
                    h = 1;
                    break;
                }
            }
            if (!h) {
                return this._maybe_is_ready()
            }
        }
    }

    _upload_block(socket, block) {
        let xhr = this._xhr('PUT', {
            'Content-Type': 'application/binary',
            'X-HASH':  this.hash.apply(null, [block.blob]),
            'X-OFFSET': block.real_offset,
        }, block.url || this.url);
        socket.status = Status.BUSY;
        block.status  = Status.UPLOAD;
        xhr.then(result => {
            let response = this.parse_response(result);

            block.status = Status.DONE;
            this.transfered += block.blob.byteLength;
            block.blob = null; // release memory

            socket.status = Status.WAITING; // release socket slot.

            this.progress();
            this._upload_next_block();
        }).catch(r => {
            socket.status = Status.WAITING; // release socket slot.
            block.status = Status.WAITING
            socket.transfered = 0;
            this.progress();
            this._upload_next_block();
        });
        xhr.upload.onprogress = e => {
            socket.transfered = e.loaded;
            this.progress();
        };
        xhr.send(new Uint8Array(block.blob));
    }
}
