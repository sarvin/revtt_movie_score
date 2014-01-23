/** Send a request to our Global script */
function getMovieScore(originalMovieText) {
	safari.self.tab.dispatchMessage("getMovieScore", originalMovieText);
}

/** 
 * Receive message events
 * Add Scores to the corresponding DOM nodes
 * */
function respondToMessage(messageEvent) {
	if(messageEvent.name === "returnMovieScore") {
		var movieInfo = messageEvent.message;
		var domNode = getDomNodeByMovie(movieInfo);

		if (domNode) {
			var rottenTomatoesNode = createMovieSpan(movieInfo);
			//var rottenTomatoesNode = createMovieDiv(movieInfo);
			attachMovieSpanToDOM(rottenTomatoesNode, domNode);
		}
	}
}

/** 
 * Create a span tag that we can later assign to movie DOM nodes
 * */
function createMovieSpan(movieInfo) {
	var criticRating = document.createElement('span');
	criticRating.className = 'tMeterScore';

	if (movieInfo.ratings.critics_score === -1) {
		criticRating.innerHTML = 'N/A';
	} else {
		criticRating.innerHTML = movieInfo.ratings.critics_score + '%';
	}

	var criticRatingIcon = document.createElement('span');
	if (movieInfo.ratings.critics_rating === 'Rotten') {
		criticRatingIcon.className = 'icon tiny rotten';
		criticRatingIcon.title = 'Rotten';
	} else if (movieInfo.ratings.critics_rating === 'Certified Fresh') {
		criticRatingIcon.className = 'icon tiny fresh';
		criticRatingIcon.title = 'Certified Fresh';
	} else if (movieInfo.ratings.critics_rating === 'Fresh') {
		criticRatingIcon.className = 'icon tiny fresh';
		criticRatingIcon.title = 'Fresh';
	} else {
		console.log(movieInfo)
	}

	var alternateLink = document.createElement('a');
	alternateLink.href = movieInfo.links.alternate;
	alternateLink.setAttribute('target', '_blank');
	alternateLink.appendChild(criticRatingIcon);
	alternateLink.appendChild(criticRating);
	alternateLink.innerHTML = '(' + alternateLink.innerHTML + ')';

	var span = document.createElement('span');
	span.className = 'tMeterIcon tiny';
	//span.appendChild(criticRatingIcon);
	//span.appendChild(criticRating);
	//span.innerHTML = '(' + span.innerHTML + ')';
	span.appendChild(alternateLink);

	return span;
}

function createMovieDiv(movieInfo) {
	var text = '<div class="rotten_tomatoes_tooltip">'+
		'<a href="'+ movieInfo.links.alternate + '" target="_blank">' +
		movieInfo.ratings.critics_score + '%'+
		'</a>'+
		'</div>';

	var div = document.createElement('div');
	div.className = 'rotten_tomatoes_container';
	div.innerHTML = text;

	return div;
}

/** 
 * Add spans to our movie DOM nodes
 * */
function attachMovieSpanToDOM(span, domNode) {
	if(domNode.children.length === 1) {
		domNode.children[0].appendChild(span);
	} else if (domNode.children.length > 1) {
		domNode.children[1].appendChild(span);
	}

	return domNode;
}

/** 
 * Check if an HTML table has Movie DOM nodes
 * */
function tableHasTorrent(table) {
	var idOfTable = table.getAttribute('id');

	//var videoPattern = new RegExp("torrents");
	var videoPattern = /torrents/;
	var hasTorrent = videoPattern.test(idOfTable);

	return hasTorrent;
}

/** 
 * Check if an HTML table row contains a movie DOM node
 * */
function rowHasMovie(row) {
	var columns = row.cells;
	var imageElements = row.cells[0].children;

	var imageColumn;
	if (columns[0].children.length === 1) {
		if (columns[0].children[0].nodeName === 'IMG') {
			imageColumn = columns[0].children[0];
		} else if (columns[0].children[0].children.length > 0 && columns[0].children[0].children[0].nodeName === 'IMG') {
			imageColumn = columns[0].children[0].children[0];
		}
	}

	var moviePattern = /Movie/;

	var isMovie = false;
	if (imageColumn) {
		isMovie = moviePattern.test(imageColumn.alt);
	}

	return isMovie;
}

/** 
 * Get the DOM node from a table row that holds a movie title
 * */
function getMovieDomNodeFromRow(row) {
	return row.cells[1]
}

/** 
 * Get the full text title from a row containing a movie
 * */
function getMovieFromRow(row) {
	var movieColumn = getMovieDomNodeFromRow(row);

	var originalMovieText = movieColumn.children[0].innerText;

	return originalMovieText;
}

var domMap = {};
/** 
 * Sets movie title: movie DOM node in domMap variable
 * Use the full text title, of a movie, as the key in a
 * key value pair. The value is the movie DOM node from
 * an HTML table row containing the movie
 * */
function setDomNodeByMovie(originalMovieText, domNode) {
	domMap[originalMovieText] = domNode;
}

/** 
 * Retrieve a movie DOM node from domMap.
 * */
function getDomNodeByMovie(movieInfo) {
	return domMap[movieInfo.original_title];
}

//Listen for messages
safari.self.addEventListener("message", respondToMessage, false);

var tables = document.getElementsByTagName("table");

if (tables.length) {
	for(var tableIterator=0; tableIterator<tables.length; tableIterator++){
		var table = tables[tableIterator];

		var hasTorrent = tableHasTorrent(table);

		if (hasTorrent) {
			for (var i = 0, row; row = table.rows[i]; i++) {
				var rowIsMovie = rowHasMovie(row);

				if (rowIsMovie) {
					var originalMovieText = getMovieFromRow(row);
					var movieColumn = getMovieDomNodeFromRow(row);
					
					//console.log(movieInfo.title);

					setDomNodeByMovie(originalMovieText, movieColumn);
					getMovieScore(originalMovieText);
				}
			}
		}
	}
}



/*
var newElement = document.createElement("p");
newElement.textContent = "New Element!";
newElement.style.color = "red";
newElement.style.float = "right";
document.body.insertBefore(newElement, document.body.firstChild);
*/
