import Event from 'tiny-emitter';
import Status from './status'
import {build_http_query} from './utils'

if (typeof Promise !== "function") {
    throw new Error("This browser does not have any promisse. Please load bluebird first");
}

export default class Client extends Event {
    constructor(url) {
        super()

        this.url = url;

        // The file is split into blocks which are uploaded. This is a "map"
        // which contains information about the file block. We just read up to
        // 4 blocks at a time. So at most we would have 4MB of a file in RAM at
        // most.
        this.blocks = [];

        // "Sockets". This is not really any socket, just an array which represents
        // a request which is going on.
        let id = 0;
        this.sockets = Array(4).fill(1).map(m => {
            return {status: Status.WAITING, block: 0, id: id++}
        });
    }
    _do_post(data) {
        let xhr = this._xhr('POST', {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'});
        this.emit('post', data);
        xhr.send(build_http_query(data));
        return xhr;
    }

    _get_free_socket() {
        for (let i=0; i < this.sockets.length; ++i) {
            if (this.sockets[i].status === Status.WAITING) {
                return this.sockets[i];
            }
        }

        return false;
    }

    _calculate_blocks() {
        let pos = 0;
        this.blocks = Array(Math.ceil(this.file_size / this.block_size)).fill(1)
            .map(() => {
                let offset = pos * this.block_size;
                let end = Math.min(++pos * this.block_size, this.file_size);
                return {
                    id: pos - 1,
                    status: Status.WAITING,
                    offset,
                    end,
                    size: end - offset,
                    uploaded: 0,
                    blob: null,

                    real_offset: null,
                    real_size: null,
                };
            })
    }

    _is_ready() {
        throw new Error("_is_ready() must be override");
    }

    _maybe_is_ready() {
        for (let i=0; i < this.sockets.length; ++i) {
            if (this.sockets[i].status !== Status.WAITING) {
                return false;
            }
        }
        this._is_ready();
        return true;
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
                    responseText: xhr.response || xhr.responseText,
                    xhr: xhr,
                });
            }
        });

        promise.send = (bytes) => {
            xhr.send(bytes);
            return promise;
        }

        promise.getXhr = () => xhr;

        promise.upload = xhr.upload;

        return promise;
    }
}