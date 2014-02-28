
var expect = chai.expect;

describe('test', function () {

	beforeEach(function () {
		localStorage.clear();
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
