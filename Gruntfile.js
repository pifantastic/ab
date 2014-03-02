
module.exports = function (grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

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
        src: ['tests/dev.html'],
        options: {
          reporter: 'Spec',
          run: true
        }
      },
      build: {
        src: ['tests/build.html'],
        options: {
          reporter: 'Spec',
          run: true
        }
      }
    },

    'saucelabs-mocha': {
      test: {
        options: {
          urls: ['http://127.0.0.1:9999/tests/sauce.html'],
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

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-mocha');

  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['mocha', 'connect', 'saucelabs-mocha']);
  grunt.registerTask('build', ['clean', 'uglify', 'concat']);

};
