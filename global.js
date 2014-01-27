/** 
* Find the number of words that match (roughly)
* Does not return an exact count (use word boundaries
*	for that). Because I might not have cleaned up the
*	title from the page properly
* */
function wordMatch(a, b, caseSenitiveSearch) {
    if (caseSenitiveSearch !== true) {
        a = a.toLowerCase();
        b = b.toLowerCase();
    }

	var words = b.split(" ");

	numberOfMatches = 0;
	for (var i = 0; i < words.length; i++) {
		var pattern = new RegExp(words[i]);

		if (pattern.test(a)) {
			numberOfMatches++;
		}
	}
	
	return numberOfMatches;
}

function ratioWordMatch(a, b, caseSenitiveSearch) {
	var numberOfMatches = wordMatch(a, b, caseSenitiveSearch);

	var percentMatch = 0;
	if (numberOfMatches) {
		//var test = b.split(" ").length
		percentMatch = numberOfMatches / b.split(" ").length;
	}

	return percentMatch;
}

function requestRottenTomatoesMovieRating(movieInfo, event) {
	//var rottenTomatoesMovieTitle = movieInfo.title.replace(/\[REQ\] /g,"");

	$.getJSON(
		'http://api.rottentomatoes.com/api/public/v1.0/movies.json',
		{
			apikey: 'your api key',
			//q: rottenTomatoesMovieTitle
			q: movieInfo.title
		},
		function(rottenTomatoesData) {
			var movie = parseRottenTomatoesResponse(rottenTomatoesData, movieInfo);

			if (movie) {
				storage.setRating(movie);

				movie.original_title = movieInfo.original_title;
				event.target.page.dispatchMessage("returnMovieScore", movie);
			} else {
				movie = {
					title: movieInfo.title
				};

				storage.setRating(movie);
			}
	});
}

function parseRottenTomatoesResponse(rottenTomatoesMovieData, movieInfo) {
	possibleMovies = rottenTomatoesMovieData.movies;

	var movie;
	if (possibleMovies && possibleMovies.length === 1) {
		var matchRatio = ratioWordMatch(
			possibleMovies[0].title,
			movieInfo.title
		);

		if (matchRatio >= .75) {
			movie = possibleMovies[0];
		}
	} else if (possibleMovies && possibleMovies.length > 1) {
		for (var i = 0; i < possibleMovies.length; i++) {
			var possibleMovie = possibleMovies[i];

			if (possibleMovie.year === movieInfo.year) {
				movie = possibleMovie;
				break;
			}
		}
	}

	return movie;
}

function parseMovieText(original_title) {
	var text = original_title.replace(/\[REQ\]/gi,"");
	text = text.replace(/BRRip/gi,"");
	text = text.replace(/XvidHD/gi,"");
	text = text.replace(/720p-NPW/gi,"");
	text = text.replace(/720p/gi,"");
	text = text.replace(/DVDRiP/gi,"");
	text = text.replace(/x264/gi,"");
	text = text.replace(/XviD/gi,"");
	text = text.replace(/BluRay/gi,"");

	var whiteSpacePattern = / /;
	var dotPattern = /\./;

	var words;
	if (whiteSpacePattern.test(text)) {
		words = text.split(" ");
	} else if (dotPattern.test(text)) {
		words = text.split(".");
	}

	var movieInfo = { original_title: original_title };

	var titleArray = [];
	for (var i = 0; i < words.length; i++) {
		if (isNaN(words[i])) {
			titleArray.push(words[i]);
		} else if (/\d{4}/.test(words[i])) { //match sequal
			movieInfo.title = titleArray.join(' ');

			//Remove any whitespace created by our previous text.replace
			movieInfo.title.replace(/\s+/g," ");

			movieInfo.year = parseInt(words[i]);
			break;
		} else if (/\d{1,3}/.test(words[i])) { //match sequal
			titleArray.push(words[i]);
		}

		//Didn't find a year in our string
		if (i === words.length - 1) {
			movieInfo.title = titleArray.join(' ');

			//Remove any whitespace created by our previous text.replace
			movieInfo.title.replace(/\s+/g," ");
		}
		/*
		else { //match year
			movieInfo.title = titleArray.join(' ');
			movieInfo.year = parseInt(words[i]);
			break;
		}
		*/
	}

	return movieInfo;
}

function respondToMessage(messageEvent) {
	if(messageEvent.name === "getMovieScore") {
		var originalMovieText = messageEvent.message;
		//var movieInfo = messageEvent.message;
		var movieInfo = parseMovieText(originalMovieText);

		var movie = storage.getRating(movieInfo);
		if (movie && movie.id) {
			movie.original_title = originalMovieText;
			messageEvent.target.page.dispatchMessage("returnMovieScore", movie);
		} else if (movie === undefined) {
			queueMovieRequest(movieInfo, messageEvent);
		}
	}
}

var requestQueue = [];
var requestQueueTimer;
function queueMovieRequest(movieInfo, messageEvent) {
	requestQueue.push({
		movieInfo:movieInfo,
		messageEvent:messageEvent
	});

	if (requestQueueTimer === undefined) {
		requestQueueTimer = setInterval(
			processRequestQueue,
			1500
		);
	}
}

function processRequestQueue() {
	if (requestQueue.length) {
		var data = requestQueue.shift();
		requestRottenTomatoesMovieRating(data.movieInfo, data.messageEvent);
	} else {
		clearInterval(requestQueueTimer);
		requestQueueTimer = undefined;
	}
}

safari.application.addEventListener("message",respondToMessage,false);
