export default class Queue {

    constructor(worker, limit = 1) {
        this.worker = worker;
        this.limit  = limit;
        this.running = 0;
        this.queue   = [];
    }

    _run_queue() {
        while (this.running < this.limit) {
            let args = this.queue.shift();
            if (!args) {
                break;
            }
            ++this.running;
            this.worker(args, () => {
                --this.running;
                this._run_queue();
            });
        }
    }

    push(args) {
        this.queue.push(args);
        this._run_queue();
    }
}
