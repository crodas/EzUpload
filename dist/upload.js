var FileUploader =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.Upload = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _tinyEmitter = __webpack_require__(1);

	var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

	var _utils = __webpack_require__(2);

	var _queue = __webpack_require__(3);

	var _queue2 = _interopRequireDefault(_queue);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var WAITING = 1;
	var LOADING = 2;
	var UPLOAD = 3;
	var BUSY = 4;
	var DONE = 5;

	if (typeof Promise !== "function") {
	    throw new Error("This browser does not have any promisse. Please load bluebird first");
	}

	var Upload = exports.Upload = function (_Event) {
	    _inherits(Upload, _Event);

	    function Upload(file, url) {
	        var hash = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : window.sha256;

	        _classCallCheck(this, Upload);

	        var _this = _possibleConstructorReturn(this, (Upload.__proto__ || Object.getPrototypeOf(Upload)).call(this));

	        if (typeof hash !== "function") {
	            throw new Error("The hash is not a valid function");
	        }
	        _this.file = file;
	        _this.hash = hash;
	        _this.url = url;
	        _this.max_block_size = 1024 * 1024;
	        _this.file_size = file.size;

	        // The file is split into blocks which are uploaded. This is a "map"
	        // which contains information about the file block. We just read up to 
	        // 4 blocks at a time. So at most we would have 4MB of a file in RAM at 
	        // most.
	        _this.blocks = [];

	        // "Sockets". This is not really any socket, just an array which represents
	        // a request which is going on.
	        var id = 0;
	        _this.sockets = Array(4).fill(1).map(function (m) {
	            return { status: WAITING, block: 0, id: id++ };
	        });

	        _this.file_reader = new _queue2.default(function (args, next) {
	            var socket = args.socket,
	                queue = args.queue;
	        }, 1);
	        return _this;
	    }

	    _createClass(Upload, [{
	        key: '_xhr',
	        value: function _xhr(action) {
	            var headers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	            var xhr = new XMLHttpRequest();
	            xhr.open(action, this.url, true);
	            if (this.file_id) {
	                headers['X-FILE-ID'] = this.file_id;
	            }
	            if (!headers['Content-Type']) {
	                headers['Content-Type'] = 'application/json';
	            }
	            for (var header in headers) {
	                if (headers.hasOwnProperty(header)) {
	                    xhr.setRequestHeader(header, headers[header]);
	                }
	            }

	            var promise = new Promise(function (resolve, reject) {
	                xhr.onload = function () {
	                    resolve({
	                        status: xhr.status,
	                        statusText: xhr.statusText,
	                        responseText: xhr.responseText,
	                        xhr: xhr
	                    });
	                };
	            });

	            promise.send = function (bytes) {
	                xhr.send(bytes);
	            };

	            promise.upload = xhr.upload;

	            return promise;
	        }
	    }, {
	        key: '_do_post',
	        value: function _do_post(data) {
	            var xhr = this._xhr('POST', { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' });
	            xhr.send((0, _utils.build_http_query)(data));
	            return xhr;
	        }
	    }, {
	        key: '_check_upload_finished',
	        value: function _check_upload_finished() {

	            for (var i = 0; i < this.sockets.length; ++i) {
	                if (this.sockets[i].status !== WAITING) {
	                    return;
	                }
	            }

	            this._do_post({
	                'action': 'finish'
	            });
	        }
	    }, {
	        key: 'upload',
	        value: function upload() {
	            var _this2 = this;

	            this._do_post({
	                name: this.file.name,
	                type: this.file.type,
	                size: this.file.size,
	                lastModified: this.file.lastModified,
	                action: 'begin-upload'
	            }).then(function (results) {
	                if (results.status !== 200) {
	                    throw new Error('request failed');
	                }

	                var response = results.responseText;
	                if (typeof response === "string") {
	                    response = JSON.parse(response);
	                }

	                response = response.response;
	                if (typeof response.block_limit === "number") {
	                    _this2.block_size = Math.min(parseInt(response.block_limit), _this2.max_block_size);
	                }
	                _this2.file_id = response.file_id;
	                _this2._begin_upload();
	            });
	        }
	    }, {
	        key: '_begin_upload',
	        value: function _begin_upload() {
	            var _this3 = this;

	            var pos = 0;
	            this.blocks = Array(Math.ceil(this.file.size / this.block_size)).fill(1).map(function () {
	                var offset = pos * _this3.block_size;
	                var end = Math.min(++pos * _this3.block_size, _this3.file.size);
	                return {
	                    id: pos - 1,
	                    status: WAITING,
	                    offset: offset,
	                    end: end,
	                    size: end - offset,
	                    uploaded: 0,
	                    blob: null,

	                    real_offset: null,
	                    real_size: null
	                };
	            });
	            this._upload_next_block();
	        }
	    }, {
	        key: '_get_free_socket',
	        value: function _get_free_socket() {
	            for (var i = 0; i < this.sockets.length; ++i) {
	                if (this.sockets[i].status === WAITING) {
	                    return this.sockets[i];
	                }
	            }

	            return false;
	        }
	    }, {
	        key: '_upload_next_block',
	        value: function _upload_next_block() {
	            var socket = void 0;
	            while (socket = this._get_free_socket()) {
	                var h = 0;
	                for (var i = 0; i < this.blocks.length; ++i) {
	                    if (this.blocks[i].status === WAITING) {
	                        this._read_block(socket, this.blocks[i]);
	                        h = 1;
	                        break;
	                    }
	                }
	                if (!h) {
	                    return this._check_upload_finished();
	                }
	            }
	        }
	    }, {
	        key: 'progress',
	        value: function progress() {
	            this.emit('progress', this.file_size, this.blocks.map(function (m) {
	                return m.uploaded;
	            }).reduce(function (a, b) {
	                return a + b;
	            }, 0));
	        }
	    }, {
	        key: '_upload_block',
	        value: function _upload_block(socket, block) {
	            var _this4 = this;

	            var xhr = this._xhr('PUT', {
	                'Content-Type': 'application/binary',
	                'X-HASH': this.hash.apply(null, [block.blob]),
	                'X-OFFSET': block.real_offset
	            });
	            socket.status = BUSY;
	            block.status = UPLOAD;
	            xhr.then(function (result) {
	                var response = result.responseText;
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

	                _this4.progress();
	                _this4._upload_next_block();
	            }).catch(function (r) {
	                socket.status = WAITING; // release socket slot.
	                block.status = WAITING;
	                block.uploaded = 0;
	                _this4.progress();
	                _this4._upload_next_block();
	            });
	            xhr.upload.onprogress = function (e) {
	                block.uploaded = e.loaded;
	                _this4.progress();
	            };
	            xhr.send(new Uint8Array(block.blob));
	        }
	    }, {
	        key: '_read_block',
	        value: function _read_block(socket, block) {
	            var _this5 = this;

	            socket.status = BUSY;
	            block.status = LOADING;

	            if (block.blob) {
	                return this._upload_block(socket, block);
	            }

	            this.read_queue.push([socket, block]);

	            var reader = new FileReader();

	            reader.onloadend = function (evt) {
	                var target = evt.target;
	                if (target.readyState === FileReader.DONE) {
	                    block.blob = target.result;
	                    block.real_size = block.blob.byteLength;
	                    if (block.id === 0) {
	                        block.real_offset = 0;
	                    } else {
	                        var prevBlock = _this5.blocks[block.id - 1];
	                        block.real_offset = prevBlock.real_size + prevBlock.real_offset;
	                    }
	                    _this5._upload_block(socket, block);
	                }
	            };
	            reader.readAsArrayBuffer(this.file.slice(block.offset, block.end));
	        }
	    }]);

	    return Upload;
	}(_tinyEmitter2.default);

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	function E () {
	  // Keep this empty so it's easier to inherit from
	  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
	}

	E.prototype = {
	  on: function (name, callback, ctx) {
	    var e = this.e || (this.e = {});

	    (e[name] || (e[name] = [])).push({
	      fn: callback,
	      ctx: ctx
	    });

	    return this;
	  },

	  once: function (name, callback, ctx) {
	    var self = this;
	    function listener () {
	      self.off(name, listener);
	      callback.apply(ctx, arguments);
	    };

	    listener._ = callback
	    return this.on(name, listener, ctx);
	  },

	  emit: function (name) {
	    var data = [].slice.call(arguments, 1);
	    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
	    var i = 0;
	    var len = evtArr.length;

	    for (i; i < len; i++) {
	      evtArr[i].fn.apply(evtArr[i].ctx, data);
	    }

	    return this;
	  },

	  off: function (name, callback) {
	    var e = this.e || (this.e = {});
	    var evts = e[name];
	    var liveEvents = [];

	    if (evts && callback) {
	      for (var i = 0, len = evts.length; i < len; i++) {
	        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
	          liveEvents.push(evts[i]);
	      }
	    }

	    // Remove event from queue to prevent memory leak
	    // Suggested by https://github.com/lazd
	    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

	    (liveEvents.length)
	      ? e[name] = liveEvents
	      : delete e[name];

	    return this;
	  }
	};

	module.exports = E;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.build_http_query = build_http_query;
	/**
	 * Converts an array to an URL
	 */
	function build_http_query(obj) {
	    var str = "";
	    for (var key in obj) {
	        if (obj.hasOwnProperty(key)) {
	            if (str != "") {
	                str += "&";
	            }
	            str += key + "=" + encodeURIComponent(obj[key]);
	        }
	    }
	    return str;
	}

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Queue = function Queue(worker, limit) {
	    _classCallCheck(this, Queue);
	};

	exports.default = Queue;

/***/ })
/******/ ]);