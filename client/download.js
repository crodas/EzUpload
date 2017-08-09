import Queue from './queue';
import Status from './status'
import Client from './client';
import {saveAs} from 'file-saver'

export default class Download extends Client {
    constructor(url) {
        super(url)
        this.block_size = 2 * 1024 * 1024;
        this._writer = new Queue((args, next) => {
            let {block, socket, bytes} = args;
            let fileWriter = this.fileWriter;
            fileWriter.onwriteend = () => {
                socket.status = Status.WAITING;
                block.status  = Status.DONE;
                this._download();
                next();
            };
            fileWriter.seek(block.offset);
            fileWriter.write(new Blob([bytes]));
        }, 1);
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
            block.downloaded = r.responseText.byteLength;
            this._writer.push({block, socket, bytes: r.responseText})
        }).catch(r => {
            socket.status = Status.WAITING; // release socket slot.
            block.status = Status.WAITING
            block.downloaded = 0;
            this.progress();
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
                return this._maybe_is_ready();
            }
        }
    }

    _is_ready() {
        this.fileEntry.file(file => {
            saveAs(file, this.download_file_name);
        }, err => this._fs_error(err));
    }

    _fs_error(e) {
        var msg = '';

        let FileError = window.FileError || window.DOMException;

        switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
        };

        this.emit('error', msg);
    }

    progress() {
        this.emit('progress', this.file_size, this.blocks.map(m => m.downloaded).reduce((a, b) => a+b, 0));
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

                let requestFileSystem  = (window.requestFileSystem || window.webkitRequestFileSystem);
                requestFileSystem(
                    window.TEMPORARY,
                    this.file_size,
                    fs => {
                        this.fs = fs;
                        fs.root.getFile('tmp', {create: true}, fileEntry => {
                            this.fileEntry = fileEntry;

                            fileEntry.createWriter(writer => {
                                this.fileWriter = writer;
                                this.fileWriter.onerror = function(e) {
                                    console.error('Write failed: ' + e.toString());
                                };
                                this._download();
                            }, err => this._fs_error(err));

                        }, err => this._fs_error(err));
                    },
                    err => this._fs_error(err)
                );
            });

    }
}
