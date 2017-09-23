const gulp = require('gulp');
const del = require('del');
const browserSync = require('browser-sync').create();
const pug = require('gulp-pug');
const plumber = require('gulp-plumber'); //
const notify = require('gulp-notify'); //
// styles 
const sass = require('gulp-sass');
const gcmq = require('gulp-group-css-media-queries');
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');

// scripts
const gulpWebpack = require('gulp-webpack');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js')

// svg 

const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');

// для удобства все пути в одном месте
const paths = {
    root: './build',
    styles: {
        src: 'src/styles/**/*.scss',
        dest: 'build/assets/styles/'
    },
    scripts: {
        src: 'src/scripts/**/*.js',
        dest: 'build/assets/scripts/'
    },
    templates: {
        src: 'src/templates/**/*.pug',
        dest: 'build/assets/'
    },
    images: {
        src: 'src/images/**/*.*',
        dest: 'build/assets/images/'
    },
    fonts: {
        src: 'src/fonts/**/*.*',
        dest: 'build/assets/fonts/'
    },
     svgIcon: {
         src: 'src/images/icons/*.svg',
         dest: 'build/assets/images/icons/'
     }
    
};


// pug
function templates() {
    return gulp.src('./src/templates/pages/*.pug')
        .pipe(pug({ pretty: true }))
        .pipe(gulp.dest(paths.root));
}

// scss
function styles() {
    return gulp.src('./src/styles/app.scss')
        .pipe(plumber({
            errorHandler: notify.onError(function (err) {
                return {title: 'Style', message: err.message}
            })
        }))  //
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(gcmq())
        .pipe(sourcemaps.write())        
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.styles.dest))       
}

// webpack
function scripts() {
    return gulp.src('src/scripts/app.js')
        .pipe(gulpWebpack(webpackConfig, webpack))
        .pipe(gulp.dest(paths.scripts.dest));
}

// очистка папки build
function clean() {
    return del(paths.root);
}
// просто переносим шрифты
function fonts() {
    return gulp.src(paths.fonts.src)
           .pipe(gulp.dest(paths.fonts.dest));
}

//svg собираем спрайт 

function svgSpriteBuild() {
    return gulp.src(paths.svgIcon.src)
            .pipe(svgmin({
               js2svg: {pretty: false}
           }))
           // remove all fill, style and stroke declarations in out shapes
            .pipe(cheerio({
                run: function ($) {
                    $('[fill]').removeAttr('fill');
                    $('[stroke]').removeAttr('stroke');
                    $('[style]').removeAttr('style');
                },
                parserOptions: {xmlMode: true}
            }))
            // cheerio plugin create unnecessary string '&gt;', so replace it.
            .pipe(replace('&gt;', '>'))
            // build svg sprite
            .pipe(svgSprite({
                mode: {
                    symbol: {
                        sprite: "../sprite.svg"
                    }
                }
            }))
            .pipe(gulp.dest(paths.svgIcon.dest));

}

// просто переносим картинки
function images() {
    return gulp.src(paths.images.src)
          .pipe(gulp.dest(paths.images.dest));
}

// следим за src и запускаем нужные таски (компиляция и пр.)
function watch() {
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.templates.src, templates);
    gulp.watch(paths.svgIcon.src, svgSpriteBuild);
    gulp.watch(paths.images.src, images);
    gulp.watch(paths.fonts.src, fonts);
}

// следим за build и релоадим браузер
function server() {
    browserSync.init({
        server: paths.root   
    });
    browserSync.watch(paths.root + '/**/*.*', browserSync.reload);
}


// экспортируем функции для доступа из терминала (gulp clean)
exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.templates = templates;
exports.svgSpriteBuild = svgSpriteBuild;
exports.images = images;
exports.watch = watch;
exports.server = server;
exports.fonts = fonts;

// сборка и слежка
gulp.task('default', gulp.series(
    clean,
    gulp.parallel(styles, scripts, templates, images, fonts, svgSpriteBuild),
    gulp.parallel(watch, server)
));

