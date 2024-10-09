const {
  src,
  dest,
  series,
  watch,
} = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const del = require('del');
const browserSync = require('browser-sync').create();
const sass = require('sass');
const gulpSass = require('gulp-sass');
const svgSprite = require('gulp-svg-sprite');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');
const fileInclude = require('gulp-file-include');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const revDel = require('gulp-rev-delete-original');
const htmlmin = require('gulp-htmlmin');
const gulpif = require('gulp-if');
const notify = require('gulp-notify');
const image = require('gulp-imagemin');
const minify = require('gulp-minify');
const {
  readFileSync
} = require('fs');
const typograf = require('gulp-typograf');
const webp = require('gulp-webp');
const mainSass = gulpSass(sass);
const webpackStream = require('webpack-stream');
const plumber = require('gulp-plumber');
const path = require('path');
const zip = require('gulp-zip');
const rootFolder = path.basename(path.resolve());

// paths
const srcFolder = './src';
const buildFolder = './app';
const wpFolder = false; //'../themes/velena'
const paths = {
  srcSvg: `${srcFolder}/img/svg/**.svg`,
  srcImgFolder: `${srcFolder}/img`,
  buildImgFolder: `${buildFolder}/img`,
  srcScss: `${srcFolder}/scss/*.scss`,
  srcScssSections: `${srcFolder}/scss/sections/*.scss`,
  buildCssFolder: `${buildFolder}/css`,
  buildCssSectionsFolder: `${buildFolder}/css/sections`,
  srcPluginsCss: `${srcFolder}/plugins/css/*.css`,
  srcPluginsJs: `${srcFolder}/plugins/js/*.js`,
  srcMainJs: `${srcFolder}/js/*.js`,
  srcSectionsJs: `${srcFolder}/js/sections/*.js`,
  buildJsFolder: `${buildFolder}/js`,
  buildJsSectionsFolder: `${buildFolder}/js/sections`,
  srcPartialsFolder: `${srcFolder}/partials`,
  fontsFolder: `${srcFolder}/fonts`,
  fontsBuildFolder: `${buildFolder}/fonts`,


  wpImgFolder: `${wpFolder ?? ''}/img`,
  wpCssFolder: `${wpFolder ?? ''}/css`,
  wpCssSectionsFolder: `${wpFolder ?? ''}/css/sections`,
  wpJsFolder: `${wpFolder ?? ''}/js`,
  wpJsSectionsFolder: `${wpFolder ?? ''}/js/sections`,
};

let isProd = true; // dev by default

const clean = () => {
  return del([buildFolder])
}

//svg sprite
const svgSprites = () => {
  let thisPipe = src(paths.srcSvg)
      .pipe(
          svgmin({
            js2svg: {
              pretty: true,
            },
          })
      )
      .pipe(
          cheerio({
            run: function ($) {
              $('[fill]').removeAttr('fill');
              $('[stroke]').removeAttr('stroke');
              $('[style]').removeAttr('style');
            },
            parserOptions: {
              xmlMode: true
            },
          })
      )
      .pipe(replace('&gt;', '>'))
      .pipe(svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg"
          }
        },
      }))
      .pipe(dest(paths.buildImgFolder))

  if(wpFolder)
    thisPipe.pipe(dest(paths.wpImgFolder));

  return thisPipe;
}

// scss styles
const styles = () => {
  let thisPipe = src(paths.srcScss, { sourcemaps: !isProd })
      .pipe(plumber(
          notify.onError({
            title: "SCSS",
            message: "Error: <%= error.message %>"
          })
      ))
      .pipe(mainSass())
      .pipe(autoprefixer({
        cascade: false,
        grid: true,
        overrideBrowserslist: ["last 5 versions"]
      }))
      .pipe(gulpif(isProd, cleanCSS({
        level: 2
      })))
      .pipe(dest(paths.buildCssFolder, { sourcemaps: '.' }))

  if(wpFolder)
    thisPipe.pipe(dest(paths.wpCssFolder, { sourcemaps: '.' }))

  return thisPipe.pipe(browserSync.stream());
};

