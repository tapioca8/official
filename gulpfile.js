const gulp = require('gulp')
const gulpBabel = require('gulp-babel')
const gulpUglify = require("gulp-uglify");
const gulpImagemin = require('gulp-imagemin')
const gulpPngquant = require("imagemin-pngquant")
const gulpMozjpeg = require("imagemin-mozjpeg")
const gulpScss = require('gulp-sass')
const gulpPlumber = require('gulp-plumber')
const gulpCleanCSS = require('gulp-clean-css')
const gulpZip = require('gulp-zip')
const gulpSourcemaps = require('gulp-sourcemaps')
const gulpHtmlHint = require('gulp-htmlhint')
const gulpW3cHtmlValidator = require('gulp-w3c-html-validator')
const gulpHtmlBeautify = require('gulp-html-beautify')
const gulpEjs = require("gulp-ejs");
const gulpRename = require("gulp-rename");
const packageImporter = require('node-sass-package-importer')
const browserSync = require('browser-sync').create()
const del = require('del')

const src = {
  scss: {
    in: 'src/assets/scss/**/*.scss',
    out: 'dist/assets/css/'
  },
  js: {
    in: [
      'src/assets/js/**/*.js',
      '!src/assets/js/plugins/**/*.js',
    ],
    out: 'dist/assets/js/'
  },
  html: {
    in: 'src/**/*.html',
    out: 'dist/'
  },
  ejs: {
    in: [
      'src/**/*.ejs',
      '!src/_**/*.ejs',
      '!src/**/_*.ejs'
    ],
    out: 'dist/',
    watching: 'src/**/*.ejs',
  },
  image: {
    in: 'src/assets/images/**/*',
    out: 'dist/assets/images/'
  },
  zip: {
    in: 'dist/*',
    out: './',
    name: 'dist.zip',
  },
  copy: {
    in: [
      'src/favicon.ico',
      'src/assets/js/plugins/**/*.js'
    ],
    out: 'dist/'
  }
}

const lint = {
  "id-class-value": false,
  "head-script-disabled": false,
  "alt-require": true,
  "attr-lowercase": false,
}

const copy = () => {
  return gulp.src(src.copy.in,{base:'src/'})
    .pipe(gulp.dest(src.copy.out))
}

const scss = () => {
  return gulp.src(src.scss.in)
    .pipe(gulpPlumber({
      errorHandler: function(err) {
        console.log(err.messageFormatted);
        this.emit('end');
      }
    }))
    .pipe(gulpScss({
      importer: packageImporter({
        extensions: ['.scss', '.css']
      })
    }))
    .pipe(gulpCleanCSS())
    .pipe(gulp.dest(src.scss.out))
    .pipe(browserSync.stream())
}

const scssDev = () => {
  return gulp.src(src.scss.in)
    .pipe(gulpPlumber({
      errorHandler: function(err) {
        console.log(err.messageFormatted);
        this.emit('end');
      }
    }))
    .pipe(gulpSourcemaps.init())
    .pipe(gulpScss({
      importer: packageImporter({
        extensions: ['.scss', '.css']
      })
    }))
    .pipe(gulpCleanCSS())
    .pipe(gulpSourcemaps.write('/gulp-maps'))
    .pipe(gulp.dest(src.scss.out))
    .pipe(browserSync.stream())
}

const image = () => {
  return gulp.src(src.image.in)
    .pipe(gulpImagemin([
      gulpPngquant({ quality: [.65,.80], speed: 1 }),
      gulpMozjpeg({ quality: 80 }),
      gulpImagemin.svgo(),
      gulpImagemin.gifsicle()
    ]))
    .pipe(gulp.dest(src.image.out))
}

const js = () => {
  return gulp.src(src.js.in)
    .pipe(gulpBabel({
      presets: ['@babel/preset-env']
    }))
    .pipe(gulpUglify())
    .pipe(gulp.dest(src.js.out))
}

const html = () => {
  return gulp.src(src.html.in)
    .pipe(gulpHtmlHint(lint))
    .pipe(gulpHtmlHint.reporter())
    .pipe(gulpW3cHtmlValidator())
    .pipe(gulpW3cHtmlValidator.reporter())
    // .pipe(gulpHtmlBeautify({
    //   "indent_size": 2,
    //   "max_preserve_newlines": 1,
    //   "preserve_newlines": false,
    // }))
    .pipe(gulp.dest(src.html.out))
}

const ejs = () => {
  return gulp.src(src.ejs.in)
    .pipe(gulpEjs())
    .pipe(gulpRename({ extname: '.html' }))
    .pipe(gulpHtmlHint(lint))
    .pipe(gulpHtmlHint.reporter())
    .pipe(gulpW3cHtmlValidator())
    .pipe(gulpW3cHtmlValidator.reporter())
    .pipe(gulpHtmlBeautify({
      "indent_size": 2,
      "max_preserve_newlines": 1,
      "preserve_newlines": false,
    }))
    .pipe( gulp.dest(src.ejs.out) );
}

const zip = () => {
  return gulp.src(src.zip.in)
    .pipe(gulpZip(src.zip.name))
    .pipe(gulp.dest(src.zip.out))
}

const reload = (cb) => {
  browserSync.reload()
  cb()
}

const watch = () => {
  gulp.watch(src.image.in, gulp.series(image, reload))
  gulp.watch(src.scss.in, scss)
  gulp.watch(src.html.in, gulp.series(html, reload))
  gulp.watch(src.ejs.watching, gulp.series(ejs, reload))
  gulp.watch(src.js.in, gulp.series(js, reload))
}

const browserSyncInit = (cb) => {
  browserSync.init({
    open: false,
    server: 'dist',
    reloadOnRestart: true
  })
  cb()
}

const clean = async (cb) => {
  await del('dist')
  cb()
}

const buildDev = gulp.parallel(copy, html, ejs, scssDev, js, image)
const build = gulp.parallel(copy, html, ejs, scss, js, image)

exports.build = gulp.series(clean, build)
exports.export = gulp.series(clean, build, zip)
exports.default = gulp.series(clean, buildDev, browserSyncInit, watch)
