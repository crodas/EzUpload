this["FileUploader"] =
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
	exports.Status = exports.Download = exports.sha256 = exports.Queue = exports.Upload = exports.default = undefined;

	var _queue = __webpack_require__(1);

	var _queue2 = _interopRequireDefault(_queue);

	var _upload = __webpack_require__(2);

	var _upload2 = _interopRequireDefault(_upload);

	var _download = __webpack_require__(11);

	var _download2 = _interopRequireDefault(_download);

	var _sha256Min = __webpack_require__(7);

	var _sha256Min2 = _interopRequireDefault(_sha256Min);

	var _status = __webpack_require__(5);

	var _status2 = _interopRequireDefault(_status);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = _upload2.default;
	exports.Upload = _upload2.default;
	exports.Queue = _queue2.default;
	exports.sha256 = _sha256Min2.default;
	exports.Download = _download2.default;
	exports.Status = _status2.default;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Queue = function () {
	    function Queue(worker) {
	        var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

	        _classCallCheck(this, Queue);

	        this.worker = worker;
	        this.limit = limit;
	        this.running = 0;
	        this.queue = [];
	    }

	    _createClass(Queue, [{
	        key: "_run_queue",
	        value: function _run_queue() {
	            var _this = this;

	            while (this.running < this.limit) {
	                var args = this.queue.shift();
	                if (!args) {
	                    break;
	                }
	                ++this.running;
	                this.worker(args, function () {
	                    --_this.running;
	                    setTimeout(function () {
	                        _this._run_queue();
	                    });
	                });
	            }
	        }
	    }, {
	        key: "push",
	        value: function push(args) {
	            var _this2 = this;

	            this.queue.push(args);
	            setTimeout(function () {
	                _this2._run_queue();
	            });
	        }
	    }]);

	    return Queue;
	}();

	exports.default = Queue;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _queue = __webpack_require__(1);

	var _queue2 = _interopRequireDefault(_queue);

	var _client = __webpack_require__(3);

	var _client2 = _interopRequireDefault(_client);

	var _status = __webpack_require__(5);

	var _status2 = _interopRequireDefault(_status);

	var _sha256Min = __webpack_require__(7);

	var _sha256Min2 = _interopRequireDefault(_sha256Min);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Upload = function (_Client) {
	    _inherits(Upload, _Client);

	    function Upload(file, url) {
	        var hash = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _sha256Min2.default;

	        _classCallCheck(this, Upload);

	        var _this = _possibleConstructorReturn(this, (Upload.__proto__ || Object.getPrototypeOf(Upload)).call(this, url));

	        if (typeof hash !== "function") {
	            throw new Error("The hash is not a valid function");
	        }
	        _this.file = file;
	        _this.hash = hash;
	        _this.url = url;
	        _this.max_block_size = 1024 * 1024;
	        _this.file_size = file.size;

	        _this.file_reader = new _queue2.default(function (args, next) {
	            var socket = args.socket,
	                block = args.block;


	            if (block.blob) {
	                _this._upload_block(socket, block);
	                return next();
	            }

	            var reader = new FileReader();
	            reader.onloadend = function (evt) {
	                var target = evt.target;
	                if (target.readyState === FileReader.DONE) {
	                    _this.encode_block(block.offset, target.result, function (err, bytes) {
	                        if (err) bytes = target.result;
	                        block.blob = bytes;
	                        block.real_size = block.blob.byteLength;
	                        if (block.id === 0) {
	                            block.real_offset = 0;
	                        } else {
	                            var prevBlock = _this.blocks[block.id - 1];
	                            block.real_offset = prevBlock.real_size + prevBlock.real_offset;
	                        }

	                        _this._upload_block(socket, block);
	                        next();
	                    });
	                }
	            };
	            reader.readAsArrayBuffer(_this.file.slice(block.offset, block.end));
	        }, 1);

	        return _this;
	    }

	    _createClass(Upload, [{
	        key: 'encode_block',
	        value: function encode_block(offset, bytes, next) {
	            next(null, bytes);
	        }
	    }, {
	        key: 'finalize_upload',
	        value: function finalize_upload(args, next) {
	            next();
	        }
	    }, {
	        key: '_is_ready',
	        value: function _is_ready() {
	            var _this2 = this;

	            var args = {
	                'action': 'finish'
	            };

	            this.finalize_upload(args, function (err) {
	                _this2._do_post(args).then(function (r) {
	                    var response = _this2.parse_response(r);
	                    _this2.progress();
	                    _this2.emit('end', true, response, _this2);
	                });
	            });
	        }
	    }, {
	        key: 'upload',
	        value: function upload() {
	            var _this3 = this;

	            this._do_post({
	                name: this.file.name,
	                type: this.file.type,
	                size: this.file.size,
	                lastModified: this.file.lastModified,
	                action: 'begin-upload'
	            }).then(function (results) {
	                var response = _this3.parse_response(results);

	                if (typeof response.block_limit === "number") {
	                    _this3.block_size = Math.min(parseInt(response.block_limit), _this3.max_block_size);
	                }

	                if (_typeof(response.blocks) === "object" && response.blocks instanceof Array) {
	                    _this3.blocks = response.blocks;
	                }

	                _this3.file_id = response.file_id;
	                _this3.response = response;
	                _this3._begin_upload();
	            });
	        }
	    }, {
	        key: '_begin_upload',
	        value: function _begin_upload() {
	            this.file_size = this.file.size;
	            this._calculate_blocks();
	            this._upload_next_block();
	        }
	    }, {
	        key: '_upload_next_block',
	        value: function _upload_next_block() {
	            var socket = void 0;
	            while (socket = this._get_free_socket()) {
	                var h = 0;
	                for (var i = 0; i < this.blocks.length; ++i) {
	                    if (this.blocks[i].status === _status2.default.WAITING) {
	                        socket.status = _status2.default.BUSY;
	                        this.blocks[i].status = _status2.default.LOADING;

	                        this.file_reader.push({ socket: socket, block: this.blocks[i] });
	                        h = 1;
	                        break;
	                    }
	                }
	                if (!h) {
	                    return this._maybe_is_ready();
	                }
	            }
	        }
	    }, {
	        key: '_upload_block',
	        value: function _upload_block(socket, block) {
	            var _this4 = this;

	            var xhr = this._xhr('PUT', {
	                'Content-Type': 'application/binary',
	                'X-HASH': this.hash.apply(null, [block.blob]),
	                'X-OFFSET': block.real_offset
	            }, block.url || this.url);
	            socket.status = _status2.default.BUSY;
	            block.status = _status2.default.UPLOAD;
	            xhr.then(function (result) {
	                var response = _this4.parse_response(result);

	                block.status = _status2.default.DONE;
	                _this4.transfered += block.blob.byteLength;
	                block.blob = null; // release memory

	                socket.status = _status2.default.WAITING; // release socket slot.

	                _this4.progress();
	                _this4._upload_next_block();
	            }).catch(function (r) {
	                socket.status = _status2.default.WAITING; // release socket slot.
	                block.status = _status2.default.WAITING;
	                socket.transfered = 0;
	                _this4.progress();
	                _this4._upload_next_block();
	            });
	            xhr.upload.onprogress = function (e) {
	                socket.transfered = e.loaded;
	                _this4.progress();
	            };
	            xhr.send(new Uint8Array(block.blob));
	        }
	    }]);

	    return Upload;
	}(_client2.default);

	exports.default = Upload;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _tinyEmitter = __webpack_require__(4);

	var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

	var _status = __webpack_require__(5);

	var _status2 = _interopRequireDefault(_status);

	var _utils = __webpack_require__(6);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	if (typeof Promise !== "function") {
	    throw new Error("This browser does not have any promisse. Please load bluebird first");
	}

	var MIN_BLOCK_SIZE = 128 * 1024;
	var MAX_BLOCK_SIZE = 1024 * 1024 * 5;

	var Client = function (_Event) {
	    _inherits(Client, _Event);

	    function Client(url) {
	        _classCallCheck(this, Client);

	        var _this = _possibleConstructorReturn(this, (Client.__proto__ || Object.getPrototypeOf(Client)).call(this));

	        _this.url = url;

	        _this.transfered = 0;

	        // The file is split into blocks which are uploaded. This is a "map"
	        // which contains information about the file block. We just read up to
	        // 4 blocks at a time. So at most we would have 4MB of a file in RAM at
	        // most.
	        _this.blocks = null;

	        // "Sockets". This is not really any socket, just an array which represents
	        // a request which is going on.
	        var id = 0;
	        _this.sockets = Array(4).fill(1).map(function (m) {
	            return { status: _status2.default.WAITING, block: 0, id: id++ };
	        });
	        return _this;
	    }

	    _createClass(Client, [{
	        key: '_do_post',
	        value: function _do_post(data) {
	            var xhr = this._xhr('POST', { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' });
	            this.emit('post', data);
	            xhr.send((0, _utils.build_http_query)(data));
	            return xhr;
	        }
	    }, {
	        key: '_get_free_socket',
	        value: function _get_free_socket() {
	            for (var i = 0; i < this.sockets.length; ++i) {
	                if (this.sockets[i].status === _status2.default.WAITING) {
	                    this.sockets[i].transfered = 0;
	                    return this.sockets[i];
	                }
	            }

	            return false;
	        }
	    }, {
	        key: 'progress',
	        value: function progress() {
	            var transfered = this.sockets.map(function (m) {
	                return m.status == _status2.default.WAITING ? 0 : m.transfered;
	            }).reduce(function (a, b) {
	                return a + b;
	            }, 0);
	            this.emit('progress', this.file_size, transfered + this.transfered);
	        }
	    }, {
	        key: '_calculate_blocks',
	        value: function _calculate_blocks() {
	            var _this2 = this;

	            var id = 0;
	            var bytes = 0;
	            var blocks = [];

	            if (this.blocks !== null) {
	                this.blocks = this.blocks.map(function (v) {
	                    v.id = id++;
	                    v.size = v.end - v.offset;
	                    v.blob = null;
	                    v.transfered = 0;
	                    v.status = _status2.default.WAITING;
	                    v.real_offset = null;
	                    v.real_size = null;
	                    return v;
	                });
	                return;
	            }

	            for (var i = 1; i <= 8 && bytes <= this.file_size - i * MIN_BLOCK_SIZE; ++i) {
	                blocks.push({
	                    offset: bytes,
	                    end: i * MIN_BLOCK_SIZE
	                });
	                bytes = MIN_BLOCK_SIZE * i;
	            }

	            while (bytes < this.file_size) {
	                blocks.push({ offset: bytes, end: bytes + MAX_BLOCK_SIZE });
	                bytes += MAX_BLOCK_SIZE;
	            }

	            this.blocks = blocks.map(function (v) {
	                v.id = id++;
	                v.end = Math.min(v.end, _this2.file_size);
	                v.size = v.end - v.offset;
	                v.blob = null;
	                v.transfered = 0;
	                v.status = _status2.default.WAITING;
	                v.real_offset = null;
	                v.real_size = null;
	                return v;
	            });
	        }
	    }, {
	        key: '_is_ready',
	        value: function _is_ready() {
	            throw new Error("_is_ready() must be override");
	        }
	    }, {
	        key: 'parse_response',
	        value: function parse_response(result) {
	            var response = result.responseText;
	            if (typeof response === "string") {
	                response = JSON.parse(response);
	            }

	            if (result.status !== 200 || !response || !response.success) {
	                throw new Error('internal error');
	            }

	            return response.response;
	        }
	    }, {
	        key: '_maybe_is_ready',
	        value: function _maybe_is_ready() {
	            for (var i = 0; i < this.sockets.length; ++i) {
	                if (this.sockets[i].status !== _status2.default.WAITING) {
	                    return false;
	                }
	            }
	            this._is_ready();
	            return true;
	        }
	    }, {
	        key: '_xhr',
	        value: function _xhr(action) {
	            var headers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	            var url = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.url;

	            var xhr = new XMLHttpRequest();
	            xhr.open(action, url, true);
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
	                        responseText: xhr.response || xhr.responseText,
	                        xhr: xhr
	                    });
	                };
	            });

	            promise.send = function (bytes) {
	                xhr.send(bytes);
	                return promise;
	            };

	            promise.getXhr = function () {
	                return xhr;
	            };

	            promise.upload = xhr.upload;

	            return promise;
	        }
	    }]);

	    return Client;
	}(_tinyEmitter2.default);

	exports.default = Client;

