const gulp = require('gulp');
const babelify = require('babelify');
const browserify = require('browserify');
const budo = require('budo');
const buffer = require('vinyl-buffer');
const clean = require('gulp-clean');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');
const runSequence = require('run-sequence');

const config = {
  dist: "./www/*",
  js: {
    src: "./src/index.js",
    dest: "./www/js/",
    output: "bundle"
  },
  css: {
    src: "./css/*.css",
    dest: "./www/css/",
  },
  html: {
    src: "./index.html",
    dest: "./www/",
  }

};

gulp.task('watch', function(cb) {
  //dev server
  budo(config.js.src, {
    serve: 'bundle.min.js',
    stream: process.stdout,
    live: true,
    browserify: {
      transform: [[ babelify, { presets : [ 'es2015' ] }]]
    }
  }).on('exit', cb);
});

gulp.task('clean', (cb) => {
  return gulp.src(config.dist)
    .pipe(clean({read: false}));
});

gulp.task('css', () => {
  return gulp.src(config.css.src)
    .pipe(gulp.dest(config.css.dest));
});

gulp.task('html', () => {
  return gulp.src(config.html.src)
    .pipe(gulp.dest(config.html.dest));
});

gulp.task('copy', () => {
  runSequence('clean', ['css', 'html']);
});

gulp.task('bundle', ['copy'], () => {
  return browserify(config.js.src)
    .transform(babelify, { presets : [ 'es2015' ] })
    .bundle()
    .pipe(source(config.js.src))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(rename({ dirname: "", basename: config.js.output, extname: '.min.js' }))
    .pipe(gulp.dest(config.js.dest));
});

gulp.task('default', ['bundle']);
