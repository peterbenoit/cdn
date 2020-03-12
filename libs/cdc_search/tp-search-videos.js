( function( $ ) {
	var solrDomain = null;
	var actionDomain = null;
	var searchResults = $( '.searchResultsData' );
	var searchEndpoint = searchResults.attr( 'data-endpoint' );
	// JIM: This needs to be swapped out in the build
	if ( 'intranet' === searchEndpoint ) {

		return;

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
	var apiUrlBase = solrRoot + '/internet_video/' + apiBase;
	if ( 'intranet' === searchEndpoint ) {
		apiUrlBase = solrRoot + '/intranet/';
	}

	// if ( 'vvv.cdc.gov' === window.location.host ) {
	//     if ( 'intranet' === searchEndpoint ) {
	//     } else {
	//         apiUrlBase = 'http://vvv.cdc.gov/wp-content/plugins/cdc-gov/assets/cdc/json/sample-search-results-videos.json';
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
	var newResultsBlock = $( '.videoResultsData' );
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
	var videoResults;
	// var sliderResults;
	var moduleTitle,
		moduleDateTime,
		moduleImage, moduleImageDiv, moduleContent, moduleAnchor,
		pageCurrent = 1,
		startRow = 0,
		defaultPagingChunk = 10,
		totalPages = 0,
		firstLoad = true;
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
		var $btnPagination = $( '.pagination.videos a' );
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
	var setupClickListeners = function setupClickListeners() {
		$( '.more-videos-tab' ).on( 'click', function( e ) {
			e.preventDefault();
			var target = $( '[data-toggle="tab"][href="' + this.hash + '"]' );
			target.trigger( 'click' );
			target[0].scrollIntoView( true );
		} );

		$( '.more-videos-panel' ).on( 'click', function( e ) {
			e.preventDefault();
			$( '.collapse' ).collapse();
			$( '#mobilecoll-item-0_1' ).collapse( 'show' );
			$( '#mobilecoll-item-0_1' )[0].scrollIntoView( true );
		} );
	};
	var buildSlides = function buildSlides() {
		var slidehtml = [ ],
			slideCount = 0,
			slideHeader = '<h3 class="d-inline">Video Results</h3><a href="#videoresults" class="float-right d-none d-md-inline more-videos-tab">View more</a>',
			slideFooter = '<a href="#mobilecoll-item-0_1" class="float-right d-md-none more-videos-panel">More videos</a>';

		// if we have less than 4 videos, don't display the slider (until we have a better answer for doing this!)
		if ( 4 > videoResults.response.docs.length ) {
			return false;
		} else {
			slideCount = 9 < videoResults.response.docs.length ? 9 : videoResults.response.docs.length;
		}

		for ( var i = 0; i < slideCount; i++ ) {
			current = videoResults.response.docs[ i ];

			slidehtml.push( '<div class="noDecoration"> ' );
			// slidehtml.push( '<div class="slide-content"><a data-target="#modal' + current.videoid.replace( /_/g, '' ).replace( /-/g, '' ) + '" data-toggle="modal" href="#"> ' );
			slidehtml.push( '<div class="slide-content"><a data-target="#search_video_modal" data-toggle="modal" href="#" data-id="' + current.videoid + '" data-title="' + current.Title + '" data-lowrez="' + current.LowResolutionLink + '"> ' );
			slidehtml.push( '<img alt="' + current.Title + '" class="w-100" src="https://i3.ytimg.com/vi/' + current.videoid + '/hqdefault.jpg"><div class="bg-black m-1 pr-1 pb-1 pl-1 pin-bottom-right"><span class="cdc-icon-cdc-play c-white"</div> <span class="fs0875">' + current.Duration + '</span></div></a></div>' );
			slidehtml.push( '<div class="slide-caption" data-has-caption="true" data-has-title="true"><h3 class="h4"><a data-target="#search_video_modal" data-toggle="modal" href="#" data-id="' + current.videoid + '" data-title="' + current.Title + '" data-lowrez="' + current.LowResolutionLink + '">' + current.Title + '</a></h3><span class="d-block m-3">YouTube – ' + current.PublishDate + '</span></div>' );
			slidehtml.push( '</div>' );
		}
		$( '[data-cdc-slider]' ).before( slideHeader ).after( slideFooter ).html( slidehtml.join( '' ) ).promise().then( function() {
			setTimeout(
				function() {
					$( '[data-cdc-slider]' ).not( '.slick-initialized' ).cdcCarousel();
				}, 500 );
		} );
	};
	var buildSingleModal = function buildSingleModal() {
		var modal;
		modal = '<div class="modal fade" id="search_video_modal">';
		modal += '<div class="modal-dialog  modal-lg modal-xl modal-dialog-centered">';
		modal += '<div class="modal-content"><div class="modal-header"><button class="close" data-dismiss="modal" type="button">&times;</button></div>';
		modal += '<div class="modal-body"><div class="mb-3 video-container"><div class="embed-responsive embed-responsive-16by9">';
		modal += '<iframe allowfullscreen="allowfullscreen" class="embed-responsive-item" src="about:blank" title=""></iframe>';
		modal += '<noscript><div class="noscript"><a href="#" target="_blank">[VIDEO_TITLE]</a></div></noscript></div>';
		modal += '<div class="video-links mt-3">';
		modal += '<a class="nonHtml noDecoration" href="#" target="new"><span class="sr-only">Cdc-media</span>';
		modal += '<svg class="x16 ml-2 mr-2" xmlns="http://www.w3.org/2000/svg"><use href="#cdc-media" xlink:href="#cdc-media"></use></svg>Low Resolution Video</a>';
		modal += '</div></div></div></div></div></div>';

		// stick the modal at the end of the body
		$( 'body' ).append( modal );

		$( '.modal' ).on( 'hidden.bs.modal', function() {
			// reset the html (stops the video) when closing the modal
			var t = $( this ).html();
			$( this ).html( t );
		} ).on( 'show.bs.modal', function( e ) {
			// populate everything when the modal is shown
			var t = $( this ),
				rt = e.relatedTarget,
				id = rt.getAttribute( 'data-id' ),
				dt = rt.getAttribute( 'data-title' );

			t.find( 'iframe' ).attr( 'src', 'https://www.youtube-nocookie.com/embed/' + id ).attr( 'title', dt );
			t.find( '.noscript a' ).attr( 'href', 'https://www.youtube-nocookie.com/embed/' + id ).text( dt );
			t.find( '.video-links a' ).attr( 'href', rt.getAttribute( 'data-lowrez' ) );
		} );
	};
	var buildResults = function buildResults() {
		var date;
		var dateMoment;
		if ( 0 === videoResults.response.docs.length ) {
			newResultsBlock.text( 'no Video results' );
		} else {
			newResultsBlock = $( '.videoResultsData' );
			newResultsBlock.empty();

			newResultsBlock.append( "<div class=\"searchResultsSummary\"><strong>" + videoResults.response.numFound.toLocaleString() + "</strong> video results returned for <em><b>" + query + "</b></em> </div>" );
			totalPages = Math.ceil( videoResults.response.numFound / 20 );
			// if we're on the first page (which is either undefined or set as 1), build the slider
			// if ( typeof qs[ 'dpage' ] === 'undefined' || qs[ 'dpage' ] === '1' ) {
			if ( firstLoad ) {
				// build the slides first
				var idx = 0,
					checkExist = setInterval( function() {
						// wait for the slider to appear on the page
						if ( $( '[data-cdc-slider]' ).length ) {
							clearInterval( checkExist );
							buildSlides();
							setupClickListeners();
						}
						// if the slider doesn't appear after 10 checks, abort the test
						if ( 10 < idx ) {
							clearInterval( checkExist );
						}
						idx++;
					}, 1000 );

				firstLoad = false;
			}
			// @TODO: Clean / possibly standardize approach to build HTML blocks in JS
			// @TODO: Some dependency check for expected libraries like momentJS
			for ( var i = 0; i < videoResults.response.docs.length; i++ ) {
				current = videoResults.response.docs[ i ];
				// require and clean up videoid
				if ( ! current.videoid ) {
					continue;
				}
				// ensure given date is valid
				date = false;
				module = $( '<div class="searchResultsModule" />' );
				// build the video results
				moduleAnchor = $( '<a data-target="#search_video_modal" data-toggle="modal" href="#" data-id="' + current.videoid + '" data-title="' + current.title + '" data-lowrez="' + current.LowResolutionLink + '"></a>' );
				moduleImage = $( '<img />' ).attr( 'src', current.ThumbnailUrl );
				moduleAnchor.append( moduleImage );
				moduleAnchor.append( '<div class="bg-black m-1 pr-1 pb-1 pl-1 pin-bottom-right"><span class="cdc-icon-cdc-play c-white"</div> <span class="fs0875">' + current.Duration + '</span></div>' );
				moduleImageDiv = $( '<div class="searchResultsImage float-left p-rel"/>' ).html( moduleAnchor );
				moduleContent = $( '<div class="searchResultsContent of-h pl-3" />' );
				moduleTitle = $( '<div class="searchResultsTitle"/>' )
					.html( '<a data-target="#search_video_modal" data-toggle="modal" href="#" data-id="' + current.videoid +
						'" data-title="' + current.title + '" data-lowrez="' + current.LowResolutionLink + '">' +
						boldTerm( current.Title, query ) + '</a>' );
				moduleDateTime = $( '<div /> ' ).html( '<span>YouTube</span>' );
				if ( date ) {
					moduleDateTime.html( '<span>YouTube - </span><span class="fs0875">' + date + '</span>' );
				}
				description = $( '<div /> ' ).addClass( 'searchResultsDescription' ).html( boldTerm( current.Description, query ) );
				module.append( moduleImageDiv );
				moduleContent.append( moduleTitle );
				moduleContent.append( moduleDateTime );
				moduleContent.append( description );
				module.append( moduleContent );
				newResultsBlock.append( module );
			}
		}
	};
	var buildPaging = function buildPaging() {
		if ( 20 < videoResults.response.numFound ) {
			var disabled = 1 < pageCurrent ? "" : "disabled",
				loopStart = Math.ceil( pageCurrent - defaultPagingChunk / 2 ),
				i = 1,
				html = [];
			html.push( "<nav class=\"mt-4 nav d-flex justify-content-center\" aria-label=\"Search Results Pagination\">" );
			html.push( "<ul class=\"pagination videos\">" );
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
			videoResults = results;
			// sliderResults = results.response.docs.slice( 1,10 );
		} ).fail( function( jqXHR, textStatus ) {
			console.log( "Video Request failed: " + textStatus );
		} ).always( function() {} ) ).then( function() {
			buildResults();
			callback();
		} );
	};
	if ( query && 0 < query.trim().length ) {
		getResults( function() {
			buildPaging();
			setupPagingListeners();
			buildSingleModal();
		} );
	}
} )( jQuery );
