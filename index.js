
function Storage () {}

Storage.prototype.set = function (key, val) {
  key = window.ab.config.STORAGE_PREFIX + key;
  localStorage.setItem(key, JSON.stringify(val));
};

Storage.prototype.get = function (key, defaultValue) {
  key = window.ab.config.STORAGE_PREFIX + key;
  var value = localStorage.getItem(key);

  if (value === null && typeof defaultValue !== 'undefined') {
    return defaultValue;
  }

  try {
    return JSON.parse(value);
  }
  catch (e) {
    return null;
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

Slice.prototype.test = function (test) {
  this.test = test;
  return this;
};

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
  this.storage = new Storage();
  this._slices = {};
  this._slice = null;
  this._ready = [];
}

Test.prototype.slices = function (slices) {
  for (var x = 0, len = slices.length; x < len; x++) {
    this.add(new Slice(slices[x]).test(this));
  }
  return this;
};

Test.prototype.add = function (slice) {
  this._slices[slice.name] = slice;
  return this;
};

Test.prototype.slice = function (name) {
  if (typeof name !== 'undefined') {
    return this._slices[name];
  }

  return this._slice;
};

Test.prototype.run = function () {
  // List of all slice names.
  var slices = Object.keys(this._slices);

  // Check if user was already not sliced into this test.
  if (this.storage.get(this.name) === false) {
    return this;
  }
  // See if the user has already been put into a slice.
  else if (this.storage.get(this.name) !== null) {
    this._slice = this.slice(this.storage.get(this.name));
    this.ready();
    this._slice.ready();
  }
  // See if this user should be sliced into this test at all.
  else if (Math.random() > this.traffic) {
    this.storage.set(this.name, false);
  }
  // Chose a slice for the user.
  else {
    var index = Math.floor(Math.random() / (1.0 / slices.length));
    this._slice = this.slice(slices[index]);
    this.storage.set(this.name, this._slice.name);
    this.ready();
    this._slice.ready();
  }

  return this;
};

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
  return new Test(name, traffic);
};

window.ab.config = {
  STORAGE_PREFIX: 'ab:'
};
