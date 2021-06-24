let project_folder = 'dist' //folder with results of gulp's working (4customer)
let source_folder = 'src'

let fs = require('fs')

let path = {
  //paths to files and folders
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
    fonts: project_folder + '/fonts/',
  },
  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/css/style.scss',
    js: source_folder + '/js/script.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}', //just pictures are submitted
    fonts: project_folder + '/fonts/*.ttf',
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
let rename = require('gulp-rename') //creation of two css-files: compressed and regular (for customer)
let uglify = require('gulp-uglify-es').default
let imagemin = require('gulp-imagemin')
let webp = require('gulp-webp')
let webphtml = require('gulp-webp-html')
let webpcss = require('gulp-webpcss')
let svgSprite = require('gulp-svg-sprite')
let ttf2woff = require('gulp-ttf2woff')
let ttf2woff2 = require('gulp-ttf2woff2')
let fonter = require('gulp-fonter')

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

function fonts() {
  src(path.src.fonts)
    .pipe(ttf2woff()) //plugin ttf2woff
    .pipe(dest(path.build.fonts)) // upload to the resulting folder
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts))
}

// the task is launched (запускается) via command 'gulp svgSprite' in a separate terminal
// if necessary constant execution of the task, it must be wrapped in a function (like html, css, etc.)
gulp.task('svgSprite', function () {
  return gulp
    .src([source_folder + '/iconsprite/*.svg'])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../icons/icons.svg', //sprite file name + path where it is unloaded
          },
        },
      })
    )
    .pipe(dest(path.build.img)) //upload the sprite to the image folder
})

// the task is launched via command 'otf2ttf'
gulp.task('otf2ttf', function () {
  return src([source_folder + '/fonts/*.otf']).pipe(
    fonter({
      formats: ['ttf'],
    }).pipe(dest(source_folder + '/fonts/')) // uploading the result to the source folder
  )
})

//for writing and connecting fonts to style.css (writes files names with converted fonts to file Fonts)
function fontsStyle() {
  let file_content = fs.readFileSync(source_folder + '/css/fonts.scss')
  if (file_content == '') {
    fs.writeFile(source_folder + '/css/fonts.scss', cb)
    return (
      fs.readdir(path.build.fonts),
      function (arr, items) {
        if (items) {
          let c_fontname
          for (let i = 0; i < items.length; i++) {
            let fontname = items[i].split('.')
            fontname = fontname[0]
            if (c_fontname != fontname) {
              fs.appendFile(
                source_folder + '/scss/fonts.scss',
                '@include font("' +
                  fontname +
                  '", "' +
                  fontname +
                  '", "400", "normal");\r\n',
                cb
              )
            }
            c_fontname = fontname
          }
        }
      }
    )
  }
}

function cb() {}

//catching changes
function watchFiles() {
  gulp.watch([path.watch.html], html) //function html
  gulp.watch([path.watch.css], css) //function css
  gulp.watch([path.watch.js], js) //function js
  gulp.watch([path.watch.img], images) //function images
}

//function for working html files
function html() {
  return src(path.src.html) //variable (object) 'path', key 'src', value 'html' = the root of the project source folder
    .pipe(fileinclude()) //collecting
    .pipe(webphtml())
    .pipe(dest(path.build.html)) //transferring files from the source folder to the folder Dist
    .pipe(browsersync.stream()) //variable 'dest' + path to result folder
  //commands for gulp, which he must execute during the installation of plugins and add-ons
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
    .pipe(webpcss())
    .pipe(dest(path.build.css)) //unloading css file before compression
    .pipe(clean_css())
    .pipe(
      rename({
        extname: '.min.css', //compressed css file
      })
    )
    .pipe(dest(path.build.css)) //unloading compressed css file
    .pipe(browsersync.stream())
}

//function for processing of js-files
function js() {
  return src(path.src.js)
    .pipe(fileinclude()) //collecting files
    .pipe(dest(path.build.js)) //transferring files from the source folder to the folder Dist
    .pipe(uglify()) //compressing js file
    .pipe(
      rename({
        extname: '.min.js', //compressed js file
      })
    )
    .pipe(dest(path.build.js)) //unloading compressed js file
    .pipe(browsersync.stream())
}

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(path.build.img)) //unloading of processed photos
    .pipe(src(path.src.img)) //referring back to the original photos
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3, // compression level: 0 to 7
      })
    )
    .pipe(dest(path.build.img)) //transferring files from the source folder to the folder Dist
    .pipe(browsersync.stream())
}

//automatic deletion of folder Dist
function clean() {
  return del(path.clean) //plugin del with path to Dist inside
}

let build = gulp.series(
  clean,
  gulp.parallel(js, css, html, images, fonts),
  fontsStyle
) //functions clean(), css(), html(), js(), images(), fonts() (css&html&js&images&fonts are run in parallel)
let watch = gulp.parallel(build, watchFiles, browserSync)

exports.html = html
exports.css = css
exports.js = js
exports.images = images
exports.fonts = fonts
exports.fontsStyle = fontsStyle
exports.build = build
exports.watch = watch
exports.default = watch
