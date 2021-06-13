let project_folder = 'dist' //folder with results of gulp's working (4customer)
let source_folder = 'src'

let path = {
  //paths to files and folders
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
  },
  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/css/style.scss',
    js: source_folder + '/js/script.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}', //just pictures are submitted
  },
  watch: {
    //paths to files that need to listen to constantly
    html: source_folder + '/**/*.html',
    css: source_folder + '/css/**/*.scss',
    js: source_folder + '/js/**/*.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}', //just pictures are submitted
  },
  //object contains path to the project folder
  //object is responsible for deleting this folder every time the gulp is started
  clean: './' + project_folder + '/',
}

let { src, dest } = require('gulp')
let gulp = require('gulp')
let browsersync = require('browser-sync').create() //plugin browser sync (refreshes the page)
let fileinclude = require('gulp-file-include') //plugin fileinclude
let del = require('del') //pligin - automatic deletion of folder Dist
let scss = require('gulp-sass')
let autoprefixer = require('gulp-autoprefixer')
let group_media = require('gulp-group-css-media-queries') //grouping mediaqueries and placing it at the end of the file
let clean_css = require('gulp-clean-css') //it cleans and compresses css-file

//function that refreshes the page
function browserSync() {
  browsersync.init({
    //plugin settings
    server: {
      baseDir: './' + project_folder + '/',
    },
    //port on which the site will be opened
    port: 3000,
    notify: false, //disable browser notification
  })
}

//function for working html files
function html() {
  return src(path.src.html) //variable (object) 'path', key 'src', value 'html' = the root of the project source folder
    .pipe(fileinclude()) //collecting files
    .pipe(dest(path.build.html)) //transferring files from the source folder to the folder Dist
    .pipe(browsersync.stream()) //variable 'dest' + path to result folder
  //commands for gulp, which he must execute during the installation of plugins and add-ons
}

//catching changes
function watchFiles() {
  gulp.watch([path.watch.html], html) //function html
  gulp.watch([path.watch.css], css) //function css
}

//function for coping css files in Dist (with plugins)
function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: 'expanded', // for scss files are not compressed
      })
    )
    .pipe(group_media())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'], //need to support the latest 5 browser versions
        cascade: true, //autoprefexer writing style
      })
    )
    .pipe(clean_css())
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

//automatic deletion of folder Dist
function clean() {
  return del(path.clean) //plugin del with path to Dist inside
}

let build = gulp.series(clean, gulp.parallel(css, html)) //functions clean(), css(), html() (css&html are run in parallel)
let watch = gulp.parallel(build, watchFiles, browserSync)

exports.html = html
exports.css = css
exports.build = build
exports.watch = watch
exports.default = watch
