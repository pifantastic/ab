/*! ab - v0.0.3 - 2014-03-24 */

(function() {

// TODO: Smarter logic for when window.ab already exists.

/**
 * Test registry.
 *
 * @type {Object}
 */
var _tests = {};

/**
 * Create/retrieve and ab test.
 *
 * @param  {String} name
 * @param  {Float} traffic
 * @return {Test}
 */
var ab = function (name, traffic, slices) {
  if (_tests.hasOwnProperty(name)) {
    return _tests[name];
  }

  if (typeof traffic === 'undefined') {
    traffic = 1;
  }

  _tests[name] = new Test(name, traffic);

  if (slices && slices.length) {
    _tests[name].slices(slices);
  }

  return _tests[name];
};

/**
 * Clear all tests from local storage.
 */
ab.clear = function () {
  for (var test in _tests) {
    if (_tests.hasOwnProperty(test)) {
      _tests[test].clear();
    }
  }

  _tests = {};
};

/**
 * Save a reference to whatever previously occupied the global
 * 'ab' variable.
 *
 * @type {Object}
 */
var _ab = window.ab;

/**
 * Restore the global 'ab' variable. Return the ab object.
 *
 * @return {Object}
 */
ab.noConflict = function () {
  window.ab = _ab;
  return ab;
};

/**
 * Event bus.
 *
 * @type {Events}
 */
ab.events = new Events();

/**
 * ab version.
 *
 * @type {String}
 */
ab.version = '__VERSION__';

/**
 * Global ab configuration
 *
 * @type {Object}
 */
ab.config = {
  STORAGE_PREFIX: 'ab:'
};

/**
 * Test for storage support.
 *
 * @param {String} type 'session' or 'local'
 */
var storageSupported = function (type) {
  var test = 'test';
  try {
    window[type + 'Storage'].setItem(test, test);
    window[type + 'Storage'].removeItem(test);
    return true;
  }
  catch (e) {
    return false;
  }
};

/**
 * https://gist.github.com/remy/350433
 *
 * @param {String} type 'session' or 'local'
 */
var Storage = function (type) {

  function createCookie (name, value, days) {
    var date;
    var expires;

    if (days) {
      date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toGMTString();
    }
    else {
      expires = '';
    }

    document.cookie = name + '=' + value + expires + '; path=/';
  }

  function readCookie (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    var i;
    var c;

    for (i = 0; i < ca.length; i++) {
      c = ca[i];

      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }

    return null;
  }

  function setData (data) {
    data = JSON.stringify(data);
    if (type === 'session') {
      window.name = data;
    }
    else {
      createCookie('localStorage', data, 365);
    }
  }

  function clearData () {
    if (type === 'session') {
      window.name = '';
    }
    else {
      createCookie('localStorage', '', 365);
    }
  }

  function getData () {
    var data = type === 'session' ? window.name : readCookie('localStorage');
    try {
      return data ? JSON.parse(data) : {};
    }
    catch (e) {
      return {};
    }
  }

  // initialise if there's already data
  var data = getData();

  return {
    length: 0,

    clear: function () {
      data = {};
      this.length = 0;
      clearData();
    },

    getItem: function (key) {
      return data[key] === undefined ? null : data[key];
    },

    key: function (i) {
      // not perfect, but works
      var ctr = 0;
      for (var k in data) {
        if (ctr == i) {
          return k;
        }
        else {
          ctr += 1;
        }
      }
      return null;
    },

    removeItem: function (key) {
      delete data[key];
      this.length -= 1;
      setData(data);
    },

    setItem: function (key, value) {
      data[key] = value + ''; // forces the value to a string
      this.length += 1;
      setData(data);
    }
  };
};

var localStorage = storageSupported('local') ? window.localStorage : new Storage('local');

/**
 * Simple event system.
 */
function Events() {
  this._events = {};
}

/**
 * Trigger an event.
 *
 * @param  {String} name
 */
Events.prototype.trigger = function (name) {
  var args = Array.prototype.slice.call(arguments, 1);

  if (this._events.hasOwnProperty(name)) {
    for (var x = 0, len = this._events[name].length; x < len; x++) {
      this._events[name][x].apply(window, args);
    }
  }
};

/**
 * Subscribe to an event.
 *
 * @param  {String}   name
 * @param  {Function} callback
 */
Events.prototype.on = function (name, callback) {
  if (!this._events.hasOwnProperty(name)) {
    this._events[name] = [];
  }

  this._events[name].push(callback);
};

/**
 * Slice object.
 *
 * @param {String}  name The name of the test slice.
 */
function Slice (name) {
  this.name = name;
}

/**
 * String representation of the slice.
 *
 * @return {String}
 */
Slice.prototype.toString = function () {
  return this.name;
};

/**
 * JSON representation of the slice.
 *
 * @return {Object}
 */
Slice.prototype.toJSON = function () {
  return {
    name: this.name
  };
};

/**
 * Test object.
 *
 * @param {String} name
 * @param {Float}  traffic Amount of traffic to put into the test
 */
function Test (name, traffic) {
  this.name = name;
  this.traffic = traffic;
  this.slice = null;
  this.storage = localStorage;
  this._slices = {};
}

/**
 * Set the test's slices.
 *
 * @param  {Array} slices
 * @return {this}
 */
Test.prototype.slices = function (slices) {
  if (this.slice !== null) {
    throw new Error('Attempted to add slices to already running test.');
  }

  if (Object.prototype.toString.call(slices) !== '[object Array]') {
    slices = Array.prototype.slice.call(arguments, 0);
  }

  for (var x = 0, len = slices.length; x < len; x++) {
    this.add(new Slice(slices[x]));
  }

  return this;
};

/**
 * Add a slice to this test.
 *
 * @param {Slice} slice
 */
Test.prototype.add = function (slice) {
  this._slices[slice.name] = slice;
  return this;
};

/**
 * Run the test. Slices the user into the correct slice. If the user
 * has already been sliced into the test, uses the correct slice.
 *
 * @return {this}
 */
Test.prototype.run = function (callback) {
  // Check for a URL override and fallback to local storage.
  var slice = this.urlSlice() || this.storedSlice();

  // Check that the slice exists as it's possible that the slice
  // defined in local storage was not defined at runtime.
  if (slice && this.hasSlice(slice)) {
    this.slice = this.getSlice(slice);
  }

  // Make sure the user belongs in the test.
  else if (Math.random() > this.traffic) {
    this.slice = new Slice('control');
    ab.events.trigger('start', this);
  }

  // Choose a slice for the user.
  else {
    this.slice = this.chooseSlice();
    ab.events.trigger('start', this);
  }

  // Save the slice to local storage.
  this.storage.setItem(this.key(), this.slice.name);

  if (typeof callback === 'function') {
    callback.call(this);
  }

  ab.events.trigger('run', this);

  return this;
};

/**
 * Select a slice for the user.
 *
 * @return {Slice}
 */
Test.prototype.chooseSlice = function () {
  var slices = [];

  // Get an array of all slice names.
  for (var slice in this._slices) {
    if (this._slices.hasOwnProperty(slice)) {
      slices.push(slice);
    }
  }

  if (slices.length === 0) {
    return new Slice('control');
  }

  var index = Math.floor(Math.random() / (1.0 / slices.length));
  return this.getSlice(slices[index]);
};

/**
 * Check if a test includes a slice.
 *
 * @param  {String}  name
 * @return {Boolean}
 */
Test.prototype.hasSlice = function (name) {
  return (name === 'control' && this.traffic < 1) || this._slices.hasOwnProperty(name);
};

/**
 * Get a slice by name.
 *
 * @param  {String} name
 * @return {Slice}
 */
Test.prototype.getSlice = function (name) {
  return name === 'control' ? new Slice('control') : this._slices[name];
};

/**
 * Get a slice from the URL. Returns false if the URL
 * does not contain a slice.
 *
 * @return {String|Boolean}
 */
Test.prototype.urlSlice = function () {
  var hash = window.location.hash;
  var search = window.location.search;
  var match;

  // Matches '<prefix>:<test>=<slice>'
  // TOOO: Improve this regex. Define what a valid slice name is.
  var re = new RegExp('(' + this.key() + ')=([\\w0-9]+)');

  if (match = hash.match(re)) {
    return match[2];
  }
  else if (match = search.match(re)) {
    return match[2];
  }

  return false;
};

/**
 * Retrieve a slice from local storage. Returns null if there is no slice in
 * local storage.
 *
 * @return {String|null}
 */
Test.prototype.storedSlice = function () {
  return this.storage.getItem(this.key());
};

/**
 * Get the key for the test.
 *
 * @return {String}
 */
Test.prototype.key = function () {
  return ab.config.STORAGE_PREFIX + this.name;
};

/**
 * String representation of this test.
 *
 * @return {String}
 */
Test.prototype.toString = function () {
  return this.key();
};

/**
 * Clear this test from local storage.
 */
Test.prototype.clear = function () {
  this.storage.removeItem(this.key());
};

/**
 * Load a stylesheet.
 *
 * @param  {String} href
 */
Test.prototype.style = function (href) {
  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = href;
  document.head.appendChild(style);
  return this;
};

/**
 * Load a script.
 *
 * @param  {String} src
 */
Test.prototype.script = function (src, async) {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = (typeof async === 'undefined') ? true : !!async;
  script.src = src;
  var firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(script, firstScript);
  return this;
};

ab.Test = Test;
ab.Slice = Slice;
ab.Storage = Storage;
ab.Events = Events;

if (typeof module !== 'undefined' && module.exports && typeof require !== 'undefined') {
  module.exports = ab;
}
else if (typeof define === 'function' && define.amd) {
  define('ab', function () {
    return ab;
  });
}
else {
  window.ab = ab;
}

})();
