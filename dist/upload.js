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

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var WAITING = -1;
	var BUSY = -2;
	var DONE = -3;

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
	        _this.chunk_size = 4 * 1024 * 1024;
	        _this.file_size = file.size;
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
	            for (var i = 0; i < this.chunks.length; ++i) {
	                if (this.chunks[i].status !== DONE) {
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
	                if (typeof response.chunk_limit === "number") {
	                    _this2.chunk_size = response.chunk_limit;
	                }
	                _this2.file_id = response.file_id;
	                _this2._begin_upload();
	            });
	        }

	        /**
	         * Returns a new array whose contents are a copy shuffled of the array.
	         * @param {Array} a items to shuffle.
	         * https://stackoverflow.com/a/2450976/1673761
	         */

	    }, {
	        key: 'shuffle',
	        value: function shuffle(array) {
	            var currentIndex = array.length;
	            var temporaryValue = void 0;
	            var randomIndex = void 0;
	            var newArray = array.slice();
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
	        }
	    }, {
	        key: '_begin_upload',
	        value: function _begin_upload() {
	            var _this3 = this;

	            var pos = 0;
	            this.chunks = Array(Math.ceil(this.file.size / this.chunk_size)).fill(1).map(function () {
	                var offset = pos * _this3.chunk_size;
	                var end = Math.min(++pos * _this3.chunk_size, _this3.file.size);
	                return {
	                    status: WAITING,
	                    offset: offset,
	                    end: end,
	                    size: end - offset,
	                    uploaded: 0
	                };
	            });
	            this.chunks = this.shuffle(this.chunks);
	            this._do_upload();
	        }
	    }, {
	        key: '_how_many_busy',
	        value: function _how_many_busy() {
	            var busy = 0;
	            for (var i = 0; i < this.chunks.length && busy < 5; ++i) {
	                if (this.chunks[i].status === BUSY) {
	                    ++busy;
	                }
	            }
	            return busy;
	        }
	    }, {
	        key: '_do_upload',
	        value: function _do_upload() {
	            var busy = this._how_many_busy();
	            for (var i = 0; i < this.chunks.length && busy < 5; ++i) {
	                if (this.chunks[i].status === WAITING) {
	                    this._upload_chunk(i);
	                    ++busy;
	                }
	            }
	            if (busy === 0) {
	                this._check_upload_finished();
	            }
	        }
	    }, {
	        key: 'progress',
	        value: function progress() {
	            this.emit('progress', this.file_size, this.chunks.map(function (m) {
	                return m.uploaded;
	            }).reduce(function (a, b) {
	                return a + b;
	            }, 0));
	        }
	    }, {
	        key: '_upload_chunk',
	        value: function _upload_chunk(id) {
	            var _this4 = this;

	            var retries = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

	            this.chunks[id].status = BUSY;
	            var chunk = this.chunks[id];
	            var reader = new FileReader();

	            reader.onloadend = function (evt) {
	                var target = evt.target;
	                var size = target.result.byteLength;
	                if (target.readyState === FileReader.DONE) {
	                    var xhr = _this4._xhr('PUT', {
	                        'Content-Type': 'application/binary',
	                        'X-HASH': _this4.hash.apply(null, [target.result]),
	                        'X-OFFSET': chunk.offset
	                    });
	                    xhr.then(function (result) {
	                        var response = result.responseText;
	                        if (typeof response === "string") {
	                            response = JSON.parse(response);
	                        }
	                        if (result.status !== 200 || !response || !response.success) {
	                            throw new Error('internal error');
	                        }
	                        chunk.status = DONE;
	                        chunk.uploaded = target.result.byteLength;
	                        _this4.progress();

	                        _this4._do_upload();
	                    }).catch(function (r) {
	                        chunk.status = WAITING;
	                        _this4._do_upload();
	                    });
	                    xhr.upload.onprogress = function (e) {
	                        chunk.uploaded = e.loaded;
	                        _this4.progress();
	                    };
	                    xhr.send(new Uint8Array(target.result));
	                }
	            };
	            reader.readAsArrayBuffer(this.file.slice(chunk.offset, chunk.end));
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

/***/ })
/******/ ]);