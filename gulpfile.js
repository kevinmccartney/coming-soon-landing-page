/*
 * Big ups to Aaron Lasseinge for writing this great article on how
 * to use Gulp with Jekyll.
 * https://aaronlasseigne.com/2016/02/03/using-gulp-with-jekyll/
 */

'use strict';

var browserSync = require('browser-sync').create();
var child = require('child_process');
var clean = require('gulp-clean');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var del = require('del');
var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var htmlMin = require('gulp-htmlmin');
var imgMin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var order = require('gulp-order');
var print = require('gulp-print');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var runSeq = require('run-sequence');

var config = {
    env: '',
}

gulp.task('set-dev', function() {
    config.env = 'develop';
    gutil.log(config.env);
});

gulp.task('set-deploy', function() {
    config.env = 'deploy';
    gutil.log(config.env);
});

gulp.task('jekyll', function() {
   // setting the environment variables
   process.env.JEKYLL_ENV = config.env;
    var jekyllConf = '--config ' + config.env + '.yml';

   var jekyll = child.spawn('jekyll', [
        'build',
        jekyllConf,
        ], process.env);

    var jekyllLogger = function(buffer) {
        buffer.toString()
            .split(/\n/)
            .forEach(function(message) {
                gutil.log('Jekyll: ' + message);
            });
    }

    jekyll.stdout.on('data', jekyllLogger);
    jekyll.stderr.on('data', jekyllLogger);
});

gulp.task('serve', function() {
    var siteRoot = 'dist';
    browserSync.init({
        files: [siteRoot + '/**'],
        port: 4000,
        server: {
            baseDir: siteRoot
        }
    });
});

gulp.task('clean', function() {
    if (fs.exists('dist/assets')) {
        return gulp.src('dist/assets')
        .pipe(clean({read: false}));
    }
});

gulp.task('copy', function() {
    return gulp.src('src/_assets/**/*')
    .pipe(gulp.dest('dist/assets'));
});

gulp.task('compile-scss', function() {
    return gulp.src('src/_assets/styles/scss/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('dist/assets/styles'))
});

gulp.task('jshint', function() {
    return gulp.src('src/_assets/scripts/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest('dist/assets/scripts'))
});

gulp.task('watch', function() {
    gulp.watch(config.scss, ['build-scss']);
    gulp.watch(config.js, ['jshint']);
});

gulp.task('build-scripts', function() {
    return gulp.src('dist/assets/scripts/*.js')
    .pipe(order([
        'bootstrap.js',
        'jquery-3.1.1.js',
        'modernizr-3.3.1.js'
    ]))
    .pipe(print())
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets'));
    del(['dist/assets/scripts']);
});

gulp.task('build-styles', function() {
    return gulp.src('dist/assets/styles/*.css')
    .pipe(print())
    .pipe(concat('styles.css'))
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/assets/'));
});

gulp.task('assets-cleanup', function() {
    del(['dist/assets/styles']);
    del(['dist/assets/scripts']);
});

gulp.task('build-html', function() {
    var opts = {
        removeComments: true,
        removeRedundantAttributes: true,
        removeComments: true
    };

    return gulp.src('dist/**/*.html')
    .pipe(print())
    .pipe(htmlMin())
    .pipe(gulp.dest('dist'));
});

gulp.task('img-min', function() {
    return gulp.src('dist/assets/img/**/*')
    .pipe(imgMin())
    .pipe(gulp.dest('dist/assets/img'));
});

gulp.task('develop', function() {
    runSeq(
        'set-dev',
        'jekyll',
        'clean',
        'copy',
        'compile-scss',
        'jshint',
        'watch',
        'serve'
    );
});

gulp.task('deploy', function() {
    runSeq(
        'set-deploy',
        'jekyll',
        'clean',
        'copy',
        'compile-scss',
        'jshint',
        'build-scripts',
        'build-styles',
        'build-html',
        'img-min',
        'assets-cleanup'
    );
});
