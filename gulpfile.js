var gulp = require('gulp'),
   nodemon = require('gulp-nodemon'),
	terser = require('gulp-terser'),
   cssnano = require('gulp-cssnano'),
   concat = require('gulp-concat'),
   plumber = require('gulp-plumber');

function jsTask(){
   return gulp.src('frontend/*.js')
      .pipe(plumber())
      .pipe(concat('bundle.js'))
		// .pipe(terser())
      .pipe(gulp.dest('public/js'));
}

function watch1Task(){
   gulp.watch('frontend/*.js',jsTask);
}

function startTask() {
   return nodemon({
      script: 'app.js',
      // watch: 'modules/**.*',
      ignore: ['./public', './json', './views', './results'],
      env: { 'NODE_ENV': 'development' }
   });
}

exports.default = gulp.parallel(startTask, watch1Task);