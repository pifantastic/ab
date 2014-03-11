/* jshint loopfunc: true */

var expect = chai.expect;

describe('ab', function () {

  beforeEach(ab.clear);

  it('should create a new test', function () {
    expect(ab('test')).to.be.an('object');
  });

  it('should set traffic when supplied as the second argument', function () {
    expect(ab('test', 0.1337).traffic).to.equal(0.1337);
  });

  it('should return a previously created test', function () {
    expect(ab('test')).to.deep.equal(ab('test'));
  });

  describe('noConflict()', function () {

    it('should restore window.ab to its previous value', function () {
      var ab = window.ab.noConflict();
      expect(window.ab).to.be.an('undefined');
      window.ab = ab;
    });

  });

  describe('Test', function () {

    describe('run()', function () {

      it('should slice you into a test', function () {
        var test = ab('test').slices('blue', 'green').run();
        expect(['blue', 'green']).to.contain(test.slice.name);
      });

      it('should not slice you into a test if traffic is 0', function () {
        expect(ab('test', 0).slices(['a']).run().slice.name).to.equal('control');
      });

      it('should fire the run callback', function () {
        var spy = sinon.spy();
        ab('test').slices('a', 'b').run(spy);
        expect(spy.calledOnce).to.equal(true);
      });

      it('should fire the run callback with the test as the context', function () {
        var test = ab('test').slices('a', 'b');
        test.run(function () {
          expect(test).to.deep.equal(this);
        });
      });

      it('should trigger the run event', function () {
        var spy = sinon.spy();
        ab.events.on('run', spy);
        var test = ab('test').slices('a', 'b').run();
        expect(spy.calledWith(test)).to.equal(true);
        expect(spy.calledOnce).to.equal(true);
      });

      it('should trigger the start event on first slice', function () {
        var spy = sinon.spy();
        ab.events.on('start', spy);
        var test = ab('test').slices('a', 'b').run();
        expect(spy.calledWith(test)).to.equal(true);
        expect(spy.calledOnce).to.equal(true);
      });

      it('should not trigger the start event on subsequent slices', function () {
        var test = ab('test').slices('a', 'b').run();
        var spy = sinon.spy();
        ab.events.on('start', spy);
        test.run();
        expect(spy.callCount).to.equal(0);
      });

      it('should slice within error margins', function () {
        var trials = 10000, results = {};
        var test = ab('test', 0.75).slices('a', 'b', 'c');

        for (var x = 0; x < trials; x++) {
          localStorage.removeItem('ab:test');

          test.run(function () {
            results[this.slice.name] = results[this.slice.name] ? ++results[this.slice.name] : 1;
          });
        }

        ['a', 'b', 'c', 'control'].forEach(function (slice) {
          var error = (results[slice] / trials) - 0.25;
          expect(error).to.be.within(-0.01, 0.01);
        });
      });

      it('should allow the URL to override the slice', function () {
        var slices = ['a', 'b', 'c', 'd', 'e'];
        var test = ab('test').slices(slices);

        slices.forEach(function (slice) {
          window.location.hash = 'ab:test=' + slice;
          test.run();
          expect(test.slice.name).to.equal(slice);
        });

        window.location.hash = '';
      });

      it('should remember your slice', function () {
        var test = ab('test').slices('a', 'b', 'c', 'd', 'e', 'f').run();
        var slice = test.slice;

        var every = Array(100).every(function () {
          return test.run().slice.name === slice.name;
        });

        expect(every).to.equal(true);
      });

    });

    describe('slices()', function () {

      it('should accept an array or multiple arguments', function () {
        var test1 = ab('test1').slices('blue', 'green').run();
        expect(Object.keys(test1._slices)).to.deep.equal(['blue', 'green']);

        var test2 = ab('test2').slices(['red', 'yellow']).run();
        expect(Object.keys(test2._slices)).to.deep.equal(['red', 'yellow']);
      });

      it('should throw an error if adding slices after running', function () {
        expect(function () {
          ab('test').slices('blue').run().slices('green');
        }).to.throw(Error);
      });

    });

    describe('script()', function () {

      it('should load the specified script', function () {
        ab('test').run(function () {
          this.script('../lib/example.js');
          var $script = $('script[src="../lib/example.js"]').remove();
          expect($script.length).to.equal(1);
          expect($script.prop('async')).to.equal(true);
        });
      });

      it('should load the specified script synchronously', function () {
        ab('test').run(function () {
          this.script('../lib/example.js', false);
          var $script = $('script[src="../lib/example.js"]').remove();
          expect($script.length).to.equal(1);
          expect($script.prop('async')).to.equal(false);
        });
      });

    });

    describe('style()', function () {

      it('should load the specified style', function () {
        ab('test').run(function () {
          this.style('../lib/example.css');
          var $link = $('link[href="../lib/example.css"]').remove();
          expect($link.length).to.equal(1);
        });
      });

    });

    describe('hasSlice()', function () {

      it('should return true if the test has the slice', function () {
        var test = ab('test').slices('a', 'b', 'c');
        expect(test.hasSlice('b')).to.equal(true);
      });

      it('should return false if the test does not have the slice', function () {
        var test = ab('test').slices('a', 'b', 'c');
        expect(test.hasSlice('foo')).to.equal(false);
      });

      it('should return true for tests with control slices', function () {
        var test = ab('test', 0.5).slices('a', 'b', 'c');
        expect(test.hasSlice('control')).to.equal(true);
      });

      it('should return false for tests without control slices', function () {
        var test = ab('test').slices('a', 'b', 'c');
        expect(test.hasSlice('control')).to.equal(false);
      });

    });

    describe('getSlice()', function () {

      it('should get the slice object with the given name', function () {
        var test = ab('test').slices('a', 'b', 'c');
        expect(test.getSlice('a').name).to.equal('a');
        expect(test.getSlice('control').name).to.equal('control');
      });

    });

    describe('urlSlice', function () {

      it('TODO', function () {});

    });

  });

  describe('Events', function () {

    it('should fire all handlers for an event', function () {
      var spy = sinon.spy();
      var events = new ab.Events();
      events.on('test', spy);
      events.on('test', spy);
      events.trigger('test', 1, 2, 3);
      expect(spy.calledWith(1, 2, 3)).to.equal(true);
      expect(spy.calledTwice).to.equal(true);
    });

  });

});
