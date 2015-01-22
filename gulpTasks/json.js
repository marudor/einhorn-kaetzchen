var gulp = require('gulp');

gulp.task('json', function() {
  gulp.src('src/**/*.json')
  .pipe(gulp.dest('dist/'));
});