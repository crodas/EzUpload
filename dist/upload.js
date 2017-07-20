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

	var _xhrPromise = __webpack_require__(1);

	var _xhrPromise2 = _interopRequireDefault(_xhrPromise);

	var _tinyEmitter = __webpack_require__(14);

	var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

	var _utils = __webpack_require__(15);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var WAITING = -1;
	var BUSY = -2;
	var DONE = -3;

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
	        _this.progress = 0;
	        return _this;
	    }

	    _createClass(Upload, [{
	        key: '_do_post',
	        value: function _do_post(data) {
	            var xhr = new _xhrPromise2.default();
	            var headers = {};
	            if (this.file_id) {
	                headers['X-File-Id'] = this.file_id;
	            }
	            return xhr.send({
	                headers: headers,
	                method: 'POST',
	                url: this.url,
	                data: (0, _utils.build_http_query)(data)
	            });
	        }
	    }, {
	        key: '_check_upload_finished',
	        value: function _check_upload_finished() {
	            for (var i = 0; i < this.chunks.length; ++i) {
	                if (this.chunks[i] !== DONE) {
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
	    }, {
	        key: '_begin_upload',
	        value: function _begin_upload() {
	            this.chunks = Array(Math.ceil(this.file.size / this.chunk_size)).fill(WAITING);
	            this._do_upload();
	        }
	    }, {
	        key: '_get_empty_slot',
	        value: function _get_empty_slot() {}
	    }, {
	        key: '_how_many_busy',
	        value: function _how_many_busy() {
	            var busy = 0;
	            for (var i = 0; i < this.chunks.length && busy < 5; ++i) {
	                if (this.chunks[i] === BUSY) {
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
	                if (this.chunks[i] === WAITING) {
	                    console.error([i, busy]);
	                    this._upload_chunk(i);
	                    ++busy;
	                }
	            }
	        }
	    }, {
	        key: '_upload_chunk',
	        value: function _upload_chunk(id) {
	            var _this3 = this;

	            var retries = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

	            this.chunks[id] = BUSY;
	            var offset = id * this.chunk_size;
	            var reader = new FileReader();
	            if (retries > 0) {
	                console.error('retrying to upload ' + id + ' for the ' + retries + ' time');
	            }
	            reader.onloadend = function (evt) {
	                var target = evt.target;
	                var size = target.result.byteLength;
	                if (target.readyState === FileReader.DONE) {
	                    var xhr = new _xhrPromise2.default();
	                    xhr.send({
	                        method: 'PUT',
	                        url: _this3.url,
	                        headers: {
	                            'Content-Type': 'application/binary',
	                            'X-HASH': _this3.hash.apply(null, [target.result]),
	                            'X-File-Id': _this3.file_id,
	                            'X-Offset': offset
	                        },
	                        data: new Uint8Array(target.result)
	                    }).then(function (result) {
	                        var response = result.responseText;
	                        if (typeof response === "string") {
	                            response = JSON.parse(response);
	                        }
	                        if (result.status !== 200 || !response || !response.success) {
	                            throw new Error('internal error');
	                        }
	                        _this3.progress += size;
	                        _this3.emit('progress', _this3.file_size, _this3.progress);
	                        _this3.chunks[id] = DONE;
	                        _this3._do_upload();
	                        _this3._check_upload_finished();
	                    }).catch(function (r) {
	                        _this3._upload_chunk(id, ++retries);
	                    });
	                }
	            };
	            reader.readAsArrayBuffer(this.file.slice(offset, offset + this.chunk_size));
	        }
	    }]);

	    return Upload;
	}(_tinyEmitter2.default);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(2);


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {if (global.Promise == null) {
	  global.Promise = __webpack_require__(3);
	}

	if (Object.assign == null) {
	  Object.defineProperty(Object, 'assign', {
	    enumerable: false,
	    configurable: true,
	    writable: true,
	    value: __webpack_require__(7)
	  });
	}

	module.exports = __webpack_require__(8);

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, setImmediate) {!function(t){"use strict";function e(t){if(t){var e=this;t(function(t){e.resolve(t)},function(t){e.reject(t)})}}function n(t,e){if("function"==typeof t.y)try{var n=t.y.call(i,e);t.p.resolve(n)}catch(o){t.p.reject(o)}else t.p.resolve(e)}function o(t,e){if("function"==typeof t.n)try{var n=t.n.call(i,e);t.p.resolve(n)}catch(o){t.p.reject(o)}else t.p.reject(e)}var r,i,c="fulfilled",u="rejected",s="undefined",f=function(){function e(){for(;n.length-o;){try{n[o]()}catch(e){t.console&&t.console.error(e)}n[o++]=i,o==r&&(n.splice(0,r),o=0)}}var n=[],o=0,r=1024,c=function(){if(typeof MutationObserver!==s){var t=document.createElement("div"),n=new MutationObserver(e);return n.observe(t,{attributes:!0}),function(){t.setAttribute("a",0)}}return typeof setImmediate!==s?function(){setImmediate(e)}:function(){setTimeout(e,0)}}();return function(t){n.push(t),n.length-o==1&&c()}}();e.prototype={resolve:function(t){if(this.state===r){if(t===this)return this.reject(new TypeError("Attempt to resolve promise with self"));var e=this;if(t&&("function"==typeof t||"object"==typeof t))try{var o=!0,i=t.then;if("function"==typeof i)return void i.call(t,function(t){o&&(o=!1,e.resolve(t))},function(t){o&&(o=!1,e.reject(t))})}catch(u){return void(o&&this.reject(u))}this.state=c,this.v=t,e.c&&f(function(){for(var o=0,r=e.c.length;r>o;o++)n(e.c[o],t)})}},reject:function(n){if(this.state===r){this.state=u,this.v=n;var i=this.c;i?f(function(){for(var t=0,e=i.length;e>t;t++)o(i[t],n)}):!e.suppressUncaughtRejectionError&&t.console&&t.console.log("You upset Zousan. Please catch rejections: ",n,n?n.stack:null)}},then:function(t,i){var u=new e,s={y:t,n:i,p:u};if(this.state===r)this.c?this.c.push(s):this.c=[s];else{var l=this.state,a=this.v;f(function(){l===c?n(s,a):o(s,a)})}return u},"catch":function(t){return this.then(null,t)},"finally":function(t){return this.then(t,t)},timeout:function(t,n){n=n||"Timeout";var o=this;return new e(function(e,r){setTimeout(function(){r(Error(n))},t),o.then(function(t){e(t)},function(t){r(t)})})}},e.resolve=function(t){var n=new e;return n.resolve(t),n},e.reject=function(t){var n=new e;return n.reject(t),n},e.all=function(t){function n(n,c){n&&"function"==typeof n.then||(n=e.resolve(n)),n.then(function(e){o[c]=e,r++,r==t.length&&i.resolve(o)},function(t){i.reject(t)})}for(var o=[],r=0,i=new e,c=0;c<t.length;c++)n(t[c],c);return t.length||i.resolve(o),i},typeof module!=s&&module.exports&&(module.exports=e),t.define&&t.define.amd&&t.define([],function(){return e}),t.Zousan=e,e.soon=f}("undefined"!=typeof global?global:this);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(4).setImmediate))

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	var apply = Function.prototype.apply;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) {
	  if (timeout) {
	    timeout.close();
	  }
	};

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// setimmediate attaches itself to the global object
	__webpack_require__(5);
	exports.setImmediate = setImmediate;
	exports.clearImmediate = clearImmediate;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
	    "use strict";

	    if (global.setImmediate) {
	        return;
	    }

	    var nextHandle = 1; // Spec says greater than zero
	    var tasksByHandle = {};
	    var currentlyRunningATask = false;
	    var doc = global.document;
	    var registerImmediate;

	    function setImmediate(callback) {
	      // Callback can either be a function or a string
	      if (typeof callback !== "function") {
	        callback = new Function("" + callback);
	      }
	      // Copy function arguments
	      var args = new Array(arguments.length - 1);
	      for (var i = 0; i < args.length; i++) {
	          args[i] = arguments[i + 1];
	      }
	      // Store and register the task
	      var task = { callback: callback, args: args };
	      tasksByHandle[nextHandle] = task;
	      registerImmediate(nextHandle);
	      return nextHandle++;
	    }

	    function clearImmediate(handle) {
	        delete tasksByHandle[handle];
	    }

	    function run(task) {
	        var callback = task.callback;
	        var args = task.args;
	        switch (args.length) {
	        case 0:
	            callback();
	            break;
	        case 1:
	            callback(args[0]);
	            break;
	        case 2:
	            callback(args[0], args[1]);
	            break;
	        case 3:
	            callback(args[0], args[1], args[2]);
	            break;
	        default:
	            callback.apply(undefined, args);
	            break;
	        }
	    }

	    function runIfPresent(handle) {
	        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
	        // So if we're currently running a task, we'll need to delay this invocation.
	        if (currentlyRunningATask) {
	            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
	            // "too much recursion" error.
	            setTimeout(runIfPresent, 0, handle);
	        } else {
	            var task = tasksByHandle[handle];
	            if (task) {
	                currentlyRunningATask = true;
	                try {
	                    run(task);
	                } finally {
	                    clearImmediate(handle);
	                    currentlyRunningATask = false;
	                }
	            }
	        }
	    }

	    function installNextTickImplementation() {
	        registerImmediate = function(handle) {
	            process.nextTick(function () { runIfPresent(handle); });
	        };
	    }

	    function canUsePostMessage() {
	        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
	        // where `global.postMessage` means something completely different and can't be used for this purpose.
	        if (global.postMessage && !global.importScripts) {
	            var postMessageIsAsynchronous = true;
	            var oldOnMessage = global.onmessage;
	            global.onmessage = function() {
	                postMessageIsAsynchronous = false;
	            };
	            global.postMessage("", "*");
	            global.onmessage = oldOnMessage;
	            return postMessageIsAsynchronous;
	        }
	    }

	    function installPostMessageImplementation() {
	        // Installs an event handler on `global` for the `message` event: see
	        // * https://developer.mozilla.org/en/DOM/window.postMessage
	        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

	        var messagePrefix = "setImmediate$" + Math.random() + "$";
	        var onGlobalMessage = function(event) {
	            if (event.source === global &&
	                typeof event.data === "string" &&
	                event.data.indexOf(messagePrefix) === 0) {
	                runIfPresent(+event.data.slice(messagePrefix.length));
	            }
	        };

	        if (global.addEventListener) {
	            global.addEventListener("message", onGlobalMessage, false);
	        } else {
	            global.attachEvent("onmessage", onGlobalMessage);
	        }

	        registerImmediate = function(handle) {
	            global.postMessage(messagePrefix + handle, "*");
	        };
	    }

	    function installMessageChannelImplementation() {
	        var channel = new MessageChannel();
	        channel.port1.onmessage = function(event) {
	            var handle = event.data;
	            runIfPresent(handle);
	        };

	        registerImmediate = function(handle) {
	            channel.port2.postMessage(handle);
	        };
	    }

	    function installReadyStateChangeImplementation() {
	        var html = doc.documentElement;
	        registerImmediate = function(handle) {
	            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	            var script = doc.createElement("script");
	            script.onreadystatechange = function () {
	                runIfPresent(handle);
	                script.onreadystatechange = null;
	                html.removeChild(script);
	                script = null;
	            };
	            html.appendChild(script);
	        };
	    }

	    function installSetTimeoutImplementation() {
	        registerImmediate = function(handle) {
	            setTimeout(runIfPresent, 0, handle);
	        };
	    }

	    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
	    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

	    // Don't get fooled by e.g. browserify environments.
	    if ({}.toString.call(global.process) === "[object process]") {
	        // For Node.js before 0.9
	        installNextTickImplementation();

	    } else if (canUsePostMessage()) {
	        // For non-IE10 modern browsers
	        installPostMessageImplementation();

	    } else if (global.MessageChannel) {
	        // For web workers, where supported
	        installMessageChannelImplementation();

	    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
	        // For IE 6–8
	        installReadyStateChangeImplementation();

	    } else {
	        // For older browsers
	        installSetTimeoutImplementation();
	    }

	    attachTo.setImmediate = setImmediate;
	    attachTo.clearImmediate = clearImmediate;
	}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(6)))

