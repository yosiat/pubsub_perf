'use strict';

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var assign = require('lodash').assign;
var tsify = require('tsify');
var serve = require('gulp-serve');


// add custom browserify options here
var customOpts = {
  entries: ['./app.ts'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);


var b = watchify(
		browserify(opts)
			.add(__dirname + '/typings/tsd.d.ts')
			.plugin(tsify, { module: 'commonjs', target: 'es5' })
	);


gulp.task('js', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal


gulp.task('serve', serve('.'));

gulp.task('default', ['js', 'serve']);

function bundle() {
  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist'));
}
