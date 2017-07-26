import Event from 'tiny-emitter';
import {array, build_http_query} from './utils'

const WAITING = -1;
const BUSY = -2;
const DONE = -3;

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
        this.chunk_size = 4 * 1024 * 1024;
        this.file_size  = file.size;
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
        xhr.send(build_http_query(data));
        return xhr;
    }

    _check_upload_finished() {
        for (let i = 0; i < this.chunks.length; ++i) {
            if (this.chunks[i].status !== DONE) {
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

     /**
      * Returns a new array whose contents are a copy shuffled of the array.
      * @param {Array} a items to shuffle.
      * https://stackoverflow.com/a/2450976/1673761
      */
    shuffle(array) {
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;
        const newArray = array.slice();
        // While there remain elements to shuffle...
        while (currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = newArray[currentIndex];
            newArray[currentIndex] = newArray[randomIndex];
            newArray[randomIndex] = temporaryValue;
        }
        return newArray;
    };

    _begin_upload() {
        let pos = 0;
        this.chunks = Array(Math.ceil(this.file.size / this.chunk_size)).fill(1)
            .map(() => {
                let offset = pos * this.chunk_size;
                let end = Math.min(++pos * this.chunk_size, this.file.size);
                return {
                    status: WAITING,
                    offset,
                    end,
                    size: end - offset,
                    uploaded: 0
                };
            })
        this.chunks = this.shuffle(this.chunks);
        this._do_upload();
    }

    _how_many_busy() {
        let busy = 0;
        for (let i=0; i < this.chunks.length && busy < 5; ++i) {
            if (this.chunks[i].status === BUSY) {
                ++busy;
            }
        }
        return busy;
    }

    _do_upload() {
        let busy = this._how_many_busy();
        for (let i=0; i < this.chunks.length && busy < 5; ++i) {
            if (this.chunks[i].status === WAITING) {
                this._upload_chunk(i);
                ++busy;
            }
        }
        if (busy === 0) {
            this._check_upload_finished();
        }
    }

    progress() {
        this.emit('progress', this.file_size, this.chunks.map(m => m.uploaded).reduce((a, b) => a+b, 0));
    }

    _upload_chunk(id, retries = 0) {
        this.chunks[id].status = BUSY;
        let chunk  = this.chunks[id];
        let reader = new FileReader;

        reader.onloadend = evt => {
            let target = evt.target;
            let size   = target.result.byteLength;
            if (target.readyState === FileReader.DONE) {
                let xhr = this._xhr('PUT', {
                    'Content-Type': 'application/binary',
                    'X-HASH':  this.hash.apply(null, [target.result]),
                    'X-OFFSET': chunk.offset,
                })
                xhr.then(result => {
                    let response = result.responseText;
                    if (typeof response === "string") {
                        response = JSON.parse(response);
                    }
                    if (result.status !== 200 || !response || !response.success) {
                        throw new Error('internal error');
                    }
                    chunk.status = DONE;
                    chunk.uploaded = target.result.byteLength;
                    this.progress();

                    this._do_upload();
                }).catch(r => {
                    chunk.status = WAITING
                    chunk.uploaded = 0;
                    this.progress();
                    this._do_upload();
                });
                xhr.upload.onprogress = e => {
                    chunk.uploaded = e.loaded;
                    this.progress();
                };
                xhr.send(new Uint8Array(target.result));
            }
        };
        reader.readAsArrayBuffer(this.file.slice(chunk.offset, chunk.end))
    }
}