// styles backend
const stylesBackend = () => {
  let thisPipe = src(paths.srcScss)
      .pipe(plumber(
          notify.onError({
            title: "SCSS",
            message: "Error: <%= error.message %>"
          })
      ))
      .pipe(mainSass())
      .pipe(autoprefixer({
        cascade: false,
        grid: true,
        overrideBrowserslist: ["last 5 versions"]
      }))
      .pipe(dest(paths.buildCssFolder))


  if(wpFolder)
    thisPipe.pipe(dest(paths.wpCssFolder))

  return thisPipe.pipe(browserSync.stream());
};

// scripts
const scripts = () => {
  let thisPipe = src(paths.srcMainJs)
      .pipe(minify({
          noSource: true,
          ext:{
              min:'.js'
          },
      }))
      .pipe(dest(paths.buildJsFolder))

  if(wpFolder)
    thisPipe.pipe(dest(paths.wpJsFolder))

  return thisPipe.pipe(browserSync.stream());
}
const scriptsSections = () => {
    let sectionsPipe = src(paths.srcSectionsJs)
        .pipe(minify({
            noSource: true,
            ext:{
                min:'.js'
            },
        }))
        .pipe(dest(paths.buildJsSectionsFolder))

    if(wpFolder)
        sectionsPipe.pipe(dest(paths.wpJsSectionsFolder))


    return sectionsPipe.pipe(browserSync.stream());
}
const stylesSections = () => {
    let sectionsPipe = src(paths.srcScssSections, { sourcemaps: !isProd })
        .pipe(mainSass())
        .pipe(autoprefixer({
            cascade: false,
            grid: true,
            overrideBrowserslist: ["last 5 versions"]
        }))
        .pipe(gulpif(isProd, cleanCSS({
            level: 2
        })))
        .pipe(dest(paths.buildCssSectionsFolder, { sourcemaps: '.' }))

    if(wpFolder)
        sectionsPipe.pipe(dest(paths.wpCssSectionsFolder, { sourcemaps: '.' }))

    return sectionsPipe.pipe(browserSync.stream());
}

const scriptsPlugins = () => {
  let thisPipe = src(paths.srcPluginsJs)
      .pipe(minify({
          noSource: true,
          ext:{
              min:'.js'
          },
      }))
      .pipe(dest(paths.buildJsFolder))

  if(wpFolder)
    thisPipe.pipe(dest(paths.wpJsFolder))

  return thisPipe.pipe(browserSync.stream());
}
const stylesPlugins = () => {
  let thisPipe = src(paths.srcPluginsCss)
      .pipe(gulpif(isProd, cleanCSS({
          level: 2
      })))
      .pipe(dest(paths.buildCssFolder))

  if(wpFolder)
    thisPipe.pipe(dest(paths.wpCssFolder))

  return thisPipe.pipe(browserSync.stream());
}

// scripts backend
const scriptsBackend = () => {
  let thisPipe = src(paths.srcMainJs)
      .pipe(plumber(
          notify.onError({
            title: "JS",
            message: "Error: <%= error.message %>"
          })
      ))
      .pipe(webpackStream({
        mode: 'development',
        output: {
          filename: 'main.js',
        },
        module: {
          rules: [{
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', {
                    targets: "defaults"
                  }]
                ]
              }
            }
          }]
        },
        devtool: false
      }))
      .on('error', function (err) {
        console.error('WEBPACK ERROR', err);
        this.emit('end');
      })
      .pipe(dest(paths.buildJsFolder))

  if(wpFolder)
    thisPipe.pipe(dest(paths.wpJsFolder))

  return thisPipe.pipe(browserSync.stream());
}

const fonts = () => {
  return src(`${paths.fontsFolder}/**`)
      .pipe(dest(paths.fontsBuildFolder))
}

