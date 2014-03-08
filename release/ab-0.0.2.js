/*! ab - v0.0.2 - 2014-03-08 */

(function() {

/**
 * Test for storage support.
 *
 * @param {String} type 'session' or 'local'
 */
var storageSupported = function(type) {
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

  function createCookie(name, value, days) {
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

  function readCookie(name) {
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

  function setData(data) {
    data = JSON.stringify(data);
    if (type === 'session') {
      window.name = data;
    }
    else {
      createCookie('localStorage', data, 365);
    }
  }

  function clearData() {
    if (type === 'session') {
      window.name = '';
    }
    else {
      createCookie('localStorage', '', 365);
    }
  }

  function getData() {
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

function Events() {
  this._events = {};
}

Events.prototype.trigger = function (name) {
  var args = Array.prototype.slice.call(arguments, 1);

  if (this._events.hasOwnProperty(name)) {
    for (var x = 0, len = this._events[name].length; x < len; x++) {
      this._events[name][x].apply(window, args);
    }
  }
};

Events.prototype.on = function (name, callback) {
  if (!this._events.hasOwnProperty(name)) {
    this._events[name] = [];
  }

  this._events[name].push(callback);
};

/**
 * Slice object.
 *
 * @param {String}  name
 * @param {Boolean} forced
 */
function Slice (name, forced) {
  this.name = name;
  this.forced = !!forced;
}

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
  this.storage = storageSupported('local') ? window.localStorage : new Storage('local');
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
  var urlSlice = this.urlSlice();
  var storedSlice = this.storedSlice();

  // Check the URL for a slice override.
  if (urlSlice && this.hasSlice(urlSlice)) {
    this.slice = this._slices[urlSlice];
    this.slice.forced = true;
    // TODO: Trigger start event for overrides?
    // ab.events.trigger('start', this);
  }

  // Check if the user has been sliced-out of the test.
  else if (storedSlice === false) {
    this.slice = new Slice('control');
  }

  // Check storage for an existing slice.
  else if (storedSlice !== null && this.hasSlice(storedSlice)) {
    this.slice = this._slices[storedSlice];
  }

  // Make sure the user belongs in the test.
  else if (Math.random() > this.traffic) {
    this.slice = new Slice('control');
    this.storage.setItem(this.key(), JSON.stringify(false));
    ab.events.trigger('start', this);
  }

  // Choose a slice for the user.
  else {
    this.slice = this.chooseSlice();
    this.storage.setItem(this.key(), JSON.stringify(this.slice.name));
    ab.events.trigger('start', this);
  }

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

  for (var slice in this._slices) {
    if (this._slices.hasOwnProperty(slice)) {
      slices.push(slice);
    }
  }

  if (slices.length === 0) {
    return new Slice('control');
  }

  var index = Math.floor(Math.random() / (1.0 / slices.length));
  return this._slices[slices[index]];
};

/**
 * Check if a test includes a slice.
 *
 * @param  {String}  name
 * @return {Boolean}
 */
Test.prototype.hasSlice = function (name) {
  return this._slices.hasOwnProperty(name);
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
 * Retrieve a slice from local storage.
 *
 * @return {String|null}
 */
Test.prototype.storedSlice = function () {
  try {
    return JSON.parse(this.storage.getItem(this.key()));
  }
  catch (e) {
    return null;
  }
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
 * Clear this test from local storage.
 */
Test.prototype.clear = function () {
  var storage = storageSupported('local') ? window.localStorage : new Storage('local');
  storage.removeItem(this.key());
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

/**
 * Test registry.
 *
 * @type {Object}
 */
var _tests = {};

/**
 * Save a reference to whatever previously occupied the global
 * 'ab' variable.
 *
 * @type {Object}
 */
var _ab = window.ab;

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
ab.version = '0.0.2';

/**
 * Global ab configuration
 *
 * @type {Object}
 */
ab.config = {
  STORAGE_PREFIX: 'ab:'
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
