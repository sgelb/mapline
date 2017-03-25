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
const gitRevision = require('git-revision');
const replace = require('gulp-replace');

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
  },
  assets: {
    src: "./assets/*",
    dest: "./www/assets/",
  }
};

gulp.task('watch', function(cb) {
  //dev server
  budo(config.js.src, {
    serve: 'js/bundle.min.js',
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
  const date = new Date().toLocaleDateString();
  const version = `Build: ${gitRevision("tag")} (${date})`;

  return gulp.src(config.html.src)
    .pipe(replace('__VERSION__', version))
    .pipe(gulp.dest(config.html.dest));
});

gulp.task('assets', () => {
  return gulp.src(config.assets.src)
    .pipe(gulp.dest(config.assets.dest));
});

gulp.task('copy', () => {
  runSequence('clean', ['css', 'html', 'assets']);
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
