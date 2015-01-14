var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')();

gulp.task('javascript', function() {
  gulp.src('src/**/*.js')
  .pipe(plugins.traceur())
  .pipe(gulp.dest('dist/'));
});