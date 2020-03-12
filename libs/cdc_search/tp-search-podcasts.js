( function( $ ) {
	var solrDomain = null;
	var actionDomain = null;
	var searchResults = $( '.searchResultsData' );
	var searchEndpoint = searchResults.attr( 'data-endpoint' );

	// JIM: This needs to be swapped out in the build
	if ( 'intranet' === searchEndpoint ) {

		return;  //Do not execute for intranet

		//solrDomain = 'intranetsearch.cdc.gov';
		//actionDomain = 'intranetsearch.cdc.gov';
	} else {
		solrDomain = 'search.cdc.gov';
		actionDomain = 'search.cdc.gov';
	}

	var solrRoot = window.location.protocol + '//' + solrDomain + '/srch';
	var TESTING = 'search.cdc.gov' !== window.location.hostname;
	var searchBaseUrl = '/search/';
	var apiBase = 'browse2';
	var apiUrlBase = solrRoot + '/internet_podcast/' + apiBase;

	if ( 'intranet' === searchEndpoint ) {
		apiUrlBase = solrRoot + '/intranet/';
	}

	// if ( 'vvv.cdc.gov' === window.location.host ) {
	//     if ( 'intranet' === searchEndpoint ) {
	//     } else {
	//         apiUrlBase = 'http://vvv.cdc.gov/wp-content/plugins/cdc-gov/assets/cdc/json/sample-search-results-podcasts.json';
	//     }
	// }

	var qs = qs || ( function( a ) {
		if ( '' === a ) {
			return;
		}
		var b = {};
		for ( var i = 0; i < a.length; ++i ) {
			var p = a[ i ].split( '=' );
			if ( 2 !== p.length || "" === p[ 0 ] ) {
				continue;
			}
			b[ p[ 0 ] ] = decodeURIComponent( p[ 1 ].replace( /\+/g, ' ' ) );
		}
		return b;
	} )( window.location.search.substr( 1 ).split( '&' ) );

	var query = qs.query;
	var newResultsBlock = $( '.podcastResultsData' );
	var siteLimit = qs.sitelimit;
	var module;
	var cardBody;
	var title;
	var url;
	var titleAnchor;
	var titleRe = new RegExp( query, 'gi' );
	var seriesUrl;
	var description;
	var current;
	var podcastResults;
	var moduleTitle,
		moduleSeries,
		moduleDateTime,
		audio,
		pageCurrent = 1,
		startRow = 0,
		defaultPagingChunk = 10,
		totalPages = 0;

	var fmtMSS = function fmtMSS( s ) {
		return ( s - ( s %= 60 ) ) / 60 + ( 9 < s ? ':' : ':0' ) + s;
	};
	var boldTerm = function boldTerm( line, word ) {
		var retval = "";
		line = 'object' === typeof line ? line[ 0 ] : line || "";
		word = word || "";

		if ( line.length && word.length ) {
			var regex = new RegExp( "(" + word + ")", "gi" );
			retval = line.replace( regex, "<span class=\"font-weight-bold\">$1</span>" );

			if ( 230 < line.length ) {
				// 				retval = retval.replace( /(.{230})..+/, '$1&hellip;' );
				retval = retval.substr( 0, 230 ) + '&hellip;';
			}
		}

		return retval;
	};
	var stripTags = function stripTags( input, allowed ) {
		allowed = (  String( allowed || "" ) .toLowerCase().match( /<[a-z][a-z0-9]*>/g ) || [] ).join( "" );
		var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
			commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi,
			brokenTags = /(<\w+(?:\s+\w+=\"[^"]+\")*)(?=[^>]+(?:<|$))/g;
		return input.replace( commentsAndPhpTags, "" ).replace( brokenTags, "" ).replace( tags, function( $0, $1 ) {
			return -1 < allowed.indexOf( "<" + $1.toLowerCase() + ">" ) ? $0 : "";
		} );
	};
	var cleanSearchString = function cleanSearchString( searchTerm ) {
		var cleanString = searchTerm.replace( /[|;$%#<>()+]/g, "" );
		cleanString = encodeURI( cleanString );
		return cleanString;
	};
	var setupPagingListeners = function setupPagingListeners() {
		var $btnPagination = $( ".pagination.podcasts a" );
		$btnPagination.off( 'click' );
		$btnPagination.on( 'click', function( e ) {
			e.preventDefault();

			var pageNew = $( this ).attr( 'data-page' );
			if ( 1 > pageNew || pageNew === pageCurrent ) {
				return false;
			} else {
				pageCurrent = pageNew;
				getResults( function() {
					buildPaging();
					setupPagingListeners();
					window.scrollTo( 0, 400 );
				} );
			}
		} );
	};
	var buildResults = function buildResults() {
		if ( 0 === podcastResults.response.docs.length ) {
			newResultsBlock.text( 'no Podcast results' );
		} else {
			newResultsBlock = $( '.podcastResultsData' );
			newResultsBlock.empty();
			newResultsBlock.append( "<div class=\"searchResultsSummary\"><strong>" + podcastResults.response.numFound.toLocaleString() + "</strong> podcast results returned for <em><b>" + query + "</b></em> </div>" );

			totalPages = Math.ceil( podcastResults.response.numFound / 20 );

			for ( var i = 0; i < podcastResults.response.docs.length; i++ ) {
				current = podcastResults.response.docs[ i ];

				module = $( '<div />' ).addClass( 'searchResultsModule' );
				moduleTitle = $( '<div />' ).addClass( 'searchResultsTitle' ).html( $( '<a />' ).attr( 'href', 'https://tools.cdc.gov/medialibrary/index.aspx#/media/id/' + current.PodcastId ).html( boldTerm( current.PodcastTitle, query ) ) );
				moduleSeries = $( '<div />' ).addClass( 'searchResultsUrl' ).html( $( '<a />' ).attr( 'href', 'https://tools.cdc.gov/medialibrary/index.aspx#/podcastseries/id/' + current.PodcastId ).html( boldTerm( current.PodcastSeriesTitle, query ) ) );
				moduleDateTime = $( '<div /> ' ).html( '<span class="fs0875">' + moment( current.PodcastPublishDate ).format( 'MMMM D, YYYY' ) + '</span> <span class="cdc-icon-audio_02"></span> <span class="fs0875">' + fmtMSS( current.PodcastDuration ) + '</span>' );
				description = $( '<div /> ' ).addClass( 'searchResultsDescription' ).html( boldTerm( current.PodcastDescription, query ) );
				audio = $( '<div /> ' ).addClass( 'searchResultsAudio' ).html( '<audio controls="controls"><source src="' + current.PodcastAudioUrl + '" type="audio/mpeg">Your browser does not support the audio element.</audio>' );

				module.append( moduleTitle );
				module.append( moduleSeries );
				module.append( moduleDateTime );
				module.append( description );
				module.append( audio );
				newResultsBlock.append( module );
			}
		}
	};
	var buildPaging = function buildPaging() {
		if ( 20 < podcastResults.response.numFound ) {
			var disabled = 1 < pageCurrent ? "" : "disabled",
				loopStart = Math.ceil( pageCurrent - defaultPagingChunk / 2 ),
				i = 1,
				html = [];

			html.push( "<nav class=\"mt-4 nav d-flex justify-content-center\" aria-label=\"Search Results Pagination\">" );
			html.push( "<ul class=\"pagination podcasts\">" );
			html.push( "\t<li class=\"page-item " + disabled + "\"><a class=\"page-link\" href=\"#\" data-page=\"" + ( pageCurrent - 1 ) + "\">Previous</a></li>" );
			if ( 1 > loopStart ) {
				loopStart = 1;
			}
			for ( loopStart; loopStart <= totalPages && i <= defaultPagingChunk; loopStart++ ) {
				var active = Number( loopStart ) === Number( pageCurrent ) ? "active" : "";
				html.push( "\t<li class=\"page-item d-none d-md-inline " + active + "\"><a class=\"page-link\" href=\"#\" data-page=\"" + loopStart + "\">" + loopStart + "</a></li>" );
				i++;
			}
			if ( totalPages > pageCurrent ) {
				html.push( "<li class=\"page-item\"><a class=\"page-link\"  href=\"#\" data-page=\"" + ( pageCurrent + 1 ) + "\">Next</a></li>" );
			}
			html.push( "</ul>" );
			html.push( "</nav>" );

			newResultsBlock.append( html.join( '' ) );
		}
	};
	var getResults = function getResults( callback ) {
		var searchTerm = cleanSearchString( query ),
			rows = 20;

		if ( 1 < pageCurrent ) {
			startRow = rows * ( pageCurrent - 1 );
		}

		$.when( $.ajax( {
			type: "GET",
			url: apiUrlBase + "?q=" + searchTerm + "&rows=" + rows + "&start=" + startRow + "&wt=json",
			dataType: 'jsonp',
			jsonp: 'json.wrf',
			crossDomain: true,
			cache: false
		} ).done( function( results ) {
			podcastResults = results;
		} ).fail( function( jqXHR, textStatus ) {
			console.log( "Podcast Request failed: " + textStatus );
		} ).always( function() {} ) ).then( function() {
			buildResults();
			callback();
		} );
	};

	if ( query && 0 < query.trim().length ) {

		getResults( function() {
			buildPaging();
			setupPagingListeners();
		} );

	}
} )( jQuery );
