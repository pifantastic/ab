
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

    getItem: function (key, defaultValue) {
      return data[key] === undefined ?
        (typeof defaultValue === 'undefined' ? null : defaultValue) :
        data[key];
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


var Events = {

  _events: {},

  trigger: function (name) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var event in this._events) {
      if (this._events.hasOwnProperty(event)) {
        for (var x = 0, len = this._events[name].length; x < len; x++) {
          this._events[name][x].apply(window, args);
        }
      }
    }
  },

  on: function (name, callback) {
    if (!this._events.hasOwnProperty(name)) {
      this._events[name] = [];
    }

    this._events[name].push(callback);
  }

};

/**
 * [Slice description]
 * @param {[type]} name [description]
 */
function Slice (name) {
  this.name = name;
  this._ready = [];
}

/**
 * [test description]
 * @param  {[type]} test [description]
 * @return {[type]}      [description]
 */
Slice.prototype.test = function (test) {
  this.test = test;
  return this;
};

/**
 * [ready description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Slice.prototype.ready = function (callback) {
  if (typeof callback === 'undefined') {
    for (var x = 0, len = this._ready.length; x < len; x++) {
      this._ready[x](this);
    }
  }
  else if (this.test._slice && this.test._slice.name === this.name) {
    callback(this);
  }
  else {
    this._ready.push(callback);
  }

  return this;
};


/**
 * [Test description]
 * @param {[type]} name    [description]
 * @param {[type]} traffic [description]
 */
function Test (name, traffic) {
  this.name = name;
  this.traffic = traffic;
  this.storage = storageSupported('local') ? window.localStorage : new Storage('local');
  this._slices = {};
  this._slice = null;
  this._ready = [];
}

/**
 * [slices description]
 * @param  {[type]} slices [description]
 * @return {[type]}        [description]
 */
Test.prototype.slices = function (slices) {
  for (var x = 0, len = slices.length; x < len; x++) {
    this.add(new Slice(slices[x]).test(this));
  }
  return this;
};

/**
 * [add description]
 * @param {[type]} slice [description]
 */
Test.prototype.add = function (slice) {
  this._slices[slice.name] = slice;
  return this;
};

/**
 * [slice description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
Test.prototype.slice = function (name) {
  if (typeof name !== 'undefined') {
    return this._slices[name];
  }

  return this._slice;
};

/**
 * [run description]
 * @return {[type]} [description]
 */
Test.prototype.run = function () {
  // List of all slice names.
  var slices = Object.keys(this._slices);

  // Check if user was already not sliced into this test.
  if (this.storage.getItem(this.name) === false) {
    return this;
  }
  // See if the user has already been put into a slice.
  else if (this.storage.getItem(this.name) !== null) {
    this._slice = this.slice(this.storage.getItem(this.name));
    this.ready();
    this._slice.ready();
  }
  // See if this user should be sliced into this test at all.
  else if (Math.random() > this.traffic) {
    this.storage.setItem(this.name, false);
  }
  // Chose a slice for the user.
  else {
    var index = Math.floor(Math.random() / (1.0 / slices.length));
    this._slice = this.slice(slices[index]);
    this.storage.setItem(this.name, this._slice.name);
    this.ready();
    this._slice.ready();
  }

  return this;
};

/**
 * [ready description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Test.prototype.ready = function (callback) {
  if (typeof callback === 'undefined') {
    for (var x = 0, len = this._ready.length; x < len; x++) {
      this._ready[x](this._slice);
    }
  }
  else if (this._slice) {
    callback(this._slice);
  }
  else {
    this._ready.push(callback);
  }

  return this;
};


/**
 * [ab description]
 * @param  {[type]} name    [description]
 * @param  {[type]} traffic [description]
 * @return {[type]}         [description]
 */
window.ab = function (name, traffic) {
  if (typeof traffic === 'undefined') {
    traffic = 1;
  }

  return new Test(name, traffic);
};

/**
 * [config description]
 * @type {Object}
 */
window.ab.config = {
  STORAGE_PREFIX: 'ab:'
};

// Exposed mostly for testing purposes.
window.ab.Test = Test;
window.ab.Slice = Slice;
window.ab.Storage = Storage;
window.ab.Events = Events;

})();
