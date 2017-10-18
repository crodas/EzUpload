import Event from 'tiny-emitter';

export default class File extends Event {
    constructor(id, size) {
        super();
        let requestFileSystem  = (window.requestFileSystem || window.webkitRequestFileSystem);
        requestFileSystem(
            window.TEMPORARY,
            size,
            fs => {
            this.fs = fs;
            fs.root.getFile(id, {create: true}, fileEntry => {
                this.fileEntry = fileEntry;

                fileEntry.createWriter(writer => {
                    this.fileWriter = writer;
                    this.fileWriter.onwriteend = (e) => {
                        this.emit('wrote', e);
                    };
                    this.fileWriter.onerror = function(e) {
                        console.error('Write failed: ' + e.toString());
                    };
                    this.emit('ready');
                }, err => this._fs_error(err));

                }, err => this._fs_error(err));
            },
            err => this._fs_error(err)
        );
    }

    write(blob) {
        this.fileWriter.write(new Blob([blob]));
    }

    finalize(next) {
        this.fileEntry.file(file => {
            next(file);
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

        this.emit('error', msg, e);
    }
}
