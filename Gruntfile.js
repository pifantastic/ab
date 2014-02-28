
module.exports = function (grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

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

  });

  grunt.loadNpmTasks('grunt-mocha');

  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['mocha']);

};
