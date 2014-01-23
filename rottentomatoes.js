function requestRottenTomatoesMovieRating(movieInfo, event) {
	var rottenTomatoesMovieTitle = movieInfo.title.replace(/\[REQ\] /g,"");

	$.getJSON(
		'http://api.rottentomatoes.com/api/public/v1.0/movies.json',
		{
			apikey: 'jnx7tzztf8mhgvhrw7bmc7uy',
			//q: rottenTomatoesMovieTitle
			q: rottenTomatoesMovieTitle
		},
		function(rottenTomatoesData) {
			var movie = parseRottenTomatoesResponse(rottenTomatoesData, movieInfo);

			if (movie) {
				setLocalStorageMovie(movie);

				movie.original_title = movieInfo.original_title;
				event.target.page.dispatchMessage("returnMovieScore", movie);
			}
	});
}


function parseRottenTomatoesResponse(rottenTomatoesMovieData, movieInfo) {
	possibleMovies = rottenTomatoesMovieData.movies;

	var movie;
	if (possibleMovies.length === 1) {
		movie = possibleMovies[0];
	} else if (possibleMovies.length > 1) {
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