/***/ }),
/* 6 */
/***/ (function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;

	process.listeners = function (name) { return [] }

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }),
/* 7 */
/***/ (function(module, exports) {

	/*
	object-assign
	(c) Sindre Sorhus
	@license MIT
	*/

	'use strict';
	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	module.exports = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	
	/*
	 * Copyright 2015 Scott Brady
	 * MIT License
	 * https://github.com/scottbrady/xhr-promise/blob/master/LICENSE
	 */
	var ParseHeaders, XMLHttpRequestPromise;

	ParseHeaders = __webpack_require__(9);


	/*
	 * Module to wrap an XMLHttpRequest in a promise.
	 */

	module.exports = XMLHttpRequestPromise = (function() {
	  function XMLHttpRequestPromise() {}

	  XMLHttpRequestPromise.DEFAULT_CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=UTF-8';


	  /*
	   * XMLHttpRequestPromise.send(options) -> Promise
	   * - options (Object): URL, method, data, etc.
	   *
	   * Create the XHR object and wire up event handlers to use a promise.
	   */

	  XMLHttpRequestPromise.prototype.send = function(options) {
	    var defaults;
	    if (options == null) {
	      options = {};
	    }
	    defaults = {
	      method: 'GET',
	      data: null,
	      headers: {},
	      async: true,
	      username: null,
	      password: null,
	      withCredentials: false
	    };
	    options = Object.assign({}, defaults, options);
	    return new Promise((function(_this) {
	      return function(resolve, reject) {
	        var e, header, ref, value, xhr;
	        if (!XMLHttpRequest) {
	          _this._handleError('browser', reject, null, "browser doesn't support XMLHttpRequest");
	          return;
	        }
	        if (typeof options.url !== 'string' || options.url.length === 0) {
	          _this._handleError('url', reject, null, 'URL is a required parameter');
	          return;
	        }
	        _this._xhr = xhr = new XMLHttpRequest;
	        xhr.onload = function() {
	          var responseText;
	          _this._detachWindowUnload();
	          try {
	            responseText = _this._getResponseText();
	          } catch (_error) {
	            _this._handleError('parse', reject, null, 'invalid JSON response');
	            return;
	          }
	          return resolve({
	            url: _this._getResponseUrl(),
	            status: xhr.status,
	            statusText: xhr.statusText,
	            responseText: responseText,
	            headers: _this._getHeaders(),
	            xhr: xhr
	          });
	        };
	        xhr.onerror = function() {
	          return _this._handleError('error', reject);
	        };
	        xhr.ontimeout = function() {
	          return _this._handleError('timeout', reject);
	        };
	        xhr.onabort = function() {
	          return _this._handleError('abort', reject);
	        };
	        _this._attachWindowUnload();
	        xhr.open(options.method, options.url, options.async, options.username, options.password);
	        if (options.withCredentials) {
	          xhr.withCredentials = true;
	        }
	        if ((options.data != null) && !options.headers['Content-Type']) {
	          options.headers['Content-Type'] = _this.constructor.DEFAULT_CONTENT_TYPE;
	        }
	        ref = options.headers;
	        for (header in ref) {
	          value = ref[header];
	          xhr.setRequestHeader(header, value);
	        }
	        try {
	          return xhr.send(options.data);
	        } catch (_error) {
	          e = _error;
	          return _this._handleError('send', reject, null, e.toString());
	        }
	      };
	    })(this));
	  };


	  /*
	   * XMLHttpRequestPromise.getXHR() -> XMLHttpRequest
	   */

	  XMLHttpRequestPromise.prototype.getXHR = function() {
	    return this._xhr;
	  };


	  /*
	   * XMLHttpRequestPromise._attachWindowUnload()
	   *
	   * Fix for IE 9 and IE 10
	   * Internet Explorer freezes when you close a webpage during an XHR request
	   * https://support.microsoft.com/kb/2856746
	   *
	   */

	  XMLHttpRequestPromise.prototype._attachWindowUnload = function() {
	    this._unloadHandler = this._handleWindowUnload.bind(this);
	    if (window.attachEvent) {
	      return window.attachEvent('onunload', this._unloadHandler);
	    }
	  };


	  /*
	   * XMLHttpRequestPromise._detachWindowUnload()
	   */

	  XMLHttpRequestPromise.prototype._detachWindowUnload = function() {
	    if (window.detachEvent) {
	      return window.detachEvent('onunload', this._unloadHandler);
	    }
	  };


	  /*
	   * XMLHttpRequestPromise._getHeaders() -> Object
	   */

	  XMLHttpRequestPromise.prototype._getHeaders = function() {
	    return ParseHeaders(this._xhr.getAllResponseHeaders());
	  };


	  /*
	   * XMLHttpRequestPromise._getResponseText() -> Mixed
	   *
	   * Parses response text JSON if present.
	   */

	  XMLHttpRequestPromise.prototype._getResponseText = function() {
	    var responseText;
	    responseText = typeof this._xhr.responseText === 'string' ? this._xhr.responseText : '';
	    switch ((this._xhr.getResponseHeader('Content-Type') || '').split(';')[0]) {
	      case 'application/json':
	      case 'text/javascript':
	        responseText = JSON.parse(responseText + '');
	    }
	    return responseText;
	  };


	  /*
	   * XMLHttpRequestPromise._getResponseUrl() -> String
	   *
	   * Actual response URL after following redirects.
	   */

	  XMLHttpRequestPromise.prototype._getResponseUrl = function() {
	    if (this._xhr.responseURL != null) {
	      return this._xhr.responseURL;
	    }
	    if (/^X-Request-URL:/m.test(this._xhr.getAllResponseHeaders())) {
	      return this._xhr.getResponseHeader('X-Request-URL');
	    }
	    return '';
	  };


	  /*
	   * XMLHttpRequestPromise._handleError(reason, reject, status, statusText)
	   * - reason (String)
	   * - reject (Function)
	   * - status (String)
	   * - statusText (String)
	   */

	  XMLHttpRequestPromise.prototype._handleError = function(reason, reject, status, statusText) {
	    this._detachWindowUnload();
	    return reject({
	      reason: reason,
	      status: status || this._xhr.status,
	      statusText: statusText || this._xhr.statusText,
	      xhr: this._xhr
	    });
	  };


	  /*
	   * XMLHttpRequestPromise._handleWindowUnload()
	   */

	  XMLHttpRequestPromise.prototype._handleWindowUnload = function() {
	    return this._xhr.abort();
	  };

	  return XMLHttpRequestPromise;

	})();


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	var trim = __webpack_require__(10)
	  , forEach = __webpack_require__(11)
	  , isArray = function(arg) {
	      return Object.prototype.toString.call(arg) === '[object Array]';
	    }

	module.exports = function (headers) {
	  if (!headers)
	    return {}

	  var result = {}

	  forEach(
	      trim(headers).split('\n')
	    , function (row) {
	        var index = row.indexOf(':')
	          , key = trim(row.slice(0, index)).toLowerCase()
	          , value = trim(row.slice(index + 1))

	        if (typeof(result[key]) === 'undefined') {
	          result[key] = value
	        } else if (isArray(result[key])) {
	          result[key].push(value)
	        } else {
	          result[key] = [ result[key], value ]
	        }
	      }
	  )

	  return result
	}

/***/ }),
/* 10 */
/***/ (function(module, exports) {

	
	exports = module.exports = trim;

	function trim(str){
	  return str.replace(/^\s*|\s*$/g, '');
	}

	exports.left = function(str){
	  return str.replace(/^\s*/, '');
	};

	exports.right = function(str){
	  return str.replace(/\s*$/, '');
	};


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	var isFunction = __webpack_require__(12)

	module.exports = forEach

	var toString = Object.prototype.toString
	var hasOwnProperty = Object.prototype.hasOwnProperty

	function forEach(list, iterator, context) {
	    if (!isFunction(iterator)) {
	        throw new TypeError('iterator must be a function')
	    }

	    if (arguments.length < 3) {
	        context = this
	    }
	    
	    if (toString.call(list) === '[object Array]')
	        forEachArray(list, iterator, context)
	    else if (typeof list === 'string')
	        forEachString(list, iterator, context)
	    else
	        forEachObject(list, iterator, context)
	}

	function forEachArray(array, iterator, context) {
	    for (var i = 0, len = array.length; i < len; i++) {
	        if (hasOwnProperty.call(array, i)) {
	            iterator.call(context, array[i], i, array)
	        }
	    }
	}

	function forEachString(string, iterator, context) {
	    for (var i = 0, len = string.length; i < len; i++) {
	        // no such thing as a sparse string.
	        iterator.call(context, string.charAt(i), i, string)
	    }
	}

	function forEachObject(object, iterator, context) {
	    for (var k in object) {
	        if (hasOwnProperty.call(object, k)) {
	            iterator.call(context, object[k], k, object)
	        }
	    }
	}


/***/ }),
/* 12 */
/***/ (function(module, exports) {

	module.exports = isFunction

	var toString = Object.prototype.toString

	function isFunction (fn) {
	  var string = toString.call(fn)
	  return string === '[object Function]' ||
	    (typeof fn === 'function' && string !== '[object RegExp]') ||
	    (typeof window !== 'undefined' &&
	     // IE8 and below
	     (fn === window.setTimeout ||
	      fn === window.alert ||
	      fn === window.confirm ||
	      fn === window.prompt))
	};


/***/ }),
/* 13 */,
/* 14 */
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
/* 15 */
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