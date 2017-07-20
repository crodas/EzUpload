import XHR from 'xhr-promise'
import Event from 'tiny-emitter';
import {array, build_http_query} from './utils'

const WAITING = -1;
const BUSY = -2;
const DONE = -3;

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
    }

    _do_post(data) {
        let xhr = new XHR();
        let headers = {};
        if (this.file_id) {
            headers['X-File-Id'] = this.file_id;
        }
        return xhr.send({ 
            headers,
            method: 'POST',
            url: this.url,
            data: build_http_query(data)
        });
    }

    _check_upload_finished() {
        for (let i = 0; i < this.chunks.length; ++i) {
            if (this.chunks[i] !== DONE) {
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
    }

    _how_many_busy() {
        let busy = 0;
        for (let i=0; i < this.chunks.length && busy < 5; ++i) {
            if (this.chunks[i] === BUSY) {
                ++busy;
            }
        }
        return busy;
    }

    _do_upload() {
        let busy = this._how_many_busy();
        for (let i=0; i < this.chunks.length && busy < 5; ++i) {
            if (this.chunks[i] === WAITING) {
                console.error([i, busy]);
                this._upload_chunk(i);
                ++busy;
            }
        }
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
                        'X-Offset': offset,
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
                    this.chunks[id] = DONE;
                    this._do_upload()
                    this._check_upload_finished();
                }).catch(r => {
                    this._upload_chunk(id, ++retries)
                });
            }
        };
        reader.readAsArrayBuffer(this.file.slice(offset, offset + this.chunk_size))
    }
}
