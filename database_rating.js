var databaseRating = (function () {

	var databaseType = 'keyValue';
	//var databaseType = 'SQLight';

	var databaseConnection; 

	var createDatabase = function() {
		try {
			if (!window.openDatabase) {
				alert('not supported');
			} else {
				var shortName = 'ratings';
				var version = '1.0';
				var displayName = 'Ratings for RevTT Media';
				var maxSize = 10485760; // in bytes

				databaseConnection = openDatabase(
					shortName, version, displayName, maxSize
				);

				// You should have a database instance in databaseConnection.
				return databaseConnection;
			}
		} catch(e) {
			// Error handling code goes here.
			if (e == 2) {
				// Version number mismatch.
				alert("Invalid database version.");
			} else {
				alert("Unknown error "+e+".");
			}
			return;
		}
		
		alert("Database is: " + databaseConnection);
	};
	
	var nullDataHandler = function(transaction, results) { };

	var errorHandler = function(transaction, error) {
		// error.message is a human-readable string.
		// error.code is a numeric error code
		alert('Oops.  Error was '+error.message+' (Code '+error.code+')');

		// Handle errors here
		var we_think_this_error_is_fatal = true;
		if (we_think_this_error_is_fatal) return true;

		return false;
	};

	var dropTables = function (table) {
		if (table) {
			databaseConnection.transaction(
				function (transaction) {
					transaction.executeSql('DROP TABLE rating;');
				}
			);
		}
	};

	var movieObject = function (results) {
		console.log(results);
	};

	var createTables = function (databaseConnection) {
		databaseConnection.transaction(

			function (transaction) {
			/*
				The first query causes the transaction to (intentionally)
				fail if the table exists.
			*/
				transaction.executeSql('CREATE TABLE rating( id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, timestamp INTEGER NOT NULL, imdb_id INTEGER, synopsis TEXT, service_id INTEGER, service_name VARCHAR(64), service_link TEXT, media_type VARCHAR(32), audience_rating INTEGER, critics_rating INTEGER, critics_rating_description TEXT, runtime INTEGER, year INTEGER, title VARCHAR(128));',
					[],
					nullDataHandler,
					function(transaction, error) {
						return true;
					}
				);
			}
		);
	};

	if (databaseType === 'SQLight') {
		createDatabase();
		createTables(databaseConnection);
	}

	return {
		// A public variable
		//myPublicVar: "foo",

		insertRating: function(movie) {
			var timestamp = new Date().getTime();

			databaseConnection.transaction(
				function (transaction) {
					transaction.executeSql('insert into rating (timestamp, imdb_id, synopsis, service_id, service_name, service_link, media_type, audience_rating, critics_rating, critics_rating_description, runtime, year, title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
					[
						timestamp,
						movie.alternate_ids.imdb,
						movie.synopsis,
						movie.id,
						'rottentomatoes',
						movie.links.alternate,
						'movie',
						movie.ratings.audience_score,
						movie.ratings.critics_score,
						movie.ratings.critics_rating,
						movie.runtime,
						movie.year,
						movie.title
					 ],nullDataHandler,errorHandler);
				}
			);
		},

		dropping: function() {
			dropTables('rating');
		},

		getRating: function(movieInfo, externalResponseHandle) {

			databaseConnection.transaction(
				function (transaction) {
					transaction.executeSql(
						"SELECT * from rating where title = ? AND year = ?;",
						[movieInfo.title, movieInfo.year ],
						function(transaction, results) {
							var movie = movieObject(results);
							externalResponseHandle(movie, movieInfo);
						},
						errorHandler
					);
				}
			);
		}
	};
})();