const images = () => {
  let thisPipe = src([`${paths.srcImgFolder}/**/**.{jpg,jpeg,png,svg}`])
      .pipe(gulpif(isProd, image([
        image.mozjpeg({
          quality: 80,
          progressive: true
        }),
        image.optipng({
          optimizationLevel: 2
        }),
      ])))
      .pipe(dest(paths.buildImgFolder))

  if(wpFolder)
    thisPipe.pipe(dest(paths.wpImgFolder));

  return thisPipe;
};

const webpImages = () => {
  let thisPipe = src([`${paths.srcImgFolder}/**/**.{jpg,jpeg,png}`])
      .pipe(webp())
      .pipe(dest(paths.buildImgFolder))


  if(wpFolder)
    thisPipe.pipe(dest(paths.wpImgFolder));

  return thisPipe;
};

const htmlInclude = () => {
  return src([`${srcFolder}/*.html`])
      .pipe(fileInclude({
        prefix: '@',
        basepath: '@file'
      }))
      .pipe(typograf({
        locale: ['ru', 'en-US']
      }))
      .pipe(dest(buildFolder))
      .pipe(browserSync.stream());
}

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: `${buildFolder}`
    },
  });

  watch(paths.srcScss, styles);
  watch(paths.srcScssSections, stylesSections);
  watch(paths.srcPluginsCss, stylesPlugins);
  watch(paths.srcMainJs, scripts);
  watch(paths.srcSectionsJs, scriptsSections);
  watch(paths.srcPluginsJs, scriptsPlugins);
  watch(`${paths.srcPartialsFolder}/*.html`, htmlInclude);
  watch(`${srcFolder}/*.html`, htmlInclude);
  watch(`${paths.fontsFolder}/**`, fonts);
  watch(`${paths.srcImgFolder}/**/**.{jpg,jpeg,png,svg}`, images);
  watch(`${paths.srcImgFolder}/**/**.{jpg,jpeg,png}`, webpImages);
  watch(paths.srcSvg, svgSprites);
}

const cache = () => {
  return src(`${buildFolder}/**/*.{css,js,svg,png,jpg,jpeg,webp,woff2}`, {
    base: buildFolder
  })
      .pipe(rev())
      .pipe(revDel())
      .pipe(dest(buildFolder))
      .pipe(rev.manifest('rev.json'))
      .pipe(dest(buildFolder));
};

const rewrite = () => {
  const manifest = readFileSync('app/rev.json');
  src(`${paths.buildCssFolder}/*.css`)
      .pipe(revRewrite({
        manifest
      }))
      .pipe(dest(paths.buildCssFolder));

  if(wpFolder) {
    src(`${paths.wpCssFolder}/*.css`)
        .pipe(revRewrite({
          manifest
        }))
        .pipe(dest(paths.wpCssFolder));
  }
  return src(`${buildFolder}/**/*.html`)
      .pipe(revRewrite({
        manifest
      }))
      .pipe(dest(buildFolder));
}

const htmlMinify = () => {
  return src(`${buildFolder}/**/*.html`)
      .pipe(htmlmin({
        collapseWhitespace: true
      }))
      .pipe(dest(buildFolder));
}

const zipFiles = (done) => {
  del.sync([`${buildFolder}/*.zip`]);
  return src(`${buildFolder}/**/*.*`, {})
      .pipe(plumber(
          notify.onError({
            title: "ZIP",
            message: "Error: <%= error.message %>"
          })
      ))
      .pipe(zip(`${rootFolder}.zip`))
      .pipe(dest(buildFolder));
}

const toProd = (done) => {
  isProd = true;
  done();
};

exports.default = series(clean, htmlInclude, scripts, scriptsSections, scriptsPlugins, styles, stylesPlugins, stylesSections, fonts, images, webpImages, svgSprites, watchFiles);

exports.backend = series(clean, htmlInclude, scriptsBackend, stylesBackend, fonts, images, webpImages, svgSprites)

exports.build = series(toProd, clean, htmlInclude, scripts, scriptsSections, styles, stylesSections, fonts, images, webpImages, svgSprites, htmlMinify);

exports.cache = series(cache, rewrite);

exports.zip = zipFiles;
