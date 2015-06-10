'use strict';

module.exports = function(grunt) {
    var port = '9000';
    var connect = require('./node_modules/grunt-contrib-connect/tasks/connect');

    /*** File paths for your source files **/
    var sourceFilePaths = ['windowmanager.js'];

    /*** File paths for test**/
    var mochaSource = ['test/**/*.test.js'];

    /*** File paths for documentation **/
    var documentationPaths = ['index.md', 'examples'];

    /*** File paths for watch **/
    var watchPaths = documentationPaths.concat(sourceFilePaths).concat(['examples/**/*.*']);

    grunt.initConfig({
        watch: {
            scripts: {
                files: watchPaths,
                tasks: ['docs'],
                options: {
                    spawn: false,
                }
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    require: [
                        function(){
                            require('blanket')({ pattern: "windowmanager.js" });
                        },
                        //Globally include the chai expect module so each test doesn't
                        //need to manually require it
                        function(){
                            var chai = require('chai');
                            chai.should();
                            global.assert = chai.assert;
                            global.expect = chai.expect;
                        }
                    ]
                },
                src: mochaSource
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    // use the quiet flag to suppress the mocha console output
                    quiet: true,
                    // specify a destination file to capture the mocha
                    // output (the quiet option does not suppress this)
                    captureFile: 'bin/coverage/index.html'
                },
                src: mochaSource
            }
        },

        connect: {
            all: {
                options:{
                    port: 9000,
                    hostname: "0.0.0.0",
                    // Prevents Grunt to close just after the task (starting the server) completes
                    // This will be removed later as `watch` will take care of that
                    keepalive: true
                }
            }
        },

        // grunt-open will open your browser at the project's URL
        open: {
            all: {
                // Gets the port from the connect configuration
                path: 'http://localhost:<%= connect.all.options.port%>/test/test.html'
            }
        },
        shell: {
            "install-deps": {
                command: 'npm install'
            },
            "github-pages-delete": {
                command: 'hasPages=`git branch --list gh-pages`; if [ -n "$hasPages" ]; then git branch -D gh-pages; else echo boo; fi'
            },
            "github-pages-checkout": {
                command: 'git checkout -b gh-pages'
            },
            "github-pages-add": {
                command: 'git add -A'
            },
            "github-pages-commit": {
                command: 'git commit -m "Docs for github"'
            },
            "github-pages-push": {
                command: [
                    'git push github gh-pages'
                ]
            },
            "movedocs": {
                command: "mv doc/* ."
            },
            "renamemain": {
                command: "cp index.md.html index.html"
            },
            docker: {
                command:'node ./node_modules/docker/docker --css resources/docs-style.css -o doc ' + documentationPaths.concat(sourceFilePaths).join(" ")
            }
        },
        clean: {
            rest: ["*",
                "!doc",
                "!node_modules",
                "!resources"].concat(sourceFilePaths.map(function(val) {
                    return '!' + val;
                }))
        }
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks('grunt-shell');

    // Creates the `server` task
    grunt.registerTask('default',[
        'test'
    ]);

    grunt.registerTask('test', [
        'open',
        'connect'
    ]);

    // Creates the `server` task
    grunt.registerTask('docs', [
        'shell:install-deps',
        'shell:docker'
    ]);

    grunt.registerTask('publishDocs', function() {
        grunt.task.run([
            'shell:github-pages-delete',
            'shell:github-pages-checkout',
            'clean:rest',
            'shell:movedocs',
            'shell:renamemain',
            'shell:github-pages-add',
            'shell:github-pages-commit'
        ]);
    });
};