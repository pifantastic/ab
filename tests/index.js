
var expect = chai.expect;

describe('ab', function () {

  beforeEach(function () {
    localStorage.clear();
    new ab.Storage('local').clear();
  });

  it('should slice you into a test', function () {
    var test = ab('header', 0.99);

    test.slices(['blue', 'green']).run();

    expect(['blue', 'green']).to.contain(test.slice().name);
  });

  it('should not slice you into a test if traffic is 0', function () {
    var test = ab('test', 0).slices(['a']);

    expect(test.slice()).to.equal(null);
  });

  it('should fire the ready callbacks', function () {
    var spy = sinon.spy();

    var test = ab('test', 0.99).slices(['a']);

    test.ready(spy);
    test.slice('a').ready(spy);
    test.run();

    expect(spy.calledTwice).to.equal(true);
  });

  it('should fire ready callbacks when they\'re bound late', function () {
    var spy = sinon.spy();

    var test = ab('test', 1).slices(['a']).run();

    test.ready(spy);
    test.slice().ready(spy);

    expect(spy.calledTwice).to.equal(true);
  });

});

describe('Events', function () {

  it('should fire events with arguments', function () {
    var spy = sinon.spy();

    ab.events.on('test', spy);
    ab.events.on('test', spy);

    ab.events.trigger('test', 1, 2, 3);

    expect(spy.calledWith(1, 2, 3)).to.equal(true);
    expect(spy.calledTwice).equal(true);
  });

});

describe('Storage', function () {

  beforeEach(function () {
    new ab.Storage('local').clear();
  });

  it('should set/get values', function () {
    var storage = new ab.Storage('local');

    storage.setItem('foo', 'bar');
    expect(storage.getItem('foo')).to.equal('bar');
  });

  it('should return default values for missing keys', function () {
    var storage = new ab.Storage('local');

    expect(storage.getItem('foo', 'hi!')).to.equal('hi!');

    storage.setItem('foo', 'bye!');
    expect(storage.getItem('foo', 'hi!')).to.equal('bye!');
  });

});

describe('Probability', function () {

  it('should slice within error margins', function () {
    var trials = 10000;
    var target = 0.5;
    var marginOfError = 0.01;
    var results = {};

    for (var x = 0; x < trials; x++) {
      new ab.Storage('local').removeItem('ab:test');
      localStorage.removeItem('ab:test');

      ab('test').slices(['a', 'b']).run().ready(function (slice) {
        results[slice.name] = results[slice.name] ? ++results[slice.name] : 1;
      });
    }

    Object.keys(results).forEach(function (slice) {
      expect(Math.abs((results[slice] / trials) - target)).to.be.lessThan(marginOfError);
    });

  });

});
