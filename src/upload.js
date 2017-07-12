import XHR from 'xhr-promise'
import FileSlice from './file'
import Event from 'tiny-emitter';
import {array, build_http_query} from './utils'

const WAITING = -1;
const BUSY = -2;

export class Upload extends Event {
    constructor(file, url, hash = window.sha256) {
        super();
        if (typeof hash !== "function") {
            throw new Error("The hash is not a valid function");
        }
        this.file = file;
        this.hash = hash;
        this.url  = url;
        this.chunk_size = 4 * 1024 * 1024;
        this.file_size  = file.size;
        this.progress   = 0;
        this.queue      = Array(4).fill(WAITING)
    }

    upload() {
        let xhr = new XHR();
        xhr.send({ 
            method: 'POST',
            url: this.url,
            data: build_http_query({
                name: this.file.name,
                type: this.file.type,
                size: this.file.size,
                lastModified: this.file.lastModified,
                begin_upload: true,
            }),
        }).then(results => {
            if (results.status !== 200) {
                throw new Error('request failed');
            }

            let response = results.responseText;
            if (typeof response === "string") {
                response = JSON.parse(response);
            }

            response = response.response;
            if (typeof response.chunk_limit === "number") {
                this.chunk_size = response.chunk_limit;
            }
            this.file_id = response.file_id;
            this._begin_upload();
        });
    }

    _begin_upload() {
        this.chunks = Array(Math.ceil(this.file.size / this.chunk_size)).fill(WAITING)
        this._do_upload();
    }

    _get_empty_slot() {
        for (let i=0; i < this.chunks.length; ++i) {
            if (this.chunks[i] === WAITING) {
                return i;
            }
        }

        return false;
    }

    _do_upload() {
        for (let i = 0; i < this.queue.length; ++i) {
            if (this.queue[i] === WAITING) {
                let slice = this._get_empty_slot();
                if (slice === false) {
                    break;
                }
                this.queue[i] = slice;
                this._upload_chunk(slice);
            }
        }
        window.lol = this;
    }

    _upload_chunk(id, retries = 0) {
        this.chunks[id] = BUSY;
        let offset = id * this.chunk_size;
        let reader = new FileReader;
        if (retries > 0) {
            console.error(`retrying to upload ${id} for the ${retries} time`);
        }
        reader.onloadend = evt => {
            let target = evt.target;
            let size   = target.result.byteLength;
            if (target.readyState === FileReader.DONE) {
                let xhr = new XHR;
                xhr.send({
                    method: 'PUT',
                    url: this.url,
                    headers: {
                        'Content-Type': 'application/binary',
                        'X-HASH':  this.hash.apply(null, [target.result]),
                        'X-File-Id': this.file_id,
                        'X-Offset': id,
                    },
                    data: new Uint8Array(target.result),
                }).then(result => {
                    let response = result.responseText;
                    if (typeof response === "string") {
                        response = JSON.parse(response);
                    }
                    if (result.status !== 200 || !response || !response.success) {
                        throw new Error('internal error');
                    }
                    this.progress += size;
                    this.emit('progress', this.file_size, this.progress);
                    this.queue[id] = WAITING;
                    this._do_upload()
                }).catch(r => {
                    this._upload_chunk(id, ++retries)
                });
            }
        };
        reader.readAsArrayBuffer(this.file.slice(offset, offset + this.chunk_size))
    }
}