/***/ }),
/* 4 */
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
/* 5 */
/***/ (function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.default = {
	    WAITING: 1,
	    LOADING: 2,
	    UPLOAD: 3,
	    DOWNLOAD: 4,
	    BUSY: 5,
	    DONE: 6
	};

/***/ }),
/* 6 */
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
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * [js-sha256]{@link https://github.com/emn178/js-sha256}
	 *
	 * @version 0.5.0
	 * @author Chen, Yi-Cyuan [emn178@gmail.com]
	 * @copyright Chen, Yi-Cyuan 2014-2017
	 * @license MIT
	 */
	!function(){"use strict";function t(t,h){h?(c[0]=c[16]=c[1]=c[2]=c[3]=c[4]=c[5]=c[6]=c[7]=c[8]=c[9]=c[10]=c[11]=c[12]=c[13]=c[14]=c[15]=0,this.blocks=c):this.blocks=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],t?(this.h0=3238371032,this.h1=914150663,this.h2=812702999,this.h3=4144912697,this.h4=4290775857,this.h5=1750603025,this.h6=1694076839,this.h7=3204075428):(this.h0=1779033703,this.h1=3144134277,this.h2=1013904242,this.h3=2773480762,this.h4=1359893119,this.h5=2600822924,this.h6=528734635,this.h7=1541459225),this.block=this.start=this.bytes=0,this.finalized=this.hashed=!1,this.first=!0,this.is224=t}var h="object"==typeof window?window:{},i=!h.JS_SHA256_NO_NODE_JS&&"object"==typeof process&&process.versions&&process.versions.node;i&&(h=global);var s=!h.JS_SHA256_NO_COMMON_JS&&"object"==typeof module&&module.exports,e="function"=="function"&&__webpack_require__(8),r="undefined"!=typeof ArrayBuffer,n="0123456789abcdef".split(""),o=[-2147483648,8388608,32768,128],a=[24,16,8,0],f=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298],u=["hex","array","digest","arrayBuffer"],c=[],p=function(h,i){return function(s){return new t(i,!0).update(s)[h]()}},d=function(h){var s=p("hex",h);i&&(s=y(s,h)),s.create=function(){return new t(h)},s.update=function(t){return s.create().update(t)};for(var e=0;e<u.length;++e){var r=u[e];s[r]=p(r,h)}return s},y=function(t,h){var i=__webpack_require__(9),s=__webpack_require__(10).Buffer,e=h?"sha224":"sha256",n=function(h){if("string"==typeof h)return i.createHash(e).update(h,"utf8").digest("hex");if(r&&h instanceof ArrayBuffer)h=new Uint8Array(h);else if(void 0===h.length)return t(h);return i.createHash(e).update(new s(h)).digest("hex")};return n};t.prototype.update=function(t){if(!this.finalized){var i="string"!=typeof t;i&&r&&t instanceof h.ArrayBuffer&&(t=new Uint8Array(t));for(var s,e,n=0,o=t.length||0,f=this.blocks;o>n;){if(this.hashed&&(this.hashed=!1,f[0]=this.block,f[16]=f[1]=f[2]=f[3]=f[4]=f[5]=f[6]=f[7]=f[8]=f[9]=f[10]=f[11]=f[12]=f[13]=f[14]=f[15]=0),i)for(e=this.start;o>n&&64>e;++n)f[e>>2]|=t[n]<<a[3&e++];else for(e=this.start;o>n&&64>e;++n)s=t.charCodeAt(n),128>s?f[e>>2]|=s<<a[3&e++]:2048>s?(f[e>>2]|=(192|s>>6)<<a[3&e++],f[e>>2]|=(128|63&s)<<a[3&e++]):55296>s||s>=57344?(f[e>>2]|=(224|s>>12)<<a[3&e++],f[e>>2]|=(128|s>>6&63)<<a[3&e++],f[e>>2]|=(128|63&s)<<a[3&e++]):(s=65536+((1023&s)<<10|1023&t.charCodeAt(++n)),f[e>>2]|=(240|s>>18)<<a[3&e++],f[e>>2]|=(128|s>>12&63)<<a[3&e++],f[e>>2]|=(128|s>>6&63)<<a[3&e++],f[e>>2]|=(128|63&s)<<a[3&e++]);this.lastByteIndex=e,this.bytes+=e-this.start,e>=64?(this.block=f[16],this.start=e-64,this.hash(),this.hashed=!0):this.start=e}return this}},t.prototype.finalize=function(){if(!this.finalized){this.finalized=!0;var t=this.blocks,h=this.lastByteIndex;t[16]=this.block,t[h>>2]|=o[3&h],this.block=t[16],h>=56&&(this.hashed||this.hash(),t[0]=this.block,t[16]=t[1]=t[2]=t[3]=t[4]=t[5]=t[6]=t[7]=t[8]=t[9]=t[10]=t[11]=t[12]=t[13]=t[14]=t[15]=0),t[15]=this.bytes<<3,this.hash()}},t.prototype.hash=function(){var t,h,i,s,e,r,n,o,a,u,c,p=this.h0,d=this.h1,y=this.h2,l=this.h3,b=this.h4,v=this.h5,g=this.h6,w=this.h7,k=this.blocks;for(t=16;64>t;++t)e=k[t-15],h=(e>>>7|e<<25)^(e>>>18|e<<14)^e>>>3,e=k[t-2],i=(e>>>17|e<<15)^(e>>>19|e<<13)^e>>>10,k[t]=k[t-16]+h+k[t-7]+i<<0;for(c=d&y,t=0;64>t;t+=4)this.first?(this.is224?(o=300032,e=k[0]-1413257819,w=e-150054599<<0,l=e+24177077<<0):(o=704751109,e=k[0]-210244248,w=e-1521486534<<0,l=e+143694565<<0),this.first=!1):(h=(p>>>2|p<<30)^(p>>>13|p<<19)^(p>>>22|p<<10),i=(b>>>6|b<<26)^(b>>>11|b<<21)^(b>>>25|b<<7),o=p&d,s=o^p&y^c,n=b&v^~b&g,e=w+i+n+f[t]+k[t],r=h+s,w=l+e<<0,l=e+r<<0),h=(l>>>2|l<<30)^(l>>>13|l<<19)^(l>>>22|l<<10),i=(w>>>6|w<<26)^(w>>>11|w<<21)^(w>>>25|w<<7),a=l&p,s=a^l&d^o,n=w&b^~w&v,e=g+i+n+f[t+1]+k[t+1],r=h+s,g=y+e<<0,y=e+r<<0,h=(y>>>2|y<<30)^(y>>>13|y<<19)^(y>>>22|y<<10),i=(g>>>6|g<<26)^(g>>>11|g<<21)^(g>>>25|g<<7),u=y&l,s=u^y&p^a,n=g&w^~g&b,e=v+i+n+f[t+2]+k[t+2],r=h+s,v=d+e<<0,d=e+r<<0,h=(d>>>2|d<<30)^(d>>>13|d<<19)^(d>>>22|d<<10),i=(v>>>6|v<<26)^(v>>>11|v<<21)^(v>>>25|v<<7),c=d&y,s=c^d&l^u,n=v&g^~v&w,e=b+i+n+f[t+3]+k[t+3],r=h+s,b=p+e<<0,p=e+r<<0;this.h0=this.h0+p<<0,this.h1=this.h1+d<<0,this.h2=this.h2+y<<0,this.h3=this.h3+l<<0,this.h4=this.h4+b<<0,this.h5=this.h5+v<<0,this.h6=this.h6+g<<0,this.h7=this.h7+w<<0},t.prototype.hex=function(){this.finalize();var t=this.h0,h=this.h1,i=this.h2,s=this.h3,e=this.h4,r=this.h5,o=this.h6,a=this.h7,f=n[t>>28&15]+n[t>>24&15]+n[t>>20&15]+n[t>>16&15]+n[t>>12&15]+n[t>>8&15]+n[t>>4&15]+n[15&t]+n[h>>28&15]+n[h>>24&15]+n[h>>20&15]+n[h>>16&15]+n[h>>12&15]+n[h>>8&15]+n[h>>4&15]+n[15&h]+n[i>>28&15]+n[i>>24&15]+n[i>>20&15]+n[i>>16&15]+n[i>>12&15]+n[i>>8&15]+n[i>>4&15]+n[15&i]+n[s>>28&15]+n[s>>24&15]+n[s>>20&15]+n[s>>16&15]+n[s>>12&15]+n[s>>8&15]+n[s>>4&15]+n[15&s]+n[e>>28&15]+n[e>>24&15]+n[e>>20&15]+n[e>>16&15]+n[e>>12&15]+n[e>>8&15]+n[e>>4&15]+n[15&e]+n[r>>28&15]+n[r>>24&15]+n[r>>20&15]+n[r>>16&15]+n[r>>12&15]+n[r>>8&15]+n[r>>4&15]+n[15&r]+n[o>>28&15]+n[o>>24&15]+n[o>>20&15]+n[o>>16&15]+n[o>>12&15]+n[o>>8&15]+n[o>>4&15]+n[15&o];return this.is224||(f+=n[a>>28&15]+n[a>>24&15]+n[a>>20&15]+n[a>>16&15]+n[a>>12&15]+n[a>>8&15]+n[a>>4&15]+n[15&a]),f},t.prototype.toString=t.prototype.hex,t.prototype.digest=function(){this.finalize();var t=this.h0,h=this.h1,i=this.h2,s=this.h3,e=this.h4,r=this.h5,n=this.h6,o=this.h7,a=[t>>24&255,t>>16&255,t>>8&255,255&t,h>>24&255,h>>16&255,h>>8&255,255&h,i>>24&255,i>>16&255,i>>8&255,255&i,s>>24&255,s>>16&255,s>>8&255,255&s,e>>24&255,e>>16&255,e>>8&255,255&e,r>>24&255,r>>16&255,r>>8&255,255&r,n>>24&255,n>>16&255,n>>8&255,255&n];return this.is224||a.push(o>>24&255,o>>16&255,o>>8&255,255&o),a},t.prototype.array=t.prototype.digest,t.prototype.arrayBuffer=function(){this.finalize();var t=new ArrayBuffer(this.is224?28:32),h=new DataView(t);return h.setUint32(0,this.h0),h.setUint32(4,this.h1),h.setUint32(8,this.h2),h.setUint32(12,this.h3),h.setUint32(16,this.h4),h.setUint32(20,this.h5),h.setUint32(24,this.h6),this.is224||h.setUint32(28,this.h7),t};var l=d();l.sha256=l,l.sha224=d(!0),s?module.exports=l:(h.sha256=l.sha256,h.sha224=l.sha224,e&&!(__WEBPACK_AMD_DEFINE_RESULT__ = function(){return l}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)))}();


