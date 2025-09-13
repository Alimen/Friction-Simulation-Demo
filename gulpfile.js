const { src, dest, parallel, series } = require('gulp');
const terser = require('gulp-terser');
const cleanCss = require('gulp-clean-css');
const concat = require('gulp-concat');
const htmlReplace = require('gulp-html-replace');
const del = require('del');

// 1) 清空 dist
function clean() {
    return del(['dist']);  // 把 dist 整個刪掉
}

// 2) 合併並壓縮非 .min.js
function buildJs() {
    return src(['script/**/*.js', '!script/**/*.min.js'])
        .pipe(terser())
        .pipe(concat('app.js'))
        .pipe(dest('dist'));
}

// 3) 複製現成的 .min.js
function copyMinJs() {
    return src('script/**/*.min.js')
        .pipe(dest('dist'));
}

// 4) 合併並壓縮 .css
function buildCss() {
    return src('style/**/*.css')
        .pipe(cleanCss({ compatibility: 'ie8', level: { 1: { specialComments: 0 } } }))
        .pipe(concat('styles.css'))
        .pipe(dest('dist'));
}

// 5) 把 index.html 內的 style 與 script 代換掉
function buildHtml() {
    return src('index.html')
        .pipe(htmlReplace({
            // 這裡的 key 名字隨便取，但要對應到 HTML 裡的標記
            'css': 'styles.css',
            'min': 'p5.min.js',
            'js': { src: 'app.js', tpl: '<script src="%s" defer></script>' }
        }))
        .pipe(dest('dist'));
}

// 6）複製圖檔
function copyImg() {
    return src('image/**/*.{jpg,png}', { encoding: false })
        .pipe(dest('dist/image'));
}

// 7) 總任務：先 clean，再平行跑 buildJs + copyMinJs + buildCss + buildHtml
const build = series(
    clean,
    parallel(buildJs, copyMinJs, buildCss, buildHtml, copyImg)
);

exports.clean = clean;
exports.build = build;
