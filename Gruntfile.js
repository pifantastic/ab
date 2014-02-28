
module.exports = function (grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

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
      test: {
        src: ['tests/index.html'],
        options: {
          reporter: 'Spec',
          run: true
        }
      }
    },

    'saucelabs-mocha': {
      test: {
        options: {
          urls: ['http://127.0.0.1:9999/tests/index.html'],
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
    }

  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-mocha');

  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['connect', 'saucelabs-mocha']);

};
