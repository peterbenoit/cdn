'use strict';
/**
 * tp-search.js
 * @fileOverview Contains module and constructors to handle navigation behavior outside of the scope of bootstrap
 * @version 0.1.0.1
 * @copyright 2018 Centers for Disease Control
 */

( function( $, window, document, undefined ) {
	window.CDC = window.CDC || {};
	window.CDC.tp4 = window.CDC.tp4 || {};
	window.CDC.tp4.search = window.CDC.tp4.search || ( function() {

		var searchReturn = {
			init: function( config ) {
				// WARN: this should NOT be firing yet another document.ready event handler
				$( document ).ready( function() {
					$( '.dropdown-submenu .dropdown-toggle' ).on( 'click', function( e ) {
						$( this ).next( '.dropdown-menu' ).toggle();
						e.stopPropagation();
					} );
					$( '.dropdown-submenu .dropdown-item' ).on( 'click', function( e ) {
						e.stopPropagation();
						var update = {
							text: $( this ).text(),
							value: $( this ).attr( 'data-site-limit' )
						};
						// if ( '' === update.text ) {
						//
						// }
						$( 'header .local-search-label' ).text( update.text );
						$( 'header input[name="sitelimit"]' ).val( update.value );
						$( this ).parent( '.dropdown-menu' ).toggle();
					} );
					$( 'header' ).on( 'click', '.search-submit', function( e ) {
						e.preventDefault();
						$( this ).parents( 'form' ).first().submit();
					} );
				} );

				// hide search dropdown on events
				//$( window ).on( 'resize orientationchange', window.CDC.Common.debounce( function() {
				//if ( $( '.dropdown-menu-small-search' ).hasClass( 'show' ) ) {
				//$( '.dropdown-menu-small-search' ).dropdown( 'toggle' );
				//}
				//}, 250 ) );
				return true;
			}
		};
		return searchReturn;
	} )();

	/**
     * search.js
     * Event handling for resizing/responsive elements
     * @version 1.0.0.0
     * @copyright 2013 Centers for Disease Control
     */

	/** Does global CDC namespace exists? */
	CDC = CDC || {};

	/**
     * @module Search
     * @memberof CDC
     * @param {object} $ - jQuery object
     * @param {object} w - window object
     * @param {object} _ - underscore object
     * @param {object} g - CDC.Global object
     */
	CDC.Search = CDC.Search || ( function( w, g ) {
		"use strict";
		/*global log:false */
		var solrDomain = null;
		var actionDomain = null;
		var searchNetwork = 'internet';
		var searchEndpoint = $( 'html' ).hasClass( 'intranet' ) ? 'intranet' : '';
		var searchResults = $( '.searchResultsData' );

		solrDomain = 'search.cdc.gov';
		actionDomain = '@tp-search-action-domain@';
		if ( -1 === actionDomain.indexOf( 'search.cdc.gov' ) ) {
			actionDomain = window.location.host;
		}

		var solrRoot = window.location.protocol + '//' + solrDomain + '/srch';

		var config = {
			defaultPageSize: 20,
			defaultBestBetsPageSize: 3,
			defaultAutoSuggest: 5,
			defaultPagingChunk: 10,
			searchAPIRoot: solrRoot + '/' + searchNetwork + '/browse2',
			searchAPIRootBestBets: solrRoot + '/' + searchNetwork + '_bb/bestbets',
			searchAPIRootESP: solrRoot + '/' + searchNetwork + '_es/browse2',
			searchAPIRootBestBetsESP: solrRoot + '/' + searchNetwork + '_esbb/bestbets',
			searchResultsLocation: window.location.protocol + '//' + actionDomain + '/search',
			searchResultsLocationEPS: window.location.protocol + '//' + actionDomain + '/search/spanish',
			searchFormInputs: $( '#searchForm input[name="subset"], #searchFormBottom input[name="subset"], #searchFormLocal input[name="subset"], #searchFormLocalBottom input[name="subset"]' ),
			searchBox: $( '#searchBox' ),
			searchBoxBottom: $( '#searchBoxBottom' ),
			searchBoxLocal: $( '#searchBoxLocal' ),
			searchBoxLocalBottom: $( '#searchBoxLocalBottom' ),
			searchAgainBox: '.search-again .searchAgainBox',
			searchResultsPage: 'body.search-results',
			$searchResultsBody: searchResults,
			notFoundPage: 'body.not-found',
			apierror: 'CDC Search is undergoing routine maintenance and will be restored shortly.<br />We apologize for the inconvenience and invite you to return later or go to our <a href="//www.cdc.gov/diseasesconditions/">A-Z index</a> to browse by topic.',
			apierrorIntranet: 'CDC Intranet Search is undergoing routine maintenance and will be restored shortly.<br />We apologize for the inconvenience and invite you to return later or go to our <a href="http://intranet.cdc.gov/connects/az/a.html">A-Z index</a> to browse by topic.'
		};

		// if ( 'vvv.cdc.gov' === window.location.host ) {
		// 	if ( 'intranet' === searchEndpoint ) {
		// 		config.searchAPIRoot = 'http://vvv.cdc.gov/wp-content/plugins/cdc-gov/assets/cdc/json/sample-intranet-search-results.json';
		// 		config.searchAPIRootBestBets = 'http://vvv.cdc.gov/wp-content/plugins/cdc-gov/assets/cdc/json/sample-intranet-bb-search-results.json';
		// 	} else {
		// 		config.searchAPIRoot = 'http://vvv.cdc.gov/wp-content/plugins/cdc-gov/assets/cdc/json/sample-search-results.json';
		// 	}
		// }

		/**
         * @function setupListeners
         * @access private
         * @desc Set up all event listeners for search
         */

		var setLabels = function( setLang ) {

			if ( 'cdc-es' === setLang || $( 'html.esp' ).length ) {
				// spanish terms
				CDC.Search.languageLabels = {
					cdcRecommendations: 'Recomendaci&oacute;n de CDC',
					page: 'P&aacute;gina',
					next: 'Siguiente',
					previous: 'Anterior',
					searchResults: 'Resultados de la b&uacute;squeda',
					returnedFor: 'resultados encontrados para',
					noSearchMessage: '<p style="padding:20px 0;">Utilice el &aacute;rea de b&uacute;squeda en la parte superior de la p&aacute;gina.</p>',
					localSearchPre: 'Incluimos resultados de b&uacute;squeda en',
					localSearchPost: '',
					localSearchAllPre: '&iquest;Desea ver los resultados de',
					localSearchAllPost: 'de todos los sitios',
					zeroDidyoumean: '&iquest;Quiso decir'
				};
			} else {
				// english terms
				CDC.Search.languageLabels = {
					cdcRecommendations: 'Recommended by CDC',
					page: 'Page',
					next: 'Next',
					previous: 'Previous',
					searchResults: 'Search Results',
					returnedFor: 'results returned for',
					noSearchMessage: '<p style="padding:20px 0;">Please use the search area at the top of the page.</p>',
					localSearchPre: 'We\'re including results for',
					localSearchPost: 'only',
					localSearchAllPre: 'Do you want to see results for',
					localSearchAllPost: 'from all sites',
					zeroDidyoumean: 'Did you mean'
				};
			}
		};

		var getSolrData = function( apiroot, searchTerm, rows, callback ) {
			var pageCurrent = getParameterByName( 'dpage' ) || 1,
				startRow = 0,
				siteLimit = getParameterByName( 'sitelimit' ) || '',
				setLanguage = getParameterByName( 'affiliate' ) || 'cdc-main',
				localsearch = '';

			if ( '' !== siteLimit ) {
				CDC.Search.localsearch = true;
				// Set the hidden field for siteLimit so that local search works as expected.
				$( '.tp-search input[type="hidden"][name="sitelimit"]' ).attr( 'value', siteLimit );

				// SOLR expected format for local search
				// fq=(url:"www.cdc.gov/niosh" OR url:"blogs.cdc.gov/niosh-science-blog")
				siteLimit = siteLimit.replace( ' | ', '%22%20OR%20url:%22' );
				localsearch = '&fq=(url:"' + siteLimit + '")';
			}

			// clean search term
			searchTerm = cleanSearchString( searchTerm );

			// set in memory for use
			CDC.Search.pageCurrent = parseInt( pageCurrent );

			// determine start row for paging
			if ( 1 < pageCurrent ) {
				startRow = config.defaultPageSize * ( pageCurrent - 1 );
			}

			if ( 'intranet' === searchEndpoint ) {
				$.ajax( {
					type: 'GET',
					url: apiroot + '?wt=json&q=' + searchTerm + '&rows=' + rows + '&start=' + startRow + localsearch + '&hl=on&df=description,title&hl.simple.pre=<strong>&hl.simple.post=</strong>&hl.fragsize=200&affiliate=' + setLanguage,
					dataType: 'jsonp',
					jsonp: 'json.wrf',
					crossDomain: true,
					cache: false,
					success: function( response ) {
						var data = false;
						var bbData = false;

						data = response;
						CDC.Search.totalPages = Math.ceil( data.response.numFound / config.defaultPageSize );

						if ( 1 === CDC.Search.pageCurrent ) {
							$.ajax( {
								type: 'GET',
								url: CDC.Search.setapirootBB + '?wt=json&q=%22' + searchTerm + '%22&rows=' + rows + '&start=' + startRow + localsearch + '&hl=on&df=description,title&hl.simple.pre=<strong>&hl.simple.post=</strong>&hl.fragsize=200&affiliate=' + setLanguage,
								dataType: 'jsonp',
								jsonp: 'json.wrf',
								crossDomain: true,
								cache: false,
								success: function( responsePC ) {
									bbData = responsePC;

									callback( data, bbData );
								},
								error: function( jqXHR, textStatus, errorThrown ) {
									console.log( 'Failed search request', textStatus, errorThrown );
									$( ".searchResultsData" ).html( config.apierror );
								}
							} );
						} else {
							callback( data, bbData );
						}
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						console.log( 'Failed search request', textStatus, errorThrown );
						$( ".searchResultsData" ).html( config.apierror );
					}
				} );
			} else {
				$.ajax( {
					type: 'GET',
					url: apiroot + '?wt=json&q=' + searchTerm + '&rows=' + rows + '&start=' + startRow + localsearch + '&hl=on&df=description,title&hl.simple.pre=<strong>&hl.simple.post=</strong>&hl.fragsize=200&affiliate=' + setLanguage,
					dataType: 'jsonp',
					jsonp: 'json.wrf',
					crossDomain: true,
					//cache: false,
					success: function( response ) {
						var data = false;
						var bbData = false;
						data = response;
						CDC.Search.totalPages = Math.ceil( data.response.numFound / config.defaultPageSize );
						callback( data, bbData );
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						console.log( 'Failed search request', textStatus, errorThrown );
						$( ".searchResultsData" ).html( config.apierror );
					}
				} );
			}
		};

		var stripTags = function stripTags( input, allowed ) {
			allowed = (  String( allowed || "" ) .toLowerCase().match( /<[a-z][a-z0-9]*>/g ) || [] ).join( '' ); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
			var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
				commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi,
				brokenTags = /(<\w+(?:\s+\w+=\"[^"]+\")*)(?=[^>]+(?:<|$))/g;
			return input.replace( commentsAndPhpTags, '' ).replace( brokenTags, '' ).replace( tags, function( $0, $1 ) {
				return -1 < allowed.indexOf( '<' + $1.toLowerCase() + '>' ) ? $0 : '';
			} );
		};

		var getResults = function( callback ) {
			// read query string parameters
			var searchTerm = getParameterByName( 'query' ),
				pageLanguage = getParameterByName( 'affiliate' ),
				siteLimit = getParameterByName( 'sitelimit' ) || '';

			// prevent blinking on previous term
			$( '.search-input input' ).val( '' );

			setLabels( pageLanguage );

			// Handle language determination
			if ( 'cdc-es' === pageLanguage || 'es-us' === $( 'html' ).attr( 'lang' ) ) {
				CDC.Search.setapiroot = config.searchAPIRootESP;
				CDC.Search.setapirootBB = config.searchAPIRootBestBetsESP;
				CDC.Search.language = 'spanish';
			} else {
				CDC.Search.setapiroot = config.searchAPIRoot;
				CDC.Search.setapirootBB = config.searchAPIRootBestBets;
				CDC.Search.language = 'english';
			}

			if ( searchTerm ) {
				// Add Spinner while it gets the data
				$( ".searchResultsData" ).html( '<div class="searchSpinner">Searching... <span class="icon-refresh"></span></div>' );

				// get main search results
				getSolrData( CDC.Search.setapiroot, searchTerm, config.defaultPageSize, function( data, bbData ) {
					// set search term
					CDC.Search.lastSearch = searchTerm;

					// sticky search term
					$( '.search-input input' ).val( CDC.Search.lastSearch );

					// build html
					buildHtml( data, bbData );

					// callback
					if ( 'function' === typeof callback ) {
						callback();
					}
				} );

			} else {
				$( ".searchResultsData" ).html( CDC.Search.languageLabels.noSearchMessage );
			}

		};

		var buildHtml = function( data, bbData ) {
			var results = data.response.docs,
				html = [],
				highlights = data.highlighting,
				siteLimit = getParameterByName( 'sitelimit' );

			if ( 0 < results.length ) {
				html.push( '<div class="searchResultsSummary"><strong>' + data.response.numFound.toLocaleString() + '</strong> ' + CDC.Search.languageLabels.returnedFor + ' <em><b>' + data.responseHeader.params.q + '</b></em> </div>' );

				// Local search message
				if ( siteLimit ) {
					html.push( CDC.Search.languageLabels.localSearchPre + ' <em><b>' + data.responseHeader.params.q + '</b></em> from ' + siteLimit + ' ' + CDC.Search.languageLabels.localSearchPost + '.<br />' );
					html.push( CDC.Search.languageLabels.localSearchAllPre + ' <a href="' + config.searchResultsLocation + '?subset=topic&query=' + data.responseHeader.params.q + '"><em><b>' + data.responseHeader.params.q + '</b></em>&nbsp; ' + CDC.Search.languageLabels.localSearchAllPost + '?</a>' );
				}

				if ( false !== bbData ) {
					var bbResults = bbData.response.docs;

					for ( var i = 0; i < bbResults.length; i++ ) {
						var bbDescription = bbResults[i].BB_description,
							bbTitle = bbResults[i].BB_title,
							bbTitleBolded;

						if ( 'undefined' === typeof bbDescription ) {
							bbDescription = '';
						}
						bbDescription = bbDescription.trim();
						bbDescription = boldTerm( bbDescription, CDC.Search.lastSearch );
						bbTitleBolded = boldTerm( bbTitle, CDC.Search.lastSearch );

						html.push( getSingleResultHTML( bbResults[i].BB_url, bbTitle, bbTitleBolded, '', bbDescription ) );
					}
				}

				for ( var j = 0; j < results.length; j++ ) {
					var description = '',
						targetBlank = '',
						title = results[j].title,
						titleBolded,
						type = '',
						current = results[j];

					if ( "undefined" !== typeof results[j].type ) {
						type = results[j].type[0];
					}

					switch ( type ) {
					case 'application/pdf':
					case 'application/doc':
					case 'application/vnd.sealed-ppt':
					case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
					case 'application/vnd.ms-powerpoint':
					case 'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
					case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
					case 'application/vnd.ms-excel':
						targetBlank = ' target="_blank"';
						break;
					default:
						targetBlank = '';
					}

					//Use this if you want highlighting. Right now, highlighting length is too long
					if ( current.url in data.highlighting && "description" in data.highlighting[ current.url ] && 0 < data.highlighting[ current.url ].description.length ) {
						description = data.highlighting[ current.url ].description[ 0 ].replace( /(.{230})..+/, '$1&hellip;' );
					} else if ( "undefined" !== typeof current.description && 0 < current.description.length && "" !== current.description[ 0 ] ) {
						// description = current.description[ 0 ].substring( 0, 150 )
						description = results[ j ].description[ 0 ].replace( /(.{230})..+/, '$1&hellip;' );
					} else if ( current.url in data.highlighting && "content" in data.highlighting[ current.url ] && 0 < data.highlighting[ current.url ].content.length ) {
						description = data.highlighting[ current.url ].content[ 0 ].replace( /(.{230})..+/, '$1&hellip;' );
					} else {
						description = "";
					}

					description = description || '';

					title = title || '';

					//Strip HTML tags except <i> and <em>
					title = stripTags( title, '<em><i>' );

					//description = boldTerm(description, );
					titleBolded = boldTerm( title, data.responseHeader.params.q );

					if ( 3 === j ) {
						html.push( '<div data-adaptive-height="false" data-cdc-slider="thumbnail-slider" data-center-mode="false" data-equalize-images="false" data-larger-overlay-description="true" data-slides-to-scroll="3" data-slides-to-show="3"></div>' );
					}

					html.push( getSingleResultHTML( results[j].url, title, titleBolded, targetBlank, description ) );
				}

				// PAGING
				if ( data.response.numFound > config.defaultPageSize ) {

					// NON MOBILE PAGING

					var disabled = 1 < CDC.Search.pageCurrent ? '' : 'disabled',
						loopStart = Math.ceil( CDC.Search.pageCurrent - config.defaultPagingChunk / 2 ),
						k = 1;

					html.push( '<nav class="mt-4 nav d-flex justify-content-center" aria-label="Search Results Pagination">' );
					html.push( '<ul class="pagination">' );
					html.push( '	<li class="page-item ' + disabled + '"><a class="page-link" href="#" data-page="' + ( CDC.Search.pageCurrent - 1 ) + '">' + CDC.Search.languageLabels.previous + '</a></li>' );

					if ( 1 > loopStart ) {
						loopStart = 1;
					}

					for ( loopStart; loopStart <= CDC.Search.totalPages && k <= config.defaultPagingChunk; loopStart++ ) {
						var active = loopStart === CDC.Search.pageCurrent ? 'active' : '';
						html.push( '	<li class="page-item d-none d-md-inline ' + active + '"><a class="page-link" href="#" data-page="' + loopStart + '">' + loopStart + '</a></li>' );

						k++;
					}

					if ( CDC.Search.totalPages > CDC.Search.pageCurrent ) {
						html.push( '<li class="page-item"><a class="page-link"  href="#" data-page="' + ( CDC.Search.pageCurrent + 1 ) + '">' + CDC.Search.languageLabels.next + '</a></li>' );
					}

					html.push( '</ul>' );
					html.push( '</nav>' );

				}

				// inject results html to the page
				$( ".searchResultsData" ).html( html.join( '' ) );

			} else {
				// 0 results
				zeroResults( data.response.numFound.toLocaleString(), data.responseHeader.params.q );
			}
		};

		var ESC_MAP = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		};

		var escapeString = function( s, forAttribute ) {
			return s.replace( forAttribute ? /[&<>'"]/g : /[&<>]/g, function( c ) {
				return ESC_MAP[ c ];
			} );
		};

		var getSingleResultHTML = function( url, title, titleBolded, targetBlank, description ) {

			var html = [];

			var titleForAttribute = escapeString( title, true );

			html.push( '<div class="searchResultsModule">' );
			html.push( '<div class="searchResultsTitle lead"><a href="' + url + '" title="' + title + '"' + targetBlank + '>' + addDocsTag( url ) + titleBolded + '</a></div>' );
			html.push( '<div class="searchResultsUrl">' + url + '</div>' );
			html.push( '<div class="searchResultsDescription">' + description + '</div>' );
			html.push( '</div>' );

			return $( '<div>' ).html( html.join( '' ) ).html();
		};

		var zeroResults = function( numfound, term ) {
			var html = [];

			html.push( '<div class="searchResultsSummary"><strong>' + numfound + '</strong> ' + CDC.Search.languageLabels.returnedFor + ' <em>' + term + '</em> </div>' );

			$( ".searchResultsData" ).html( html.join( '' ) );

			var apiUrlBase = solrRoot + '/internet/';
			if ( 'intranet' === searchEndpoint ) {
				apiUrlBase = solrRoot + '/intranet/';
			}

			var spellingUrl = apiUrlBase + 'spell?wt=json&spellcheck.collateParam.q.op=AND&spellcheck.q=' + term;

			if ( 'vvv.cdc.gov' === window.location.host ) {
				spellingUrl = 'http://vvv.cdc.gov/wp-content/plugins/cdc-gov/assets/cdc/json/sample-search-results-spelling.json?';
			}

			// API spelling typo call
			$.ajax( {
				type: 'GET',
				url: spellingUrl,
				data: { wt: 'json' },
				dataType: 'jsonp',
				jsonp: 'json.wrf',
				crossDomain: true,
				cache: false,
				success: function success( data ) {
					var didyoumeanHTML = [],
						collationQuery = '';

					if ( 'object' !== ( 'undefined' === typeof data ? 'undefined' : typeof  data  ) ) {
						data = JSON.parse( data );
					}
					/*
					if ( data.spellcheck.hasOwnProperty( 'collations' ) &&
                        1 < data.spellcheck.collations.length &&
                        data.spellcheck.collations[ 1 ].hasOwnProperty( 'collationQuery' ) ) {
						collationQuery = data.spellcheck.collations[ 1 ].collationQuery;
						if ( collationQuery ) {
							didyoumeanHTML.push( '<h3>' + CDC.Search.languageLabels.zeroDidyoumean + ' <a href="#" class="didyoumean"><em>' + collationQuery + '</em></a>?</h3>' );
							$( ".searchResultsData" ).append( didyoumeanHTML.join( '' ) );
							$( '.didyoumean' ).on( 'click', function( e ) {
								e.preventDefault();
								setGetParameter( 'query', collationQuery );
							} );
						}
					}
					*/
					// the API changed, so made some adjustments for the new field names
					if ( data.hasOwnProperty( "spellcheck" ) && 1 < data.spellcheck.suggestions.length && data.spellcheck.suggestions[ 1 ].hasOwnProperty( "suggestion" ) ) {
						collationQuery = data.spellcheck.suggestions[ 1 ].suggestion;

						if ( collationQuery.length ) {
							// sort by freq to get the most reasonable match
							collationQuery.sort( function( a, b ) {
								return a.freq < b.freq ? 1 : -1;
							} );
							didyoumeanHTML.push( "<h3>" + CDC.Search.languageLabels.zeroDidyoumean + " <a href=\"#\" class=\"didyoumean\"><em>" + collationQuery[ 0 ].word + "</em></a>?</h3>" );
							config.$searchResultsBody.append( didyoumeanHTML.join( "" ) );
							$( ".didyoumean" ).on( "click", function( e ) {
								e.preventDefault();
								setGetParameter( "query", collationQuery[ 0 ].word );
							} );
						}
					}
				}
			} );
		};

		var spanishPageCleanUp = function() {
			// cleanup page for spanish
			if ( 'spanish' === CDC.Search.language ) {
				$( 'html' ).attr( 'lang', 'es-us' ).addClass( 'esp' );

				// set placeholder
				$( '.search-input input' ).attr( 'placeholder', 'BUSCAR' );

				//$('.titlebar h1').html(CDC.Search.languageLabels.searchResults);
				$( 'input[name="affiliate"]' ).attr( 'value', 'cdc-es' );
				$( 'form.searchForm' ).attr( 'action', config.searchResultsLocationEPS );
			}

		};

		var setupListeners = function() {
			if ( $( '.tp-search' ).length ) {
				$( '.tp-search' ).each( function() {
					var input = $( this ).find( 'input[name="query"]' ),
						$cancelButton = $( this ).find( '.form-control-clear' ),
						form = $( this ).find( 'form' ),
						isSubmit = false,
						code,
						searchTerm = CDC.Search.lastSearch;

					form.on( 'submit', function( e ) {
						code = e.keyCode ? e.keyCode : e.which;
					} ).on( 'keydown', function( e ) {
						code = e.keyCode ? e.keyCode : e.which;
						isSubmit = 13 === code;
					} );

					$cancelButton.on( 'click', function( e ) {
						if ( ! isSubmit ) {
							input.val( '' );
							input.focus();
							// Also need to clear out the "hidden" VP1/VP2 search box.
							input.val( '' );
							$( '.searchTypeAhead' ).remove();
							$( this ).css( 'visibility', 'hidden' );
							e.preventDefault();
						}
					} );

					// Search Key Up
					input.each( function() {
						handleSearchKeyEvents( input, $cancelButton );
					} ).on( 'keyup', function() {
						handleSearchKeyEvents( input, $cancelButton );
						handleTypeAhead( $( this ) );
					} );

					spanishPageCleanUp();

				} );
			}

			// · All Tab Click – cdcsitesearch:tab-all
			// · Videos Tab Click – cdcsitesearch:tab-videos
			// · Journals Tab Click – cdcsitesearch:tab-journals
			// · Podcast Tab Click – cdcsitesearch:tab-podcasts
			// · Video Carousel – cdcsitesearch-carousel-video
			// o   If possible, can we distinguish the values between positions 1,2,3 on the carousel?  lIke “cdcsitesearch-carousel-video1”
			$( 'a[href="#allresults"]' ).on( 'click', function() {
				$( this ).trigger( 'metrics-capture', [ 'cdcsitesearchtab-all', 'click' ] );
			} );
			$( 'a[href="#videoresults"]' ).on( 'click', function() {
				$( this ).trigger( 'metrics-capture', [ 'cdcsitesearchtab-videos', 'click' ] );
			} );
			$( 'a[href="#journalresults"]' ).on( 'click', function() {
				$( this ).trigger( 'metrics-capture', [ 'cdcsitesearchtab-journals', 'click' ] );
			} );
			$( 'a[href="#podcastresults"]' ).on( 'click', function() {
				$( this ).trigger( 'metrics-capture', [ 'cdcsitesearchtab-podcasts', 'click' ] );
			} );

			// wait for the slider to appear then tag each slide with a metrics trigger
			var idx = 0,
				slickInterval = window.setInterval( function() {
					if ( $( '.slick-initialized' ).length ) {
						window.clearInterval( slickInterval );
						$( 'div[class~="slick-slide"]:not([class~="slick-cloned"]) .slide-content > a' ).each( function( i ) {
							$( this ).on( 'click', function() {
								$( this ).trigger( 'metrics-capture', [ 'cdcsitesearch-carousel-video' + i, 'click' ] );
							} );
						} );
					}
					// abort if the slider doesn't appear after 20 tries
					if ( 20 < idx ) {
						window.clearInterval( slickInterval );
					}
					idx++;
				}, 300 );
		};

		var setupSearchListeners = function() {

			var $btnPageNext = $( ".searchResultsData .searchBtnNext" ),
				$btnPagePrev = $( ".searchResultsData .searchBtnPrev" ),
				$btnPagination = $( ".searchResultsData .pagination a" );

			$btnPageNext.on( 'click', function( e ) {
				e.preventDefault();
				var pageNew = CDC.Search.pageCurrent + 1;

				setGetParameter( 'dpage', pageNew );
			} );

			$btnPagePrev.on( 'click', function( e ) {
				e.preventDefault();
				var pageNew = CDC.Search.pageCurrent - 1;

				setGetParameter( 'dpage', pageNew );
			} );

			$btnPagination.on( 'click', function( e ) {
				e.preventDefault();
				var pageNew = $( this ).attr( 'data-page' );

				if ( 1 > pageNew || pageNew === CDC.Search.pageCurrent ) {
					return false;
				} else {
					setGetParameter( 'dpage', pageNew );
				}
			} );

			// if we're using the new search form
			/*if ($('.search-form-wrapper').length) {
                $('.search-form-wrapper').each(function () {
                    var input = $(this).find('.search-input input'),
                        $cancelButton = $(this).find('.btn-clear'),
                        form = $(this).parent('.searchForm'),
                        isSubmit = false,
                        code,
                        searchTerm = CDC.Search.lastSearch,
                        $btnPageNext = $('.searchBtnNext'),
                        $btnPagePrev = $('.searchBtnPrev'),
                        $btnPagination = $('.pagination a');


                });
            }*/

		};

		var handleSearchKeyEvents = function( t, b ) {
			// set all the search inputs to the same value
			//$('.search-input input:hidden').val(t.val());

			if ( 0 < t.val().length ) {
				b.css( 'visibility', 'visible' );
			} else {
				b.css( 'visibility', 'hidden' );
			}
		};

		var handleTypeAhead = function( t ) {
			var $searchWrapper = $( t ).parent(),
				typeLength = t.val().length,
				html = [];

			if ( 5 < typeLength ) {
				if ( 0 === $( '.searchTypeAhead' ).length ) {
					html.push( '<div class="searchTypeAhead"><div class="searchTypeAheadWrap"><ul></ul></div></div">' );
					$searchWrapper.append( html.join( '' ) );
				}

				getTypeAheadValues( t.val() );
			}

			// clear dropdown
			if ( 0 === typeLength ) {
				$( '.searchTypeAhead' ).remove();
			}
		};

		var getTypeAheadValues = function( val ) {

			var searchType;

			if ( 'intranet' === searchEndpoint ) {
				searchType = $( '#searchSelected-intranet' )[0].innerText.trim();

				if ( " " === searchType.charAt( searchType.length - 1 ) ) {
					searchType = searchType.substr( 0, searchType.length - 1 );
				}
			}

			if ( 'People Finder' !== searchType ) {
				var typeAheadHtml = [];
				var apiUrlBase = solrRoot + '/internet/';
				if ( 'intranet' === searchEndpoint ) {
					apiUrlBase = solrRoot + '/intranet/';
				}

				var typeAheadUrl = apiUrlBase + 'terms?wt=json&terms=true&terms.fl=suggest_term&terms.prefix=' + val + '&indent=true&omitHeader=true&terms.sort=count&terms.limit=' + config.defaultAutoSuggest;

				if ( 'vvv.cdc.gov' === window.location.host ) {
					typeAheadUrl = 'http://vvv.cdc.gov/wp-content/plugins/cdc-gov/assets/cdc/json/sample-search-results-typeahead.json?';
				} else if ( '127.0.0.1:8080' === window.location.host ) {
					typeAheadUrl = '/TemplatePackage/4.0/assets/test-files/sample-search-results-typeahead.json?';
				}

				// hit api
				$.ajax( {
					type: 'GET',
					url: typeAheadUrl,
					dataType: 'jsonp',
					jsonp: 'json.wrf',
					crossDomain: true,
					cache: false,
					success: function( data ) {
						// not sure why this is needed, but it is ??
						var mydata = data;
						if ( 'object' !== typeof data ) {
							mydata = JSON.parse( data );
						}

						if ( 0 < mydata.terms.suggest_term.length ) {
							for ( var i = 0; i < mydata.terms.suggest_term.length; i++ ) {
								// revisit this logic for evens only based on data structure
								if ( 1 !== i % 2 ) {
									typeAheadHtml.push( '<li><a href="#" data-searchterm="' + mydata.terms.suggest_term[i] + '">' + mydata.terms.suggest_term[i] + '</a></li>' );
								}
							}

							// inject back to the list
							$( '.searchTypeAheadWrap ul' ).html( typeAheadHtml.join( '' ) );

							// assign clicks
							$( '.searchTypeAheadWrap ul li a' ).on( 'click', function( e ) {
								e.preventDefault();
								// var clickTerm = $(this).attr('data-searchterm'),
								// 	forwardTo = '//www.cdc.gov/search/?query=' + clickTerm;

								// if (CDC.Search.language === 'spanish') {
								// 	forwardTo = '//www.cdc.gov/search/spanish?query=' + clickTerm;
								// }
								//TODO make the intranet network a variable in the grunt build so we can have a test json file to test against in local
								var clickTerm = $( this ).attr( 'data-searchterm' );
								var forwardTo = window.location.protocol + '//' + actionDomain + '/search/?query=' + clickTerm;

								if ( 'spanish' === CDC.Search.language ) {
									forwardTo = window.location.protocol + '//' + actionDomain + '/search/spanish?query=' + clickTerm;
								}

								window.location = forwardTo;
							} );
						}
					}
				} );
			}
		};

		/*
         * Hack to rename one of the checkboxes so only 1 subset is submitted
         */
		var handleSubset = function( viewport ) {
			var cb1 = $( 'td.labletd input:checkbox' ),
				cb2 = $( 'td.hidden-three input:checkbox' );

			if ( 4 === viewport || 2 === viewport ) {
				cb1.attr( 'name', 'NOTUSED' );
				cb2.attr( 'name', 'subset' );
			} else {
				cb1.attr( 'name', 'subset' );
				cb2.attr( 'name', 'NOTUSED' );
			}
		};

		/**
         * @function hideSearchBar
         * @access private
         * @desc Hide mobile search bar from specific viewports
         */
		var hideSearchBar = function( viewport ) {
			if ( 3 === viewport || 4 === viewport ) {
				//$(".searchbar").hide();
				//$('#mobile-menu li').removeClass("border-bottom-cdcblue border-bottom-white").addClass("border-bottom-white");
			}
		};

		var addDocsTag = function( url ) {
			var docDetect = url.substr( -6 ),
				prefix = '';

			if ( -1 < docDetect.toLowerCase().indexOf( '.pdf' ) ) {
				prefix = '<small>[PDF]</small> ';
			}
			if ( -1 < docDetect.toLowerCase().indexOf( '.doc' ) ) {
				prefix = '<small>[DOC]</small> ';
			}
			if ( -1 < docDetect.toLowerCase().indexOf( '.ppt' ) ) {
				prefix = '<small>[PPT]</small> ';
			}

			return prefix;
		};

		var boldTerm = function( line, word ) {
			line = line || '';
			var regex = new RegExp( '(' + word + ')', 'gi' );
			return line.replace( regex, "<span class=\"font-weight-bold\">$1</span>" );
		};

		var cleanSearchString = function( searchTerm ) {
			// strip funky characters
			var cleanString = searchTerm.replace( /[|;$%#<>()+]/g, "" );
			// encodeURI for special characters (spanish accents)
			cleanString = encodeURI( cleanString );

			return cleanString;
		};

		var getParameterByName = function( name, url ) {
			if ( ! url ) {
				url = window.location.href;
			}
			name = name.replace( /[\[\]]/g, "\\$&" );
			var regex = new RegExp( "[?&]" + name + "(=([^&#]*)|&|#|$)" ),
				results = regex.exec( url );
			if ( ! results ) {
				return null;
			}
			if ( ! results[2] ) {
				return '';
			}
			return decodeURIComponent( results[2].replace( /\+/g, " " ) );
		};

		var setGetParameter = function( paramName, paramValue ) {
			var url = window.location.href;
			var hash = location.hash;
			url = url.replace( hash, '' );
			if ( 0 <= url.indexOf( paramName + "=" ) ) {
				var prefix = url.substring( 0, url.indexOf( paramName ) );
				var suffix = url.substring( url.indexOf( paramName ) );
				suffix = suffix.substring( suffix.indexOf( "=" ) + 1 );
				suffix = 0 <= suffix.indexOf( "&" ) ? suffix.substring( suffix.indexOf( "&" ) ) : "";
				url = prefix + paramName + "=" + paramValue + suffix;
			} else if ( 0 > url.indexOf( "?" ) ) {
				url += "?" + paramName + "=" + paramValue;
			} else {
				url += "&" + paramName + "=" + paramValue;
			}
			window.location.href = url + hash;
		};

		return {
			/**
             * @method init
             * @access public
             * @desc Initiate search module
             * @param {Object} [c]
             */
			init: function( c ) {

				if ( c && 'object' === typeof  c  ) {
					$.extend( config, c );
				}

				if ( $( searchResults ).length ) {
					getResults( function() {
						setupSearchListeners();
					} );
				}

				setupListeners();
			},
			/**
             * @method hide
             * @access public
             * @desc Call private function to hide search bar
             * @param {integer} vp
             */
			hide: function( vp ) {
				hideSearchBar( vp );
			}
		};
	} )( jQuery, window, CDC.Global );

} )( window.jQuery, window, window.document );
