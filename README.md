[![Build Status](https://travis-ci.org/pifantastic/ab.png?branch=master)](https://travis-ci.org/pifantastic/ab) [![Dependency Status](https://david-dm.org/pifantastic/ab.png)](https://david-dm.org/pifantastic/ab) [![devDependency Status](https://david-dm.org/pifantastic/ab/dev-status.png)](https://david-dm.org/pifantastic/ab#info=devDependencies)

# ab

A javascript a/b testing library.

## Usage

```javascript
// Create a new test with two slices that goes to 50% of traffic.
ab('my-sweet-button', 0.50).slices('blue', 'green').run(function () {
  $('#sweet-button').addClass(this.slice.name);
});
```

### Reporting events

ab has a global event bus you can subscribe to.

#### start

Fired when a test is started for the first time.

#### Example

```javascript
ab.events('start', function (test) {
  analytics.track('ab test:' + test.name + ':' + test.slice.name);
});
```

## License

Copyright (c) 2014, Aaron Forsander

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
