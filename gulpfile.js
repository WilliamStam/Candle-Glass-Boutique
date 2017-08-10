var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var scss = require('gulp-sass');
var newer = require('gulp-newer');
var handlebars = require('gulp-compile-handlebars');
var cleanCSS = require('gulp-clean-css');
var del = require('del');
var livereload = require('gulp-livereload');
var imagemin = require('gulp-imagemin');
var config = require('./config.json');
var fs = require('fs')
require("time-require");
var duration = require('gulp-duration');


var gitCommitMessage = false;


var paths = {
	styles: {
		src: 'src/_css/**/[^_]*.scss',
		dest: './dist/_css/'
	},
	scripts: {
		src: 'src/_js/**/*.js',
		dest: './dist/_js/'
	},
	script: {
		src: 'src/_js/**/[_]*.js',
		dest: './dist/_js/'
	},
	images: {
		src: 'src/_images/**/*.{jpg,jpeg,png}',
		dest: './dist/_images/'
	},
	html: {
		src: 'src/_pages/**/*.hbs',
		dest: './dist/'
	}

};

var watching = false;
function onError(err) {
	console.log(err.toString());
	if (watching) {
		this.emit('end');
	} else {
		// if you want to be really specific
		process.exit(1);
	}
}


/* Not all tasks need to use streams, a gulpfile is just another node program
 * and you can use all packages available on npm, but it must return either a
 * Promise, a Stream or take a callback and call it
 */
function clean() {
	// You can use multiple globbing patterns as you would with `gulp.src`,
	// for example if you are using del 2.0 or above, return its promise
	return del([ 'dist/**/*/','dist/*.[^pd]*' ]);
}

/*
 * Define our tasks using plain functions
 */
function styles() {
	return gulp.src(paths.styles.src)
	.pipe(newer(paths.styles.dest))
	.pipe(scss().on("error", onError))
	.pipe(cleanCSS().on("error", onError))
	// pass in options to the stream
	.pipe(gulp.dest(paths.styles.dest))
	.pipe(livereload());
}

function scripts(done) {
	gulp.src('src/_js/**/[^_]*.js', { sourcemaps: true })
	.pipe(newer(paths.scripts.dest))

	.pipe(uglify().on("error", onError))
	.pipe(gulp.dest(paths.scripts.dest))
	.pipe(livereload());

	gulp.src(paths.script.src, { sourcemaps: true })
	.pipe(newer(paths.script.dest))
	.pipe(concat("script.js", {newLine: ';'}).on("error", onError))
	.pipe(uglify().on("error", onError))
	.pipe(gulp.dest(paths.script.dest))
	.pipe(livereload());


	return done();
}




function html(){
	return gulp.src(paths.html.src)
	.pipe(newer(paths.html.dest))
	.pipe(handlebars(config, {
		ignorePartials: true,
		batch: ['./src/_partials']
	}).on("error", onError))
	.pipe(rename({
		extname: '.html'
	}))
	.pipe(gulp.dest(paths.html.dest))
	.pipe(livereload());
}

function images() {
	return gulp.src(paths.images.src, {since: gulp.lastRun(images)})
	.pipe(imagemin({optimizationLevel: 5}))
	.pipe(gulp.dest(paths.images.dest))
	.pipe(livereload());
}

function flavours(d) {

	var page_data = null;


	for(var i=0; i<config.flavours.length; i++) {
		var data = config.flavours[i];
		var src = "./src/"+data.folder+"/";
		var dest = './dist/'+data.folder+"/";





		gulp.src(src+"_images/[^_]*.{jpg,jpeg,png}", {since: gulp.lastRun(images)})
		.pipe(newer(dest+"_images/"))
		.pipe(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 5}),
			imagemin.svgo({plugins: [{removeViewBox: true}
		]})]))
		.pipe(gulp.dest(dest+"_images/"))
		.pipe(livereload());

		gulp.src(src+"_css/*.scss")
		.pipe(newer(dest+"_css/"))
		.pipe(scss().on("error", onError))
		.pipe(cleanCSS().on("error", onError))
		// pass in options to the stream
		.pipe(gulp.dest(dest+"_css/"))
		.pipe(livereload());


		gulp.src(src+"_js/*.js", { sourcemaps: true })
		.pipe(newer(dest+"_js/"))
		.pipe(uglify().on("error", onError))
		.pipe(gulp.dest(dest+"_js/"))
		.pipe(livereload());




	//	page_data.style= fs.existsSync(dest+"style.css")?true:false;
	//	page_data.script= fs.existsSync(dest+"script.js")?true:false;


		var da = {
			fuckyou: i,
			flavour:config.flavours[i],
			flavours:config.flavours,
		}

		gulp.src(src+"*.hbs")
		.pipe(handlebars(da, {
			ignorePartials: true,
			batch: ['./src/_partials']
		}).on("error", onError))
		.pipe(rename(function(path) {
			path.extname = '.html';
		}))
		.pipe(gulp.dest(dest))
		.pipe(livereload());
	}
	d();
}

function watch() {
	watching = true;
	livereload.listen();
	gulp.watch(paths.html.src, html);
	gulp.watch('src/_partials/**/*.hbs', html);
	gulp.watch('src/_partials/**/*.hbs', flavours);
	gulp.watch(paths.scripts.src, scripts);
	gulp.watch('src/_css/**/*.scss', styles);
	gulp.watch(paths.images.src, images);
	gulp.watch("src/[^_]*/*", flavours);
	gulp.watch("./config.json", gulp.task('build'));
}

/*
 * You can use CommonJS `exports` module notation to declare tasks
 */
exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.flavours = flavours;
exports.html = html;
exports.watch = watch;

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
var build = gulp.series(clean, gulp.parallel(html, styles, scripts, images, flavours));

/*
 * You can still use `gulp.task` to expose tasks
 */
gulp.task('build', build);

/*
 * Define default task that can be called by just running `gulp` from cli
 */
gulp.task('default', watch);





gulp.task('git-commit', function (done) {
	gitCommitMessage = (typeof gitCommitMessage !== 'undefined' && gitCommitMessage != "") ? gitCommitMessage : "gulp commit";

	var d = new Date();
	var prefix = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);


	gitCommitMessage = prefix + "\n" + gitCommitMessage;

	git = (typeof git !== 'undefined') ? git : require('gulp-git');

	var timer = duration('git-commit');
	return gulp.src('./')
	.pipe(git.commit(gitCommitMessage))
	.pipe(timer);


});
gulp.task('git-push', function (done) {


	git = (typeof git !== 'undefined') ? git : require('gulp-git');

	var branch_ = 'master';
	git.revParse({args:'--abbrev-ref HEAD'}, function (err, branch) {
		branch_ = branch;
		console.log("Pushing to: "+branch_);
		git.push('origin', branch_, function (err) {
			if (err) {
				throw err;
			} else {
				done();
			}
		});

	});






});
gulp.task('git-diff', function (done) {


	git = (typeof git !== 'undefined') ? git : require('gulp-git');

	git.exec({args: ' diff --stat'}, function (err, stdout) {
		gitCommitMessage = stdout
		if (err) throw err;
		done();
	});


});


gulp.task('deploy', gulp.series('build', 'git-diff', 'git-commit', 'git-push', function (done) {
	done();
}));