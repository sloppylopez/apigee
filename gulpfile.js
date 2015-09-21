'use strict';

var gulp = require('gulp-param')(require('gulp'), process.argv),
    plugins = require('gulp-load-plugins')(),
    spawn = require('child_process').spawn,
    swaggerCodeGenerator = require('./api/swagger/scripts/swagger-code-generator'),
    spawned;

/**
 * $ gulp serve
 * description: launch the server. If there's a server already running, kill it.
 */
gulp.task('serve', function () {
    if (spawned) {
        spawned.kill();
    }
    spawned = spawn('node', ['app.js'], {stdio: 'inherit'});
    spawned.on('close', function (code) {
        if (code === 8) {
            plugins.util.log('Error detected, waiting for changes...');
        }
    });
});

/**
 * $ gulp swagger
 * description: Install swagger in your api and generates code based on the SCHEMA declared automatically
 * usage:  gulp swagger --framework nodejs --destinationFile slapi --fileFormat .js --destinationFolder ./swagger/
 * OR   gulp swagger --framework angularjs --destinationFile slapi --fileFormat .js --destinationFolder ./swagger/
 * additional info: fileFormat and destinationFile must be different look swaggerCodeGenerator()
 */
gulp.task('swagger', function (framework, destinationFile, fileFormat, destinationFolder) {
    gulp.start('schema');
    gulp.start('swagger-ui');
    plugins.util.log(swaggerCodeGenerator(framework || 'angularjs', destinationFile || 'slapi', fileFormat || '.js', destinationFolder || '../angulpar/src/app/swagger/'));
});

/**
 * $ gulp schema
 * description: generates the schema using the spec.js
 */
gulp.task('schema', function () {
    gulp.src('api/swagger/swagger.yaml')
        .pipe(plugins.swagger('spec-schema.json'))
        .pipe(gulp.dest('api/swagger/schemas'))
        .on('finish', function () {
            gulp.start('swagger-code-gen')
                .once('end', function () {
                    process.exit();
                });
        });
});

/**
 * $ gulp init
 * description: modifies swagger index.html to point to our project api spec schema
 */
gulp.task('init', function () {
    gulp.src(['node_modules/swagger-ui/dist/index.html'])
        .pipe(plugins.replace('http://petstore.swagger.io/v2/swagger.json', 'http://localhost:3002/spec'))//TODO this is hacky, i dont like it but i cant see any cleaner way to be able to have swagger updated automatically and not having to manually install it
        .pipe(gulp.dest('api/swagger/swagger-ui'));
});


/**
 * $ gulp swagger-ui
 * description: Copies the swagger-ui from swagger to out local project automatically
 */
gulp.task('swagger-ui', ['init'], function () {
    gulp.src(['node_modules/swagger-ui/dist/{,*/}*', '!node_modules/swagger-ui/dist/index.html'])
        .pipe(gulp.dest('api/swagger/swagger-ui'));
});

/**
 * $ gulp swagger-code-gen
 * description: Calls swagger-code-gen to autogenerates code from the spec.js
 * usage:  gulp swagger-code-gen --framework nodejs --destinationFile slapi --fileFormat .js --destinationFolder ./swagger/
 * OR   gulp swagger-code-gen --framework angularjs --destinationFile slapi --fileFormat .js --destinationFolder ./swagger/
 * additional info: fileFormat and destinationFile must be different look swaggerCodeGenerator();
 */
gulp.task('swagger-code-gen', function (framework, destinationFile, fileFormat, destinationFolder) {
    swaggerCodeGenerator(framework || 'angularjs', destinationFile || 'slapi', fileFormat || '.js', destinationFolder || '../angulpar/src/app/swagger/');
});


/**
 * $ gulp test
 * description: run tests using mocha and istambul lcov reporter
 */
gulp.task('test', function () {
    gulp.src(['api/**/*.js', 'app.js', '!api/swagger/*'])
        .pipe(plugins.istanbul()) // Covering files
        .pipe(plugins.istanbul.hookRequire()) // Force `require` to return covered files
        .on('finish', function () {
            gulp.src(['test/**/*.js'])
                .pipe(plugins.mocha({reporter: process.env.TRAVIS ? 'spec' : 'spec'}))
                .pipe(plugins.istanbul.writeReports()) // Creating the reports after tests ran
                .pipe(plugins.istanbul.enforceThresholds({thresholds: {global: 1}})) // Enforce a coverage of at least 1%
                .once('end', function () {
                    process.exit();
                });
        });
});

/**
 * $ gulp lint
 * description: linting with plugins.jshint
 */
gulp.task('lint', function () {
    return gulp.src(['api/{,*/}*.js', 'gulpfile.js', '!api/swagger/*'])
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'));
});

/**
 * $ gulp default
 * description: start the development environment.
 */
gulp.task('default', function () {
    plugins.util.log(process.env.TRAVIS + ' Travis environment');
    if (process.env.TRAVIS) {
        gulp.start('swagger');
    } else {
        gulp.start(['schema', 'swagger-ui', 'serve']);
    }
    gulp.watch(['api/{,*/}*.js'], ['schema', 'swagger-ui', 'serve']);
    plugins.util.log('Server up and running...');
});

// kills zombies automatically
process.on('exit', function () {
    if (spawned) {
        spawned.kill();
    }
});