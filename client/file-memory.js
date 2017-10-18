import Event from 'tiny-emitter';

export default class File extends Event {
    constructor(id, size) {
        super();
        this.buffer = new ArrayBuffer(size);
        this.view   = new Uint8Array(this.buffer);
        this.offset = 0;
        setTimeout(() => this.emit('ready'));
    }
    write(bytes) {
        this.view.set(new Uint8Array(bytes), this.offset);
        this.offset += bytes.byteLength;
        setTimeout(() => this.emit('wrote'));
    }

    finalize(next) {
        next(new Blob([this.buffer]));
    }
}