/***/ }),
/* 8 */
/***/ (function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	module.exports = require("crypto");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

	module.exports = require("buffer");

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _status = __webpack_require__(5);

	var _status2 = _interopRequireDefault(_status);

	var _client = __webpack_require__(3);

	var _client2 = _interopRequireDefault(_client);

	var _fileSaver = __webpack_require__(12);

	var _file = __webpack_require__(14);

	var _file2 = _interopRequireDefault(_file);

	var _fileMemory = __webpack_require__(15);

	var _fileMemory2 = _interopRequireDefault(_fileMemory);

	var _sha256Min = __webpack_require__(7);

	var _sha256Min2 = _interopRequireDefault(_sha256Min);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Sequential_Queue = function () {
	    function Sequential_Queue(worker) {
	        _classCallCheck(this, Sequential_Queue);

	        this.next_id = 0;
	        this.queue = [];
	        this.worker = worker;
	        this.busy = false;
	    }

	    _createClass(Sequential_Queue, [{
	        key: 'queue_size',
	        value: function queue_size() {
	            return this.queue.length;
	        }
	    }, {
	        key: '_run',
	        value: function _run() {
	            var _this = this;

	            if (!this.busy && this.queue.length > 0 && this.next_id === this.queue[0].id) {
	                this.busy = true;
	                this.worker.apply(null, [this.queue.shift().data, function () {
	                    _this.busy = false;
	                    ++_this.next_id;
	                    _this._run();
	                }]);
	            }
	        }
	    }, {
	        key: 'push',
	        value: function push(id, data) {
	            this.queue.push({ id: id, data: data });
	            this.queue.sort(function (a, b) {
	                return a.id - b.id;
	            });
	            this._run();
	        }
	    }]);

	    return Sequential_Queue;
	}();

	var Download = function (_Client) {
	    _inherits(Download, _Client);

	    function Download(url) {
	        _classCallCheck(this, Download);

	        var _this2 = _possibleConstructorReturn(this, (Download.__proto__ || Object.getPrototypeOf(Download)).call(this, url));

	        _this2.block_size = 2 * 1024 * 1024;
	        _this2._writer = new Sequential_Queue(function (args, next) {
	            var block = args.block,
	                socket = args.socket,
	                bytes = args.bytes;

	            var fileWriter = _this2.fileWriter;
	            fileWriter.once('wrote', function () {
	                socket.status = _status2.default.WAITING;
	                block.status = _status2.default.DONE;
	                _this2._download();
	                next();
	                _this2._maybe_is_ready();
	            });
	            _this2.decode_block(block.offset, bytes, function (err, _bytes) {
	                fileWriter.write(_bytes);
	            });
	        });
	        return _this2;
	    }

	    _createClass(Download, [{
	        key: 'decode_block',
	        value: function decode_block(offset, bytes, next) {
	            next(null, bytes);
	        }

	        // _get_filesize() {{{

	    }, {
	        key: '_get_filesize',
	        value: function _get_filesize(xhr) {
	            var size = xhr.getAllResponseHeaders().match(/content-length\s*:\s*(\d+)/i);
	            return parseInt(size[1]);
	        }
	        // }}}

	    }, {
	        key: '_download_block',
	        value: function _download_block(block, socket) {
	            var _this3 = this;

	            var xhr = this._xhr('GET', {
	                'pragma': 'no-cache',
	                'accept': '*/*',
	                'range': 'bytes=' + block.offset + '-' + (block.end - 1)
	            });
	            xhr.getXhr().responseType = "arraybuffer";
	            xhr.then(function (r) {
	                _this3.transfered += r.responseText.byteLength;
	                _this3._writer.push(block.id, { block: block, socket: socket, bytes: r.responseText });
	                _this3.progress();
	            }).catch(function (r) {
	                socket.status = _status2.default.WAITING; // release socket slot.
	                block.status = _status2.default.WAITING;
	                socket.transfered = 0;
	                _this3.progress();
	                _this3._download();
	            });
	            xhr.send();
	        }
	    }, {
	        key: '_download',
	        value: function _download() {
	            var socket = void 0;
	            while (socket = this._get_free_socket()) {
	                var h = 0;
	                for (var i = 0; i < this.blocks.length; ++i) {
	                    if (this.blocks[i].status === _status2.default.WAITING) {
	                        socket.status = _status2.default.BUSY;
	                        this.blocks[i].status = _status2.default.LOADING;

	                        this._download_block(this.blocks[i], socket);
	                        h = 1;
	                        break;
	                    }
	                }
	                if (!h) {
	                    break;
	                }
	            }
	        }
	    }, {
	        key: '_is_ready',
	        value: function _is_ready() {
	            var _this4 = this;

	            this.fileWriter.finalize(function (file) {
	                (0, _fileSaver.saveAs)(file, _this4.download_file_name);
	            });
	        }
	    }, {
	        key: 'download',
	        value: function download(download_file_name) {
	            var _this5 = this;

	            if (!download_file_name) {
	                throw new Error("You must provide a file name for the download");
	            }
	            this.download_file_name = download_file_name;
	            this._xhr('HEAD').send().then(function (r) {
	                _this5.file_size = _this5._get_filesize(r.xhr);
	                _this5._calculate_blocks();
	                console.error(_this5.blocks);

	                _this5.fileWriter = new _file2.default((0, _sha256Min2.default)(_this5.url), _this5.file_size);
	                _this5.fileWriter.on('ready', function () {
	                    return _this5._download();
	                });
	                _this5.fileWriter.on('error', function (e) {
	                    if (e === 'SECURITY_ERR') {
	                        _this5.fileWriter = new _fileMemory2.default((0, _sha256Min2.default)(_this5.url), _this5.file_size);
	                        _this5.fileWriter.on('ready', function () {
	                            return _this5._download();
	                        });
	                        _this5.fileWriter.on('error', function (e) {
	                            return _this5.emit('error', e);
	                        });
	                        return;
	                    }
	                    _this5.emit('error', e);
	                });
	            });
	        }
	    }]);

	    return Download;
	}(_client2.default);

	exports.default = Download;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* FileSaver.js
	 * A saveAs() FileSaver implementation.
	 * 1.3.2
	 * 2016-06-16 18:25:19
	 *
	 * By Eli Grey, http://eligrey.com
	 * License: MIT
	 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
	 */

	/*global self */
	/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

	/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

	var saveAs = saveAs || (function(view) {
		"use strict";
		// IE <10 is explicitly unsupported
		if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
			return;
		}
		var
			  doc = view.document
			  // only get URL when necessary in case Blob.js hasn't overridden it yet
			, get_URL = function() {
				return view.URL || view.webkitURL || view;
			}
			, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
			, can_use_save_link = "download" in save_link
			, click = function(node) {
				var event = new MouseEvent("click");
				node.dispatchEvent(event);
			}
			, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
			, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
			, throw_outside = function(ex) {
				(view.setImmediate || view.setTimeout)(function() {
					throw ex;
				}, 0);
			}
			, force_saveable_type = "application/octet-stream"
			// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
			, arbitrary_revoke_timeout = 1000 * 40 // in ms
			, revoke = function(file) {
				var revoker = function() {
					if (typeof file === "string") { // file is an object URL
						get_URL().revokeObjectURL(file);
					} else { // file is a File
						file.remove();
					}
				};
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
			, dispatch = function(filesaver, event_types, event) {
				event_types = [].concat(event_types);
				var i = event_types.length;
				while (i--) {
					var listener = filesaver["on" + event_types[i]];
					if (typeof listener === "function") {
						try {
							listener.call(filesaver, event || filesaver);
						} catch (ex) {
							throw_outside(ex);
						}
					}
				}
			}
			, auto_bom = function(blob) {
				// prepend BOM for UTF-8 XML and text/* types (including HTML)
				// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
				if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
					return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
				}
				return blob;
			}
			, FileSaver = function(blob, name, no_auto_bom) {
				if (!no_auto_bom) {
					blob = auto_bom(blob);
				}
				// First try a.download, then web filesystem, then object URLs
				var
					  filesaver = this
					, type = blob.type
					, force = type === force_saveable_type
					, object_url
					, dispatch_all = function() {
						dispatch(filesaver, "writestart progress write writeend".split(" "));
					}
					// on any filesys errors revert to saving with object URLs
					, fs_error = function() {
						if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
							// Safari doesn't allow downloading of blob urls
							var reader = new FileReader();
							reader.onloadend = function() {
								var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
								var popup = view.open(url, '_blank');
								if(!popup) view.location.href = url;
								url=undefined; // release reference before dispatching
								filesaver.readyState = filesaver.DONE;
								dispatch_all();
							};
							reader.readAsDataURL(blob);
							filesaver.readyState = filesaver.INIT;
							return;
						}
						// don't create more object URLs than needed
						if (!object_url) {
							object_url = get_URL().createObjectURL(blob);
						}
						if (force) {
							view.location.href = object_url;
						} else {
							var opened = view.open(object_url, "_blank");
							if (!opened) {
								// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
								view.location.href = object_url;
							}
						}
						filesaver.readyState = filesaver.DONE;
						dispatch_all();
						revoke(object_url);
					}
				;
				filesaver.readyState = filesaver.INIT;

				if (can_use_save_link) {
					object_url = get_URL().createObjectURL(blob);
					setTimeout(function() {
						save_link.href = object_url;
						save_link.download = name;
						click(save_link);
						dispatch_all();
						revoke(object_url);
						filesaver.readyState = filesaver.DONE;
					});
					return;
				}

				fs_error();
			}
			, FS_proto = FileSaver.prototype
			, saveAs = function(blob, name, no_auto_bom) {
				return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
			}
		;
		// IE 10+ (native saveAs)
		if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
			return function(blob, name, no_auto_bom) {
				name = name || blob.name || "download";

				if (!no_auto_bom) {
					blob = auto_bom(blob);
				}
				return navigator.msSaveOrOpenBlob(blob, name);
			};
		}

		FS_proto.abort = function(){};
		FS_proto.readyState = FS_proto.INIT = 0;
		FS_proto.WRITING = 1;
		FS_proto.DONE = 2;

		FS_proto.error =
		FS_proto.onwritestart =
		FS_proto.onprogress =
		FS_proto.onwrite =
		FS_proto.onabort =
		FS_proto.onerror =
		FS_proto.onwriteend =
			null;

		return saveAs;
	}(
		   typeof self !== "undefined" && self
		|| typeof window !== "undefined" && window
		|| this.content
	));
	// `self` is undefined in Firefox for Android content script context
	// while `this` is nsIContentFrameMessageManager
	// with an attribute `content` that corresponds to the window

	if (typeof module !== "undefined" && module.exports) {
	  module.exports.saveAs = saveAs;
	} else if (("function" !== "undefined" && __webpack_require__(13) !== null) && (__webpack_require__(8) !== null)) {
	  !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	    return saveAs;
	  }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}


