
var fs = require('fs');
var zlib = require('zlib');

module.exports = function (grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    version: '<%= pkg.version %>',

    license: grunt.file.read('LICENSE'),

    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %> */\n',

    clean: {
      build: {
        src: 'dist'
      }
    },

    concat: {
      options: {
        stripBanners: true,
        banner: '<%= banner %>',
      },
      dist: {
        src: ['index.js'],
        dest: 'dist/ab.js',
      },
    },

    uglify: {
      build: {
        options: {
          banner: '<%= banner %>'
        },
        files: {
          'dist/ab.min.js': ['index.js']
        }
      }
    },

    connect: {
      test: {
        options: {
          base: '',
          port: 9999
        }
      }
    },

    mocha: {
      options: {
        log: true,
        logErrors: true
      },
      dev: {
        src: ['tests/runners/dev.html'],
        options: {
          reporter: 'Nyan',
          run: true
        }
      },
      build: {
        src: ['tests/runners/build.html'],
        options: {
          reporter: 'Nyan',
          run: true
        }
      }
    },

    'saucelabs-mocha': {
      test: {
        options: {
          urls: ['http://127.0.0.1:9999/tests/runners/sauce.html'],
          tunnelTimeout: 5,
          build: process.env.TRAVIS_JOB_ID,
          concurrency: 3,
          browsers: [{
            browserName: 'chrome',
            platform: 'linux'
          }],
          testname: 'mocha tests',
          tags: ['master']
        }
      }
    },

    jshint: {
      all: [
        'Gruntfile.js',
        'index.js',
        'tests/*.js',
        'examples/*.js'
      ],
      options: {
        '-W084': true,
        '-W107': true
      }
    },

    copy: {
      release: {
        files: [{
          src: 'dist/ab.js',
          dest: 'release/ab-<%= version %>.js'
        }, {
          src: 'dist/ab.min.js',
          dest: 'release/ab-<%= version %>.min.js'
        }]
      }
    }

  });

  grunt.registerTask('size', 'Measure the size of the ab release.', function () {
    var done = this.async();
    var files = ['dist/ab.min.js', 'dist/ab.js'];
    var count = 0;

    files.forEach(function (file, index) {
      zlib.gzip(grunt.file.read(file), function (err, buffer) {
        var uSize = fs.lstatSync(file).size.toString();
        var cSize = buffer.length.toString();

        grunt.log.writeln('%s is %s bytes (%s compressed)', file, uSize.cyan, cSize.green);

        if (++count === 2) {
          done();
        }
      });
    });
  });

  /**
   * Using the version in the package.json, set the correct version
   * of the current release files and the bower config.
   */
  grunt.registerTask('version', 'Set the version of the ab release.', function () {
    var files = ['dist/ab.min.js', 'dist/ab.js'];
    var version = grunt.config('version');

    // Set the version in the release files.
    files.forEach(function (file) {
      var content = grunt.file.read(file).replace('__VERSION__', version);
      grunt.file.write(file, content);
      grunt.log.writeln('%s version set to %s', file, version.magenta);
    });

    // Set the version in the bower config.
    var bower = grunt.file.readJSON('bower.json');
    bower.version = version;
    grunt.file.write('bower.json', JSON.stringify(bower, ' ', 2));
    grunt.log.writeln('bower.json version set to %s', version.magenta);
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-mocha');

  grunt.registerTask('default', ['test']);
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('test', ['lint', 'mocha:dev']);
  grunt.registerTask('build', ['clean', 'uglify', 'concat', 'mocha:build', 'size']);
  grunt.registerTask('release', ['build', 'copy', 'version']);

};
