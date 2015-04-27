'use strict';

module.exports = function (grunt) {
  // Show elapsed time at the end
  require('time-grunt')(grunt);
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    bump: {
      options: {
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json', 'TODO.md', 'CHANGELOG.md'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        pushTo: 'origin'
      }
    },

    nodeunit: {
      files: ['test/**/*_test.js']
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      },
      cli: {
        src: ['crawler']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'nodeunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'nodeunit']
      },
      cli: {
        files: '<%= jshint.cli.src %>',
        tasks: ['jshint:test', 'nodeunit']
      }
    },
    todo: {
      options: {
        githubBoxes: true,
        file: "TODO.md",
      },
      src: [
        'test/*',
        'lib/*',
        'bin/*',
        'crawler'
      ],
    },

    changelog: {
      test: {
        options: {
          version: require('./package.json').version
        }
      }
    },

    docco: {
      debug: {
        src: ['bin/**/*.js', 'lib/**/*.js', 'test/**/*.js'],
        options: {
          output: 'docs/'
        }
      }

    }

  });


  grunt.loadNpmTasks('grunt-todo');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-docco');

  // Default task.
  grunt.registerTask('default', ['jshint', 'nodeunit', 'docco']);
  grunt.registerTask('prepare', ['jshint', 'todo', ]);
  grunt.registerTask('release', ['bump-only:minor', 'commit']);
  grunt.registerTask('patch', ['bump-only:patch', 'commit']);


  grunt.registerTask('build', ['default', 'prepare', 'bump']);

};