/***/ }),
/* 13 */
/***/ (function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _tinyEmitter = __webpack_require__(4);

	var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var File = function (_Event) {
	    _inherits(File, _Event);

	    function File(id, size) {
	        _classCallCheck(this, File);

	        var _this = _possibleConstructorReturn(this, (File.__proto__ || Object.getPrototypeOf(File)).call(this));

	        var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	        if (typeof requestFileSystem !== "function") {
	            var _ret;

	            return _ret = setTimeout(function () {
	                return _this.emit('error', 'SECURITY_ERR');
	            }), _possibleConstructorReturn(_this, _ret);
	        }

	        requestFileSystem(window.TEMPORARY, size, function (fs) {
	            _this.fs = fs;
	            fs.root.getFile(id, { create: true }, function (fileEntry) {
	                _this.fileEntry = fileEntry;

	                fileEntry.createWriter(function (writer) {
	                    _this.fileWriter = writer;
	                    _this.fileWriter.onwriteend = function (e) {
	                        _this.emit('wrote', e);
	                    };
	                    _this.fileWriter.onerror = function (e) {
	                        console.error('Write failed: ' + e.toString());
	                    };
	                    _this.emit('ready');
	                }, function (err) {
	                    return _this._fs_error(err);
	                });
	            }, function (err) {
	                return _this._fs_error(err);
	            });
	        }, function (err) {
	            return _this._fs_error(err);
	        });
	        return _this;
	    }

	    _createClass(File, [{
	        key: 'write',
	        value: function write(blob) {
	            this.fileWriter.write(new Blob([blob]));
	        }
	    }, {
	        key: 'finalize',
	        value: function finalize(next) {
	            var _this2 = this;

	            this.fileEntry.file(function (file) {
	                next(file);
	            }, function (err) {
	                return _this2._fs_error(err);
	            });
	        }
	    }, {
	        key: '_fs_error',
	        value: function _fs_error(e) {
	            var msg = '';

	            var FileError = window.FileError || window.DOMException;

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
	    }]);

	    return File;
	}(_tinyEmitter2.default);

	exports.default = File;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _tinyEmitter = __webpack_require__(4);

	var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var File = function (_Event) {
	    _inherits(File, _Event);

	    function File(id, size) {
	        _classCallCheck(this, File);

	        var _this = _possibleConstructorReturn(this, (File.__proto__ || Object.getPrototypeOf(File)).call(this));

	        _this.buffer = new ArrayBuffer(size);
	        _this.view = new Uint8Array(_this.buffer);
	        _this.offset = 0;
	        setTimeout(function () {
	            return _this.emit('ready');
	        });
	        return _this;
	    }

	    _createClass(File, [{
	        key: 'write',
	        value: function write(bytes) {
	            var _this2 = this;

	            this.view.set(new Uint8Array(bytes), this.offset);
	            this.offset += bytes.byteLength;
	            setTimeout(function () {
	                return _this2.emit('wrote');
	            });
	        }
	    }, {
	        key: 'finalize',
	        value: function finalize(next) {
	            next(new Blob([this.buffer]));
	        }
	    }]);

	    return File;
	}(_tinyEmitter2.default);

	exports.default = File;

/***/ })
/******/ ]);