/**
 * jquery.stapel.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2012, Codrops
 * http://www.codrops.com
 */
;( function( $, window, undefined ) {
	
	'use strict';

	/*
	* debouncedresize: special jQuery event that happens once after a window resize
	*
	* latest version and complete README available on Github:
	* https://github.com/louisremi/jquery-smartresize/blob/master/jquery.debouncedresize.js
	*
	* Copyright 2011 @louis_remi
	* Licensed under the MIT license.
	*/
	var $event = $.event,
	$special,
	resizeTimeout;

	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
				args = arguments,
				dispatch = function() {
					// set correct event type
					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};

			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}

			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 150
	};

	// ======================= imagesLoaded Plugin ===============================
	// https://github.com/desandro/imagesloaded

	// $('#my-container').imagesLoaded(myFunction)
	// execute a callback when all images have loaded.
	// needed because .load() doesn't work on cached images

	// callback function gets image collection as argument
	//  this is the container

	// original: mit license. paul irish. 2010.
	// contributors: Oren Solomianik, David DeSandro, Yiannis Chatzikonstantinou

	// blank image data-uri bypasses webkit log warning (thx doug jones)
	var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

	$.fn.imagesLoaded = function( callback ) {
		var $this = this,
			deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
			hasNotify = $.isFunction(deferred.notify),
			$images = $this.find('img').add( $this.filter('img') ),
			loaded = [],
			proper = [],
			broken = [];

		// Register deferred callbacks
		if ($.isPlainObject(callback)) {
			$.each(callback, function (key, value) {
				if (key === 'callback') {
					callback = value;
				} else if (deferred) {
					deferred[key](value);
				}
			});
		}

		function doneLoading() {
			var $proper = $(proper),
				$broken = $(broken);

			if ( deferred ) {
				if ( broken.length ) {
					deferred.reject( $images, $proper, $broken );
				} else {
					deferred.resolve( $images );
				}
			}

			if ( $.isFunction( callback ) ) {
				callback.call( $this, $images, $proper, $broken );
			}
		}

		function imgLoaded( img, isBroken ) {
			// don't proceed if BLANK image, or image is already loaded
			if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
				return;
			}

			// store element in loaded images array
			loaded.push( img );

			// keep track of broken and properly loaded images
			if ( isBroken ) {
				broken.push( img );
			} else {
				proper.push( img );
			}

			// cache image and its state for future calls
			$.data( img, 'imagesLoaded', { isBroken: isBroken, src: img.src } );

			// trigger deferred progress method if present
			if ( hasNotify ) {
				deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
			}

			// call doneLoading and clean listeners if all images are loaded
			if ( $images.length === loaded.length ){
				setTimeout( doneLoading );
				$images.unbind( '.imagesLoaded' );
			}
		}

		// if no images, trigger immediately
		if ( !$images.length ) {
			doneLoading();
		} else {
			$images.bind( 'load.imagesLoaded error.imagesLoaded', function( event ){
				// trigger imgLoaded
				imgLoaded( event.target, event.type === 'error' );
			}).each( function( i, el ) {
				var src = el.src;

				// find out if this image has been already checked for status
				// if it was, and src has not changed, call imgLoaded on it
				var cached = $.data( el, 'imagesLoaded' );
				if ( cached && cached.src === src ) {
					imgLoaded( el, cached.isBroken );
					return;
				}

				// if complete is true and browser supports natural sizes, try
				// to check for image status manually
				if ( el.complete && el.naturalWidth !== undefined ) {
					imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
					return;
				}

				// cached images don't fire load sometimes, so we reset src, but only when
				// dealing with IE, or image is complete (loaded) and failed manual check
				// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
				if ( el.readyState || el.complete ) {
					el.src = BLANK;
					el.src = src;
				}
			});
		}

		return deferred ? deferred.promise( $this ) : $this;
	};

	// global
	var $window = $( window ),
		Modernizr = window.Modernizr;

	$.Stapel = function( options, element ) {
		
		this.el = $( element );
		this._init( options );
		
	};

	// the options
	$.Stapel.defaults = {
		// space between the items
		gutter : 40,
		// the rotations degree for the 2nd and 3rd item 
		// (to give a more realistic pile effect)
		pileAngles : 2,
		// animation settings for the clicked pile's items
		pileAnimation : { 
			openSpeed : 400,
			openEasing : 'ease-in-out', // try this :) 'cubic-bezier(.47,1.34,.9,1.03)',
			closeSpeed : 400,
			closeEasing : 'ease-in-out'
		},
		// animation settings for the other piles
		otherPileAnimation : { 
			openSpeed : 400,
			openEasing : 'ease-in-out',
			closeSpeed : 350,
			closeEasing : 'ease-in-out'
		},
		// delay for each item of the pile
		delay : 0,
		// random rotation for the items once opened
		randomAngle : false,
		onLoad : function() { return false; },
		onBeforeOpen : function( pileName ) { return false; },
		onAfterOpen : function( pileName, totalItems ) { return false; },
		onBeforeClose : function( pileName ) { return false; },
		onAfterClose : function( pileName, totalItems ) { return false; }
	};

	$.Stapel.prototype = {

		_init : function( options ) {
			
			// options
			this.options = $.extend( true, {}, $.Stapel.defaults, options );

			// cache some elements
			this._config();
			
			// preload images
			var self = this;
			this.el.imagesLoaded( function() {
				self.options.onLoad();
				self._layout();
				self._initEvents();
			} );

		},
		_config : function() {

			// css transitions support
			this.support = Modernizr.csstransitions;

			var transEndEventNames = {
					'WebkitTransition' : 'webkitTransitionEnd',
					'MozTransition' : 'transitionend',
					'OTransition' : 'oTransitionEnd',
					'msTransition' : 'MSTransitionEnd',
					'transition' : 'transitionend'
				},
				transformNames = {
					'WebkitTransform' : '-webkit-transform',
					'MozTransform' : '-moz-transform',
					'OTransform' : '-o-transform',
					'msTransform' : '-ms-transform',
					'transform' : 'transform'
				};

			if( this.support ) {

				this.transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ] + '.cbpFWSlider';
				this.transformName = transformNames[ Modernizr.prefixed( 'transform' ) ];

			}

			// true if one pile is opened
			this.spread = false;

			// the li's
			this.items = this.el.children( 'li' ).hide();
			
			// close pile
			this.close = $( '#tp-close' );

		},
		_getSize : function() {

			this.elWidth = this.el.outerWidth( true );

		},
		_initEvents : function() {

			var self = this;
			$window.on( 'debouncedresize.stapel', function() { self._resize(); } );
			this.items.on( 'click.stapel', function() {
				
				var $item = $( this );

				if( !self.spread && $item.data( 'isPile' ) ) {

					self.spread = true;
					self.pileName = $item.data( 'pileName' );
					self.options.onBeforeOpen( self.pileName );
					self._openPile();
					
					return false;

				}

			} );

		},
		_layout : function() {

			/*
			piles() : save the items info in a object with the following structure:

			this.piles = {
				
				pileName : {
					
					// elements of this pile (note that an element can be also in a different pile)
					// for each element, the finalPosition is the position of the element when the pile is opened
					elements : [
						{ el : HTMLELEMENT, finalPosition : { left : LEFT, top : TOP } },
						{},
						{},
						...
					],
					// this is the position of the pile (all elements of the pile) when the pile is closed
					position : { left : LEFT, top : TOP },
					index : INDEX
				},

				// more piles
				...

			}
			*/
			this._piles();

			// items width & height
			// assuming here that all items have the same width and height
			this.itemSize = { width : this.items.outerWidth( true ) , height : this.items.outerHeight( true ) };

			// remove original elements
			this.items.remove();

			// applies some initial style for the items
			this._setInitialStyle();

			this.el.css( 'min-width', this.itemSize.width + this.options.gutter );

			// gets the current ul size (needed for the calculation of each item's position)
			this._getSize();

			// calculate and set each Pile's elements position based on the current ul width
			// this function will also be called on window resize
			this._setItemsPosition();
			
			// new items
			this.items = this.el.children( 'li' ).show();
			// total items
			this.itemsCount	= this.items.length;

		},
		_piles : function() {

			this.piles = {};
			var pile, self = this, idx = 0;
			this.items.each( function() {
					
				var $item = $( this ),
					itemPile = $item.attr( 'data-pile' ) || 'nopile-' + $item.index(),
					attr = itemPile.split( ',' );

				for( var i = 0, total = attr.length; i < total; ++i ) {
					
					var pileName = $.trim( attr[i] );
					pile = self.piles[ pileName ];

					if( !pile ) {

						pile = self.piles[ pileName ] = {
							elements : [],
							position : { left : 0, top : 0 },
							index : idx
						};

						++idx;
				
					}
					
					var clone = $item.clone().get(0);
					pile.elements.push( { el : clone, finalPosition : { left : 0, top : 0 } } );
					$( clone ).appendTo( self.el );
				
				}
			
			} );

		},
		_setInitialStyle : function() {

			for( var pile in this.piles ) {

				var p = this.piles[pile];

				for( var i = 0, len = p.elements.length; i < len; ++i ) {

					var $el = $( p.elements[i].el ),
						styleCSS = { transform : 'rotate(0deg)' };

					this._applyInitialTransition( $el );
						
					if( i === len - 2 ) {
						styleCSS = { transform : 'rotate(' + this.options.pileAngles + 'deg)' };
					}
					else if( i === len - 3 ) {
						styleCSS = { transform : 'rotate(-' + this.options.pileAngles + 'deg)' };
					}
					else if( i !== len - 1 ) {
						var extraStyle = { visibility : 'hidden' };
						$el.css( extraStyle ).data( 'extraStyle', extraStyle );
					}
					else if( pile.substr( 0, 6 ) !== 'nopile' ) {
						$el.data( 'front', true ).append( '<div class="tp-title"><span>' + pile + '</span><span>' + len + '</span></div>' );
					}

					$el.css( styleCSS ).data( {
						initialStyle : styleCSS,
						pileName : pile,
						pileCount : len,
						shadow : $el.css( 'box-shadow' ),
						isPile : pile.substr( 0, 6 ) === 'nopile' ? false : true
					} );

				}

			}

		},
		_applyInitialTransition : function( $el ) {

			if( this.support ) {
				$el.css( 'transition', 'left 400ms ease-in-out, top 400ms ease-in-out' );
			}	

		},
		_setItemsPosition : function() {

			var accumL = 0, accumT = 0, 
				l, t, ml = 0,
				lastItemTop = 0;

			for( var pile in this.piles ) {

				var p = this.piles[pile],
					stepW = this.itemSize.width + this.options.gutter,

					accumIL = 0, accumIT = 0, il, it;

				if( accumL + stepW <= this.elWidth ) {

					l = accumL;
					t = accumT;
					accumL += stepW;

				}
				else {

					if( ml === 0 ) {
						ml = Math.ceil( ( this.elWidth - accumL + this.options.gutter ) / 2 );
					}

					accumT += this.itemSize.height + this.options.gutter;
					l = 0;
					t = accumT;
					accumL = stepW;

				}

				p.position.left = l;
				p.position.top = t;

				for( var i = 0, len = p.elements.length; i < len; ++i ) {

					var elem = p.elements[i],
						fp = elem.finalPosition;

					if( accumIL + stepW <= this.elWidth ) {

						il = accumIL;
						it = accumIT;
						accumIL += stepW;

					}
					else {

						accumIT += this.itemSize.height + this.options.gutter;
						il = 0;
						it = accumIT;
						accumIL = stepW;

					}

					fp.left = il;
					fp.top = it;

					var $el = $( elem.el );

					if( pile !== this.pileName ) {
						
						$el.css( { left : p.position.left, top : p.position.top } );

					}
					else {

						lastItemTop = elem.finalPosition.top;
						$el.css( { left : elem.finalPosition.left, top : lastItemTop } );

					}

				}

			}

			// the position of the items will influence the final margin left value and height for the ul
			// center the ul
			lastItemTop = this.spread ? lastItemTop : accumT;
			this.el.css( {
				marginLeft : ml,
				height : lastItemTop + this.itemSize.height
			} );

		},
		_openPile : function() {

			if( !this.spread ) {
				return false;
			}

			// final style
			var fs;
			for( var pile in this.piles ) {

				var p = this.piles[ pile ], cnt = 0;
				
				for( var i = 0, len = p.elements.length; i < len; ++i ) {

					var elem = p.elements[i],
						$item = $( elem.el ),
						$img = $item.find( 'img' ),
						styleCSS = pile === this.pileName ? {
							zIndex : 9999,
							visibility : 'visible',
							transition : this.support ? 'left ' + this.options.pileAnimation.openSpeed + 'ms ' + ( ( len - i - 1 ) * this.options.delay ) + 'ms ' + this.options.pileAnimation.openEasing + ', top ' + this.options.pileAnimation.openSpeed + 'ms ' + ( ( len - i - 1 ) * this.options.delay ) + 'ms ' + this.options.pileAnimation.openEasing + ', ' + this.transformName + ' ' + this.options.pileAnimation.openSpeed + 'ms ' + ( ( len - i - 1 ) * this.options.delay ) + 'ms ' + this.options.pileAnimation.openEasing : 'none'
						} : {
							zIndex : 1,
							transition : this.support ? 'opacity ' + this.options.otherPileAnimation.closeSpeed + 'ms ' + this.options.otherPileAnimation.closeEasing : 'none'
						};

					if( pile === this.pileName ) {

						if( $item.data( 'front' ) ) {
							$item.find( 'div.tp-title' ).hide();
						}

						if( i < len - 1  ) {
							$img.css( 'visibility', 'visible' );
						}
						
						fs = elem.finalPosition;
						fs.transform = this.options.randomAngle && i !== p.index ? 'rotate(' + Math.floor( Math.random() * ( 5 + 5 + 1 ) - 5 ) + 'deg)' : 'none';

						if( !this.support ) {
							$item.css( 'transform', 'none' );
						}

						// hack: remove box-shadow while animating to prevent the shadow stack effect
						if( i < len - 3 ) {
							$item.css( 'box-shadow', 'none' );
						}

					}
					else if( i < len - 1  ) {
						$img.css( 'visibility', 'hidden' );
					}

					$item.css( styleCSS );

					var self = this;

					pile === this.pileName ?
						this._applyTransition( $item, fs, this.options.pileAnimation.openSpeed, function( evt ) {

							var target = this.target || this.nodeName;
							if( target !== 'LI' ) {
								return;
							}

							var $el = $( this );

							// hack: remove box-shadow while animating to prevent the shadow stack effect
							$el.css( 'box-shadow', $el.data( 'shadow' ) );

							if( self.support ) {
								$el.off( self.transEndEventName );
							}

							++cnt;
							
							if( cnt === $el.data( 'pileCount' ) ) {

								$( document ).one( 'mousemove.stapel', function() {
									self.el.addClass( 'tp-open' );
								} );
								self.options.onAfterOpen( self.pileName, cnt );

							}

						} ) :
						this._applyTransition( $item, { opacity : 0 }, this.options.otherPileAnimation.closeSpeed );

				}

			}

			this.el.css( 'height', fs.top + this.itemSize.height );	

		},
		_closePile : function() {

			var self = this;

			// close..
			if( this.spread ) {

				this.spread = false;

				this.options.onBeforeClose( this.pileName );

				this.el.removeClass( 'tp-open' );

				// final style
				var fs;
				for( var pile in this.piles ) {

					var p = this.piles[ pile ], cnt = 0;
					
					for( var i = 0, len = p.elements.length; i < len; ++i ) {

						var $item = $( p.elements[i].el ),
							styleCSS = pile === this.pileName ? {
								transition : this.support ? 'left ' + this.options.pileAnimation.closeSpeed + 'ms ' + this.options.pileAnimation.closeEasing + ', top ' + this.options.pileAnimation.closeSpeed + 'ms ' + this.options.pileAnimation.closeEasing + ', ' + this.transformName + ' ' + this.options.pileAnimation.closeSpeed + 'ms ' + this.options.pileAnimation.closeEasing : 'none'
							} : {
								transition : this.support ? 'opacity ' + this.options.otherPileAnimation.openSpeed + 'ms ' + this.options.otherPileAnimation.openEasing : 'none'
							};

						$item.css( styleCSS );
						
						fs = p.position;

						if( pile === this.pileName ) {

							$.extend( fs, $item.data( 'initialStyle' ) );

							// hack: remove box-shadow while animating to prevent the shadow stack effect
							if( i < len - 3 ) {
								$item.css( 'box-shadow', 'none' );
							}

						}

						pile === this.pileName ? this._applyTransition( $item, fs, this.options.pileAnimation.closeSpeed, function( evt ) {

							var target = this.target || this.nodeName;
							if( target !== 'LI' ) {
								return;
							}

							var $el = $( this ), extraStyle = $el.data( 'extraStyle' );

							// hack: remove box-shadow while animating to prevent the shadow stack effect
							$el.css( 'box-shadow', $el.data( 'shadow' ) );

							if( self.support ) {
								$el.off( self.transEndEventName );
								self._applyInitialTransition( $el );
							}
							else {
								$el.css( $el.data( 'initialStyle' ) );
							}

							if( extraStyle ) {
								$el.css( extraStyle );
							}

							++cnt;

							if( $el.data( 'front' ) ) {
								$el.find( 'div.tp-title' ).show();
							}

							if( cnt === $el.data( 'pileCount' ) ) {
								self.options.onAfterClose( $el.data( 'pileName' ), cnt );
							}

						} ) : this._applyTransition( $item, { opacity : 1 }, this.options.otherPileAnimation.openSpeed, function( evt ) {

							var target = this.target || this.nodeName;
							if( target !== 'LI' ) {
								return;
							}

							var $el = $( this );

							if( $el.index() < len - 1  ) {
								$el.find( 'img' ).css( 'visibility', 'visible' );
							}

							if( self.support ) {
								$el.off( self.transEndEventName );
								self._applyInitialTransition( $el );
							}

						} );

					}

				}

				// reset pile name
				this.pileName = '';

				// update ul height
				this.el.css( 'height', fs.top + this.itemSize.height );

			}
			
			return false;

		},
		_resize : function() {

			// get ul size again
			this._getSize();
			// reset items positions
			this._setItemsPosition();

		},
		_applyTransition : function( el, styleCSS, speed, fncomplete ) {

			$.fn.applyStyle = this.support ? $.fn.css : $.fn.animate;

			if( fncomplete && this.support ) {

				el.on( this.transEndEventName, fncomplete );

			}

			fncomplete = fncomplete || function() { return false; };

			el.stop().applyStyle( styleCSS, $.extend( true, [], { duration : speed + 'ms', complete : fncomplete } ) );

		},
		closePile : function() {

			this._closePile();

		}

	};
	
	var logError = function( message ) {

		if ( window.console ) {

			window.console.error( message );
		
		}

	};
	
	$.fn.stapel = function( options ) {

		var instance = $.data( this, 'stapel' );
		
		if ( typeof options === 'string' ) {
			
			var args = Array.prototype.slice.call( arguments, 1 );
			
			this.each(function() {
			
				if ( !instance ) {

					logError( "cannot call methods on stapel prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				
				}
				
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {

					logError( "no such method '" + options + "' for stapel instance" );
					return;
				
				}
				
				instance[ options ].apply( instance, args );
			
			});
		
		} 
		else {
		
			this.each(function() {
				
				if ( instance ) {

					instance._init();
				
				}
				else {

					instance = $.data( this, 'stapel', new $.Stapel( options, this ) );
				
				}

			});
		
		}
		
		return instance;
		
	};
	
} )( jQuery, window );

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpxdWVyeS5zdGFwZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJqcXVlcnkuc3RhcGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIGpxdWVyeS5zdGFwZWwuanMgdjEuMC4wXHJcbiAqIGh0dHA6Ly93d3cuY29kcm9wcy5jb21cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG4gKiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxyXG4gKiBcclxuICogQ29weXJpZ2h0IDIwMTIsIENvZHJvcHNcclxuICogaHR0cDovL3d3dy5jb2Ryb3BzLmNvbVxyXG4gKi9cclxuOyggZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xyXG5cdFxyXG5cdCd1c2Ugc3RyaWN0JztcclxuXHJcblx0LypcclxuXHQqIGRlYm91bmNlZHJlc2l6ZTogc3BlY2lhbCBqUXVlcnkgZXZlbnQgdGhhdCBoYXBwZW5zIG9uY2UgYWZ0ZXIgYSB3aW5kb3cgcmVzaXplXHJcblx0KlxyXG5cdCogbGF0ZXN0IHZlcnNpb24gYW5kIGNvbXBsZXRlIFJFQURNRSBhdmFpbGFibGUgb24gR2l0aHViOlxyXG5cdCogaHR0cHM6Ly9naXRodWIuY29tL2xvdWlzcmVtaS9qcXVlcnktc21hcnRyZXNpemUvYmxvYi9tYXN0ZXIvanF1ZXJ5LmRlYm91bmNlZHJlc2l6ZS5qc1xyXG5cdCpcclxuXHQqIENvcHlyaWdodCAyMDExIEBsb3Vpc19yZW1pXHJcblx0KiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXHJcblx0Ki9cclxuXHR2YXIgJGV2ZW50ID0gJC5ldmVudCxcclxuXHQkc3BlY2lhbCxcclxuXHRyZXNpemVUaW1lb3V0O1xyXG5cclxuXHQkc3BlY2lhbCA9ICRldmVudC5zcGVjaWFsLmRlYm91bmNlZHJlc2l6ZSA9IHtcclxuXHRcdHNldHVwOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0JCggdGhpcyApLm9uKCBcInJlc2l6ZVwiLCAkc3BlY2lhbC5oYW5kbGVyICk7XHJcblx0XHR9LFxyXG5cdFx0dGVhcmRvd246IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHQkKCB0aGlzICkub2ZmKCBcInJlc2l6ZVwiLCAkc3BlY2lhbC5oYW5kbGVyICk7XHJcblx0XHR9LFxyXG5cdFx0aGFuZGxlcjogZnVuY3Rpb24oIGV2ZW50LCBleGVjQXNhcCApIHtcclxuXHRcdFx0Ly8gU2F2ZSB0aGUgY29udGV4dFxyXG5cdFx0XHR2YXIgY29udGV4dCA9IHRoaXMsXHJcblx0XHRcdFx0YXJncyA9IGFyZ3VtZW50cyxcclxuXHRcdFx0XHRkaXNwYXRjaCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0Ly8gc2V0IGNvcnJlY3QgZXZlbnQgdHlwZVxyXG5cdFx0XHRcdFx0ZXZlbnQudHlwZSA9IFwiZGVib3VuY2VkcmVzaXplXCI7XHJcblx0XHRcdFx0XHQkZXZlbnQuZGlzcGF0Y2guYXBwbHkoIGNvbnRleHQsIGFyZ3MgKTtcclxuXHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0aWYgKCByZXNpemVUaW1lb3V0ICkge1xyXG5cdFx0XHRcdGNsZWFyVGltZW91dCggcmVzaXplVGltZW91dCApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRleGVjQXNhcCA/XHJcblx0XHRcdFx0ZGlzcGF0Y2goKSA6XHJcblx0XHRcdFx0cmVzaXplVGltZW91dCA9IHNldFRpbWVvdXQoIGRpc3BhdGNoLCAkc3BlY2lhbC50aHJlc2hvbGQgKTtcclxuXHRcdH0sXHJcblx0XHR0aHJlc2hvbGQ6IDE1MFxyXG5cdH07XHJcblxyXG5cdC8vID09PT09PT09PT09PT09PT09PT09PT09IGltYWdlc0xvYWRlZCBQbHVnaW4gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kZXNhbmRyby9pbWFnZXNsb2FkZWRcclxuXHJcblx0Ly8gJCgnI215LWNvbnRhaW5lcicpLmltYWdlc0xvYWRlZChteUZ1bmN0aW9uKVxyXG5cdC8vIGV4ZWN1dGUgYSBjYWxsYmFjayB3aGVuIGFsbCBpbWFnZXMgaGF2ZSBsb2FkZWQuXHJcblx0Ly8gbmVlZGVkIGJlY2F1c2UgLmxvYWQoKSBkb2Vzbid0IHdvcmsgb24gY2FjaGVkIGltYWdlc1xyXG5cclxuXHQvLyBjYWxsYmFjayBmdW5jdGlvbiBnZXRzIGltYWdlIGNvbGxlY3Rpb24gYXMgYXJndW1lbnRcclxuXHQvLyAgdGhpcyBpcyB0aGUgY29udGFpbmVyXHJcblxyXG5cdC8vIG9yaWdpbmFsOiBtaXQgbGljZW5zZS4gcGF1bCBpcmlzaC4gMjAxMC5cclxuXHQvLyBjb250cmlidXRvcnM6IE9yZW4gU29sb21pYW5paywgRGF2aWQgRGVTYW5kcm8sIFlpYW5uaXMgQ2hhdHppa29uc3RhbnRpbm91XHJcblxyXG5cdC8vIGJsYW5rIGltYWdlIGRhdGEtdXJpIGJ5cGFzc2VzIHdlYmtpdCBsb2cgd2FybmluZyAodGh4IGRvdWcgam9uZXMpXHJcblx0dmFyIEJMQU5LID0gJ2RhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBSUFBQUFBQUFQLy8veXdBQUFBQUFRQUJBQUFDQVV3QU93PT0nO1xyXG5cclxuXHQkLmZuLmltYWdlc0xvYWRlZCA9IGZ1bmN0aW9uKCBjYWxsYmFjayApIHtcclxuXHRcdHZhciAkdGhpcyA9IHRoaXMsXHJcblx0XHRcdGRlZmVycmVkID0gJC5pc0Z1bmN0aW9uKCQuRGVmZXJyZWQpID8gJC5EZWZlcnJlZCgpIDogMCxcclxuXHRcdFx0aGFzTm90aWZ5ID0gJC5pc0Z1bmN0aW9uKGRlZmVycmVkLm5vdGlmeSksXHJcblx0XHRcdCRpbWFnZXMgPSAkdGhpcy5maW5kKCdpbWcnKS5hZGQoICR0aGlzLmZpbHRlcignaW1nJykgKSxcclxuXHRcdFx0bG9hZGVkID0gW10sXHJcblx0XHRcdHByb3BlciA9IFtdLFxyXG5cdFx0XHRicm9rZW4gPSBbXTtcclxuXHJcblx0XHQvLyBSZWdpc3RlciBkZWZlcnJlZCBjYWxsYmFja3NcclxuXHRcdGlmICgkLmlzUGxhaW5PYmplY3QoY2FsbGJhY2spKSB7XHJcblx0XHRcdCQuZWFjaChjYWxsYmFjaywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcclxuXHRcdFx0XHRpZiAoa2V5ID09PSAnY2FsbGJhY2snKSB7XHJcblx0XHRcdFx0XHRjYWxsYmFjayA9IHZhbHVlO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoZGVmZXJyZWQpIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkW2tleV0odmFsdWUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZG9uZUxvYWRpbmcoKSB7XHJcblx0XHRcdHZhciAkcHJvcGVyID0gJChwcm9wZXIpLFxyXG5cdFx0XHRcdCRicm9rZW4gPSAkKGJyb2tlbik7XHJcblxyXG5cdFx0XHRpZiAoIGRlZmVycmVkICkge1xyXG5cdFx0XHRcdGlmICggYnJva2VuLmxlbmd0aCApIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnJlamVjdCggJGltYWdlcywgJHByb3BlciwgJGJyb2tlbiApO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKCAkaW1hZ2VzICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoICQuaXNGdW5jdGlvbiggY2FsbGJhY2sgKSApIHtcclxuXHRcdFx0XHRjYWxsYmFjay5jYWxsKCAkdGhpcywgJGltYWdlcywgJHByb3BlciwgJGJyb2tlbiApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gaW1nTG9hZGVkKCBpbWcsIGlzQnJva2VuICkge1xyXG5cdFx0XHQvLyBkb24ndCBwcm9jZWVkIGlmIEJMQU5LIGltYWdlLCBvciBpbWFnZSBpcyBhbHJlYWR5IGxvYWRlZFxyXG5cdFx0XHRpZiAoIGltZy5zcmMgPT09IEJMQU5LIHx8ICQuaW5BcnJheSggaW1nLCBsb2FkZWQgKSAhPT0gLTEgKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBzdG9yZSBlbGVtZW50IGluIGxvYWRlZCBpbWFnZXMgYXJyYXlcclxuXHRcdFx0bG9hZGVkLnB1c2goIGltZyApO1xyXG5cclxuXHRcdFx0Ly8ga2VlcCB0cmFjayBvZiBicm9rZW4gYW5kIHByb3Blcmx5IGxvYWRlZCBpbWFnZXNcclxuXHRcdFx0aWYgKCBpc0Jyb2tlbiApIHtcclxuXHRcdFx0XHRicm9rZW4ucHVzaCggaW1nICk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cHJvcGVyLnB1c2goIGltZyApO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBjYWNoZSBpbWFnZSBhbmQgaXRzIHN0YXRlIGZvciBmdXR1cmUgY2FsbHNcclxuXHRcdFx0JC5kYXRhKCBpbWcsICdpbWFnZXNMb2FkZWQnLCB7IGlzQnJva2VuOiBpc0Jyb2tlbiwgc3JjOiBpbWcuc3JjIH0gKTtcclxuXHJcblx0XHRcdC8vIHRyaWdnZXIgZGVmZXJyZWQgcHJvZ3Jlc3MgbWV0aG9kIGlmIHByZXNlbnRcclxuXHRcdFx0aWYgKCBoYXNOb3RpZnkgKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQubm90aWZ5V2l0aCggJChpbWcpLCBbIGlzQnJva2VuLCAkaW1hZ2VzLCAkKHByb3BlciksICQoYnJva2VuKSBdICk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIGNhbGwgZG9uZUxvYWRpbmcgYW5kIGNsZWFuIGxpc3RlbmVycyBpZiBhbGwgaW1hZ2VzIGFyZSBsb2FkZWRcclxuXHRcdFx0aWYgKCAkaW1hZ2VzLmxlbmd0aCA9PT0gbG9hZGVkLmxlbmd0aCApe1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoIGRvbmVMb2FkaW5nICk7XHJcblx0XHRcdFx0JGltYWdlcy51bmJpbmQoICcuaW1hZ2VzTG9hZGVkJyApO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gaWYgbm8gaW1hZ2VzLCB0cmlnZ2VyIGltbWVkaWF0ZWx5XHJcblx0XHRpZiAoICEkaW1hZ2VzLmxlbmd0aCApIHtcclxuXHRcdFx0ZG9uZUxvYWRpbmcoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdCRpbWFnZXMuYmluZCggJ2xvYWQuaW1hZ2VzTG9hZGVkIGVycm9yLmltYWdlc0xvYWRlZCcsIGZ1bmN0aW9uKCBldmVudCApe1xyXG5cdFx0XHRcdC8vIHRyaWdnZXIgaW1nTG9hZGVkXHJcblx0XHRcdFx0aW1nTG9hZGVkKCBldmVudC50YXJnZXQsIGV2ZW50LnR5cGUgPT09ICdlcnJvcicgKTtcclxuXHRcdFx0fSkuZWFjaCggZnVuY3Rpb24oIGksIGVsICkge1xyXG5cdFx0XHRcdHZhciBzcmMgPSBlbC5zcmM7XHJcblxyXG5cdFx0XHRcdC8vIGZpbmQgb3V0IGlmIHRoaXMgaW1hZ2UgaGFzIGJlZW4gYWxyZWFkeSBjaGVja2VkIGZvciBzdGF0dXNcclxuXHRcdFx0XHQvLyBpZiBpdCB3YXMsIGFuZCBzcmMgaGFzIG5vdCBjaGFuZ2VkLCBjYWxsIGltZ0xvYWRlZCBvbiBpdFxyXG5cdFx0XHRcdHZhciBjYWNoZWQgPSAkLmRhdGEoIGVsLCAnaW1hZ2VzTG9hZGVkJyApO1xyXG5cdFx0XHRcdGlmICggY2FjaGVkICYmIGNhY2hlZC5zcmMgPT09IHNyYyApIHtcclxuXHRcdFx0XHRcdGltZ0xvYWRlZCggZWwsIGNhY2hlZC5pc0Jyb2tlbiApO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly8gaWYgY29tcGxldGUgaXMgdHJ1ZSBhbmQgYnJvd3NlciBzdXBwb3J0cyBuYXR1cmFsIHNpemVzLCB0cnlcclxuXHRcdFx0XHQvLyB0byBjaGVjayBmb3IgaW1hZ2Ugc3RhdHVzIG1hbnVhbGx5XHJcblx0XHRcdFx0aWYgKCBlbC5jb21wbGV0ZSAmJiBlbC5uYXR1cmFsV2lkdGggIT09IHVuZGVmaW5lZCApIHtcclxuXHRcdFx0XHRcdGltZ0xvYWRlZCggZWwsIGVsLm5hdHVyYWxXaWR0aCA9PT0gMCB8fCBlbC5uYXR1cmFsSGVpZ2h0ID09PSAwICk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBjYWNoZWQgaW1hZ2VzIGRvbid0IGZpcmUgbG9hZCBzb21ldGltZXMsIHNvIHdlIHJlc2V0IHNyYywgYnV0IG9ubHkgd2hlblxyXG5cdFx0XHRcdC8vIGRlYWxpbmcgd2l0aCBJRSwgb3IgaW1hZ2UgaXMgY29tcGxldGUgKGxvYWRlZCkgYW5kIGZhaWxlZCBtYW51YWwgY2hlY2tcclxuXHRcdFx0XHQvLyB3ZWJraXQgaGFjayBmcm9tIGh0dHA6Ly9ncm91cHMuZ29vZ2xlLmNvbS9ncm91cC9qcXVlcnktZGV2L2Jyb3dzZV90aHJlYWQvdGhyZWFkL2VlZTZhYjdiMmRhNTBlMWZcclxuXHRcdFx0XHRpZiAoIGVsLnJlYWR5U3RhdGUgfHwgZWwuY29tcGxldGUgKSB7XHJcblx0XHRcdFx0XHRlbC5zcmMgPSBCTEFOSztcclxuXHRcdFx0XHRcdGVsLnNyYyA9IHNyYztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZCA/IGRlZmVycmVkLnByb21pc2UoICR0aGlzICkgOiAkdGhpcztcclxuXHR9O1xyXG5cclxuXHQvLyBnbG9iYWxcclxuXHR2YXIgJHdpbmRvdyA9ICQoIHdpbmRvdyApLFxyXG5cdFx0TW9kZXJuaXpyID0gd2luZG93Lk1vZGVybml6cjtcclxuXHJcblx0JC5TdGFwZWwgPSBmdW5jdGlvbiggb3B0aW9ucywgZWxlbWVudCApIHtcclxuXHRcdFxyXG5cdFx0dGhpcy5lbCA9ICQoIGVsZW1lbnQgKTtcclxuXHRcdHRoaXMuX2luaXQoIG9wdGlvbnMgKTtcclxuXHRcdFxyXG5cdH07XHJcblxyXG5cdC8vIHRoZSBvcHRpb25zXHJcblx0JC5TdGFwZWwuZGVmYXVsdHMgPSB7XHJcblx0XHQvLyBzcGFjZSBiZXR3ZWVuIHRoZSBpdGVtc1xyXG5cdFx0Z3V0dGVyIDogNDAsXHJcblx0XHQvLyB0aGUgcm90YXRpb25zIGRlZ3JlZSBmb3IgdGhlIDJuZCBhbmQgM3JkIGl0ZW0gXHJcblx0XHQvLyAodG8gZ2l2ZSBhIG1vcmUgcmVhbGlzdGljIHBpbGUgZWZmZWN0KVxyXG5cdFx0cGlsZUFuZ2xlcyA6IDIsXHJcblx0XHQvLyBhbmltYXRpb24gc2V0dGluZ3MgZm9yIHRoZSBjbGlja2VkIHBpbGUncyBpdGVtc1xyXG5cdFx0cGlsZUFuaW1hdGlvbiA6IHsgXHJcblx0XHRcdG9wZW5TcGVlZCA6IDQwMCxcclxuXHRcdFx0b3BlbkVhc2luZyA6ICdlYXNlLWluLW91dCcsIC8vIHRyeSB0aGlzIDopICdjdWJpYy1iZXppZXIoLjQ3LDEuMzQsLjksMS4wMyknLFxyXG5cdFx0XHRjbG9zZVNwZWVkIDogNDAwLFxyXG5cdFx0XHRjbG9zZUVhc2luZyA6ICdlYXNlLWluLW91dCdcclxuXHRcdH0sXHJcblx0XHQvLyBhbmltYXRpb24gc2V0dGluZ3MgZm9yIHRoZSBvdGhlciBwaWxlc1xyXG5cdFx0b3RoZXJQaWxlQW5pbWF0aW9uIDogeyBcclxuXHRcdFx0b3BlblNwZWVkIDogNDAwLFxyXG5cdFx0XHRvcGVuRWFzaW5nIDogJ2Vhc2UtaW4tb3V0JyxcclxuXHRcdFx0Y2xvc2VTcGVlZCA6IDM1MCxcclxuXHRcdFx0Y2xvc2VFYXNpbmcgOiAnZWFzZS1pbi1vdXQnXHJcblx0XHR9LFxyXG5cdFx0Ly8gZGVsYXkgZm9yIGVhY2ggaXRlbSBvZiB0aGUgcGlsZVxyXG5cdFx0ZGVsYXkgOiAwLFxyXG5cdFx0Ly8gcmFuZG9tIHJvdGF0aW9uIGZvciB0aGUgaXRlbXMgb25jZSBvcGVuZWRcclxuXHRcdHJhbmRvbUFuZ2xlIDogZmFsc2UsXHJcblx0XHRvbkxvYWQgOiBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9LFxyXG5cdFx0b25CZWZvcmVPcGVuIDogZnVuY3Rpb24oIHBpbGVOYW1lICkgeyByZXR1cm4gZmFsc2U7IH0sXHJcblx0XHRvbkFmdGVyT3BlbiA6IGZ1bmN0aW9uKCBwaWxlTmFtZSwgdG90YWxJdGVtcyApIHsgcmV0dXJuIGZhbHNlOyB9LFxyXG5cdFx0b25CZWZvcmVDbG9zZSA6IGZ1bmN0aW9uKCBwaWxlTmFtZSApIHsgcmV0dXJuIGZhbHNlOyB9LFxyXG5cdFx0b25BZnRlckNsb3NlIDogZnVuY3Rpb24oIHBpbGVOYW1lLCB0b3RhbEl0ZW1zICkgeyByZXR1cm4gZmFsc2U7IH1cclxuXHR9O1xyXG5cclxuXHQkLlN0YXBlbC5wcm90b3R5cGUgPSB7XHJcblxyXG5cdFx0X2luaXQgOiBmdW5jdGlvbiggb3B0aW9ucyApIHtcclxuXHRcdFx0XHJcblx0XHRcdC8vIG9wdGlvbnNcclxuXHRcdFx0dGhpcy5vcHRpb25zID0gJC5leHRlbmQoIHRydWUsIHt9LCAkLlN0YXBlbC5kZWZhdWx0cywgb3B0aW9ucyApO1xyXG5cclxuXHRcdFx0Ly8gY2FjaGUgc29tZSBlbGVtZW50c1xyXG5cdFx0XHR0aGlzLl9jb25maWcoKTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIHByZWxvYWQgaW1hZ2VzXHJcblx0XHRcdHZhciBzZWxmID0gdGhpcztcclxuXHRcdFx0dGhpcy5lbC5pbWFnZXNMb2FkZWQoIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHNlbGYub3B0aW9ucy5vbkxvYWQoKTtcclxuXHRcdFx0XHRzZWxmLl9sYXlvdXQoKTtcclxuXHRcdFx0XHRzZWxmLl9pbml0RXZlbnRzKCk7XHJcblx0XHRcdH0gKTtcclxuXHJcblx0XHR9LFxyXG5cdFx0X2NvbmZpZyA6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0Ly8gY3NzIHRyYW5zaXRpb25zIHN1cHBvcnRcclxuXHRcdFx0dGhpcy5zdXBwb3J0ID0gTW9kZXJuaXpyLmNzc3RyYW5zaXRpb25zO1xyXG5cclxuXHRcdFx0dmFyIHRyYW5zRW5kRXZlbnROYW1lcyA9IHtcclxuXHRcdFx0XHRcdCdXZWJraXRUcmFuc2l0aW9uJyA6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcclxuXHRcdFx0XHRcdCdNb3pUcmFuc2l0aW9uJyA6ICd0cmFuc2l0aW9uZW5kJyxcclxuXHRcdFx0XHRcdCdPVHJhbnNpdGlvbicgOiAnb1RyYW5zaXRpb25FbmQnLFxyXG5cdFx0XHRcdFx0J21zVHJhbnNpdGlvbicgOiAnTVNUcmFuc2l0aW9uRW5kJyxcclxuXHRcdFx0XHRcdCd0cmFuc2l0aW9uJyA6ICd0cmFuc2l0aW9uZW5kJ1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0dHJhbnNmb3JtTmFtZXMgPSB7XHJcblx0XHRcdFx0XHQnV2Via2l0VHJhbnNmb3JtJyA6ICctd2Via2l0LXRyYW5zZm9ybScsXHJcblx0XHRcdFx0XHQnTW96VHJhbnNmb3JtJyA6ICctbW96LXRyYW5zZm9ybScsXHJcblx0XHRcdFx0XHQnT1RyYW5zZm9ybScgOiAnLW8tdHJhbnNmb3JtJyxcclxuXHRcdFx0XHRcdCdtc1RyYW5zZm9ybScgOiAnLW1zLXRyYW5zZm9ybScsXHJcblx0XHRcdFx0XHQndHJhbnNmb3JtJyA6ICd0cmFuc2Zvcm0nXHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdGlmKCB0aGlzLnN1cHBvcnQgKSB7XHJcblxyXG5cdFx0XHRcdHRoaXMudHJhbnNFbmRFdmVudE5hbWUgPSB0cmFuc0VuZEV2ZW50TmFtZXNbIE1vZGVybml6ci5wcmVmaXhlZCggJ3RyYW5zaXRpb24nICkgXSArICcuY2JwRldTbGlkZXInO1xyXG5cdFx0XHRcdHRoaXMudHJhbnNmb3JtTmFtZSA9IHRyYW5zZm9ybU5hbWVzWyBNb2Rlcm5penIucHJlZml4ZWQoICd0cmFuc2Zvcm0nICkgXTtcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIHRydWUgaWYgb25lIHBpbGUgaXMgb3BlbmVkXHJcblx0XHRcdHRoaXMuc3ByZWFkID0gZmFsc2U7XHJcblxyXG5cdFx0XHQvLyB0aGUgbGknc1xyXG5cdFx0XHR0aGlzLml0ZW1zID0gdGhpcy5lbC5jaGlsZHJlbiggJ2xpJyApLmhpZGUoKTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIGNsb3NlIHBpbGVcclxuXHRcdFx0dGhpcy5jbG9zZSA9ICQoICcjdHAtY2xvc2UnICk7XHJcblxyXG5cdFx0fSxcclxuXHRcdF9nZXRTaXplIDogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHR0aGlzLmVsV2lkdGggPSB0aGlzLmVsLm91dGVyV2lkdGgoIHRydWUgKTtcclxuXHJcblx0XHR9LFxyXG5cdFx0X2luaXRFdmVudHMgOiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdHZhciBzZWxmID0gdGhpcztcclxuXHRcdFx0JHdpbmRvdy5vbiggJ2RlYm91bmNlZHJlc2l6ZS5zdGFwZWwnLCBmdW5jdGlvbigpIHsgc2VsZi5fcmVzaXplKCk7IH0gKTtcclxuXHRcdFx0dGhpcy5pdGVtcy5vbiggJ2NsaWNrLnN0YXBlbCcsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHZhciAkaXRlbSA9ICQoIHRoaXMgKTtcclxuXHJcblx0XHRcdFx0aWYoICFzZWxmLnNwcmVhZCAmJiAkaXRlbS5kYXRhKCAnaXNQaWxlJyApICkge1xyXG5cclxuXHRcdFx0XHRcdHNlbGYuc3ByZWFkID0gdHJ1ZTtcclxuXHRcdFx0XHRcdHNlbGYucGlsZU5hbWUgPSAkaXRlbS5kYXRhKCAncGlsZU5hbWUnICk7XHJcblx0XHRcdFx0XHRzZWxmLm9wdGlvbnMub25CZWZvcmVPcGVuKCBzZWxmLnBpbGVOYW1lICk7XHJcblx0XHRcdFx0XHRzZWxmLl9vcGVuUGlsZSgpO1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH0gKTtcclxuXHJcblx0XHR9LFxyXG5cdFx0X2xheW91dCA6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0LypcclxuXHRcdFx0cGlsZXMoKSA6IHNhdmUgdGhlIGl0ZW1zIGluZm8gaW4gYSBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHN0cnVjdHVyZTpcclxuXHJcblx0XHRcdHRoaXMucGlsZXMgPSB7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0cGlsZU5hbWUgOiB7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdC8vIGVsZW1lbnRzIG9mIHRoaXMgcGlsZSAobm90ZSB0aGF0IGFuIGVsZW1lbnQgY2FuIGJlIGFsc28gaW4gYSBkaWZmZXJlbnQgcGlsZSlcclxuXHRcdFx0XHRcdC8vIGZvciBlYWNoIGVsZW1lbnQsIHRoZSBmaW5hbFBvc2l0aW9uIGlzIHRoZSBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB3aGVuIHRoZSBwaWxlIGlzIG9wZW5lZFxyXG5cdFx0XHRcdFx0ZWxlbWVudHMgOiBbXHJcblx0XHRcdFx0XHRcdHsgZWwgOiBIVE1MRUxFTUVOVCwgZmluYWxQb3NpdGlvbiA6IHsgbGVmdCA6IExFRlQsIHRvcCA6IFRPUCB9IH0sXHJcblx0XHRcdFx0XHRcdHt9LFxyXG5cdFx0XHRcdFx0XHR7fSxcclxuXHRcdFx0XHRcdFx0Li4uXHJcblx0XHRcdFx0XHRdLFxyXG5cdFx0XHRcdFx0Ly8gdGhpcyBpcyB0aGUgcG9zaXRpb24gb2YgdGhlIHBpbGUgKGFsbCBlbGVtZW50cyBvZiB0aGUgcGlsZSkgd2hlbiB0aGUgcGlsZSBpcyBjbG9zZWRcclxuXHRcdFx0XHRcdHBvc2l0aW9uIDogeyBsZWZ0IDogTEVGVCwgdG9wIDogVE9QIH0sXHJcblx0XHRcdFx0XHRpbmRleCA6IElOREVYXHJcblx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0Ly8gbW9yZSBwaWxlc1xyXG5cdFx0XHRcdC4uLlxyXG5cclxuXHRcdFx0fVxyXG5cdFx0XHQqL1xyXG5cdFx0XHR0aGlzLl9waWxlcygpO1xyXG5cclxuXHRcdFx0Ly8gaXRlbXMgd2lkdGggJiBoZWlnaHRcclxuXHRcdFx0Ly8gYXNzdW1pbmcgaGVyZSB0aGF0IGFsbCBpdGVtcyBoYXZlIHRoZSBzYW1lIHdpZHRoIGFuZCBoZWlnaHRcclxuXHRcdFx0dGhpcy5pdGVtU2l6ZSA9IHsgd2lkdGggOiB0aGlzLml0ZW1zLm91dGVyV2lkdGgoIHRydWUgKSAsIGhlaWdodCA6IHRoaXMuaXRlbXMub3V0ZXJIZWlnaHQoIHRydWUgKSB9O1xyXG5cclxuXHRcdFx0Ly8gcmVtb3ZlIG9yaWdpbmFsIGVsZW1lbnRzXHJcblx0XHRcdHRoaXMuaXRlbXMucmVtb3ZlKCk7XHJcblxyXG5cdFx0XHQvLyBhcHBsaWVzIHNvbWUgaW5pdGlhbCBzdHlsZSBmb3IgdGhlIGl0ZW1zXHJcblx0XHRcdHRoaXMuX3NldEluaXRpYWxTdHlsZSgpO1xyXG5cclxuXHRcdFx0dGhpcy5lbC5jc3MoICdtaW4td2lkdGgnLCB0aGlzLml0ZW1TaXplLndpZHRoICsgdGhpcy5vcHRpb25zLmd1dHRlciApO1xyXG5cclxuXHRcdFx0Ly8gZ2V0cyB0aGUgY3VycmVudCB1bCBzaXplIChuZWVkZWQgZm9yIHRoZSBjYWxjdWxhdGlvbiBvZiBlYWNoIGl0ZW0ncyBwb3NpdGlvbilcclxuXHRcdFx0dGhpcy5fZ2V0U2l6ZSgpO1xyXG5cclxuXHRcdFx0Ly8gY2FsY3VsYXRlIGFuZCBzZXQgZWFjaCBQaWxlJ3MgZWxlbWVudHMgcG9zaXRpb24gYmFzZWQgb24gdGhlIGN1cnJlbnQgdWwgd2lkdGhcclxuXHRcdFx0Ly8gdGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gYmUgY2FsbGVkIG9uIHdpbmRvdyByZXNpemVcclxuXHRcdFx0dGhpcy5fc2V0SXRlbXNQb3NpdGlvbigpO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gbmV3IGl0ZW1zXHJcblx0XHRcdHRoaXMuaXRlbXMgPSB0aGlzLmVsLmNoaWxkcmVuKCAnbGknICkuc2hvdygpO1xyXG5cdFx0XHQvLyB0b3RhbCBpdGVtc1xyXG5cdFx0XHR0aGlzLml0ZW1zQ291bnRcdD0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG5cdFx0fSxcclxuXHRcdF9waWxlcyA6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0dGhpcy5waWxlcyA9IHt9O1xyXG5cdFx0XHR2YXIgcGlsZSwgc2VsZiA9IHRoaXMsIGlkeCA9IDA7XHJcblx0XHRcdHRoaXMuaXRlbXMuZWFjaCggZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHR2YXIgJGl0ZW0gPSAkKCB0aGlzICksXHJcblx0XHRcdFx0XHRpdGVtUGlsZSA9ICRpdGVtLmF0dHIoICdkYXRhLXBpbGUnICkgfHwgJ25vcGlsZS0nICsgJGl0ZW0uaW5kZXgoKSxcclxuXHRcdFx0XHRcdGF0dHIgPSBpdGVtUGlsZS5zcGxpdCggJywnICk7XHJcblxyXG5cdFx0XHRcdGZvciggdmFyIGkgPSAwLCB0b3RhbCA9IGF0dHIubGVuZ3RoOyBpIDwgdG90YWw7ICsraSApIHtcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0dmFyIHBpbGVOYW1lID0gJC50cmltKCBhdHRyW2ldICk7XHJcblx0XHRcdFx0XHRwaWxlID0gc2VsZi5waWxlc1sgcGlsZU5hbWUgXTtcclxuXHJcblx0XHRcdFx0XHRpZiggIXBpbGUgKSB7XHJcblxyXG5cdFx0XHRcdFx0XHRwaWxlID0gc2VsZi5waWxlc1sgcGlsZU5hbWUgXSA9IHtcclxuXHRcdFx0XHRcdFx0XHRlbGVtZW50cyA6IFtdLFxyXG5cdFx0XHRcdFx0XHRcdHBvc2l0aW9uIDogeyBsZWZ0IDogMCwgdG9wIDogMCB9LFxyXG5cdFx0XHRcdFx0XHRcdGluZGV4IDogaWR4XHJcblx0XHRcdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdFx0XHQrK2lkeDtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0dmFyIGNsb25lID0gJGl0ZW0uY2xvbmUoKS5nZXQoMCk7XHJcblx0XHRcdFx0XHRwaWxlLmVsZW1lbnRzLnB1c2goIHsgZWwgOiBjbG9uZSwgZmluYWxQb3NpdGlvbiA6IHsgbGVmdCA6IDAsIHRvcCA6IDAgfSB9ICk7XHJcblx0XHRcdFx0XHQkKCBjbG9uZSApLmFwcGVuZFRvKCBzZWxmLmVsICk7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0fSApO1xyXG5cclxuXHRcdH0sXHJcblx0XHRfc2V0SW5pdGlhbFN0eWxlIDogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRmb3IoIHZhciBwaWxlIGluIHRoaXMucGlsZXMgKSB7XHJcblxyXG5cdFx0XHRcdHZhciBwID0gdGhpcy5waWxlc1twaWxlXTtcclxuXHJcblx0XHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IHAuZWxlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyArK2kgKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyICRlbCA9ICQoIHAuZWxlbWVudHNbaV0uZWwgKSxcclxuXHRcdFx0XHRcdFx0c3R5bGVDU1MgPSB7IHRyYW5zZm9ybSA6ICdyb3RhdGUoMGRlZyknIH07XHJcblxyXG5cdFx0XHRcdFx0dGhpcy5fYXBwbHlJbml0aWFsVHJhbnNpdGlvbiggJGVsICk7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0aWYoIGkgPT09IGxlbiAtIDIgKSB7XHJcblx0XHRcdFx0XHRcdHN0eWxlQ1NTID0geyB0cmFuc2Zvcm0gOiAncm90YXRlKCcgKyB0aGlzLm9wdGlvbnMucGlsZUFuZ2xlcyArICdkZWcpJyB9O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiggaSA9PT0gbGVuIC0gMyApIHtcclxuXHRcdFx0XHRcdFx0c3R5bGVDU1MgPSB7IHRyYW5zZm9ybSA6ICdyb3RhdGUoLScgKyB0aGlzLm9wdGlvbnMucGlsZUFuZ2xlcyArICdkZWcpJyB9O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiggaSAhPT0gbGVuIC0gMSApIHtcclxuXHRcdFx0XHRcdFx0dmFyIGV4dHJhU3R5bGUgPSB7IHZpc2liaWxpdHkgOiAnaGlkZGVuJyB9O1xyXG5cdFx0XHRcdFx0XHQkZWwuY3NzKCBleHRyYVN0eWxlICkuZGF0YSggJ2V4dHJhU3R5bGUnLCBleHRyYVN0eWxlICk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIGlmKCBwaWxlLnN1YnN0ciggMCwgNiApICE9PSAnbm9waWxlJyApIHtcclxuXHRcdFx0XHRcdFx0JGVsLmRhdGEoICdmcm9udCcsIHRydWUgKS5hcHBlbmQoICc8ZGl2IGNsYXNzPVwidHAtdGl0bGVcIj48c3Bhbj4nICsgcGlsZSArICc8L3NwYW4+PHNwYW4+JyArIGxlbiArICc8L3NwYW4+PC9kaXY+JyApO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdCRlbC5jc3MoIHN0eWxlQ1NTICkuZGF0YSgge1xyXG5cdFx0XHRcdFx0XHRpbml0aWFsU3R5bGUgOiBzdHlsZUNTUyxcclxuXHRcdFx0XHRcdFx0cGlsZU5hbWUgOiBwaWxlLFxyXG5cdFx0XHRcdFx0XHRwaWxlQ291bnQgOiBsZW4sXHJcblx0XHRcdFx0XHRcdHNoYWRvdyA6ICRlbC5jc3MoICdib3gtc2hhZG93JyApLFxyXG5cdFx0XHRcdFx0XHRpc1BpbGUgOiBwaWxlLnN1YnN0ciggMCwgNiApID09PSAnbm9waWxlJyA/IGZhbHNlIDogdHJ1ZVxyXG5cdFx0XHRcdFx0fSApO1xyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSxcclxuXHRcdF9hcHBseUluaXRpYWxUcmFuc2l0aW9uIDogZnVuY3Rpb24oICRlbCApIHtcclxuXHJcblx0XHRcdGlmKCB0aGlzLnN1cHBvcnQgKSB7XHJcblx0XHRcdFx0JGVsLmNzcyggJ3RyYW5zaXRpb24nLCAnbGVmdCA0MDBtcyBlYXNlLWluLW91dCwgdG9wIDQwMG1zIGVhc2UtaW4tb3V0JyApO1xyXG5cdFx0XHR9XHRcclxuXHJcblx0XHR9LFxyXG5cdFx0X3NldEl0ZW1zUG9zaXRpb24gOiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdHZhciBhY2N1bUwgPSAwLCBhY2N1bVQgPSAwLCBcclxuXHRcdFx0XHRsLCB0LCBtbCA9IDAsXHJcblx0XHRcdFx0bGFzdEl0ZW1Ub3AgPSAwO1xyXG5cclxuXHRcdFx0Zm9yKCB2YXIgcGlsZSBpbiB0aGlzLnBpbGVzICkge1xyXG5cclxuXHRcdFx0XHR2YXIgcCA9IHRoaXMucGlsZXNbcGlsZV0sXHJcblx0XHRcdFx0XHRzdGVwVyA9IHRoaXMuaXRlbVNpemUud2lkdGggKyB0aGlzLm9wdGlvbnMuZ3V0dGVyLFxyXG5cclxuXHRcdFx0XHRcdGFjY3VtSUwgPSAwLCBhY2N1bUlUID0gMCwgaWwsIGl0O1xyXG5cclxuXHRcdFx0XHRpZiggYWNjdW1MICsgc3RlcFcgPD0gdGhpcy5lbFdpZHRoICkge1xyXG5cclxuXHRcdFx0XHRcdGwgPSBhY2N1bUw7XHJcblx0XHRcdFx0XHR0ID0gYWNjdW1UO1xyXG5cdFx0XHRcdFx0YWNjdW1MICs9IHN0ZXBXO1xyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblxyXG5cdFx0XHRcdFx0aWYoIG1sID09PSAwICkge1xyXG5cdFx0XHRcdFx0XHRtbCA9IE1hdGguY2VpbCggKCB0aGlzLmVsV2lkdGggLSBhY2N1bUwgKyB0aGlzLm9wdGlvbnMuZ3V0dGVyICkgLyAyICk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0YWNjdW1UICs9IHRoaXMuaXRlbVNpemUuaGVpZ2h0ICsgdGhpcy5vcHRpb25zLmd1dHRlcjtcclxuXHRcdFx0XHRcdGwgPSAwO1xyXG5cdFx0XHRcdFx0dCA9IGFjY3VtVDtcclxuXHRcdFx0XHRcdGFjY3VtTCA9IHN0ZXBXO1xyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHAucG9zaXRpb24ubGVmdCA9IGw7XHJcblx0XHRcdFx0cC5wb3NpdGlvbi50b3AgPSB0O1xyXG5cclxuXHRcdFx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gcC5lbGVtZW50cy5sZW5ndGg7IGkgPCBsZW47ICsraSApIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgZWxlbSA9IHAuZWxlbWVudHNbaV0sXHJcblx0XHRcdFx0XHRcdGZwID0gZWxlbS5maW5hbFBvc2l0aW9uO1xyXG5cclxuXHRcdFx0XHRcdGlmKCBhY2N1bUlMICsgc3RlcFcgPD0gdGhpcy5lbFdpZHRoICkge1xyXG5cclxuXHRcdFx0XHRcdFx0aWwgPSBhY2N1bUlMO1xyXG5cdFx0XHRcdFx0XHRpdCA9IGFjY3VtSVQ7XHJcblx0XHRcdFx0XHRcdGFjY3VtSUwgKz0gc3RlcFc7XHJcblxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblxyXG5cdFx0XHRcdFx0XHRhY2N1bUlUICs9IHRoaXMuaXRlbVNpemUuaGVpZ2h0ICsgdGhpcy5vcHRpb25zLmd1dHRlcjtcclxuXHRcdFx0XHRcdFx0aWwgPSAwO1xyXG5cdFx0XHRcdFx0XHRpdCA9IGFjY3VtSVQ7XHJcblx0XHRcdFx0XHRcdGFjY3VtSUwgPSBzdGVwVztcclxuXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0ZnAubGVmdCA9IGlsO1xyXG5cdFx0XHRcdFx0ZnAudG9wID0gaXQ7XHJcblxyXG5cdFx0XHRcdFx0dmFyICRlbCA9ICQoIGVsZW0uZWwgKTtcclxuXHJcblx0XHRcdFx0XHRpZiggcGlsZSAhPT0gdGhpcy5waWxlTmFtZSApIHtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdCRlbC5jc3MoIHsgbGVmdCA6IHAucG9zaXRpb24ubGVmdCwgdG9wIDogcC5wb3NpdGlvbi50b3AgfSApO1xyXG5cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cclxuXHRcdFx0XHRcdFx0bGFzdEl0ZW1Ub3AgPSBlbGVtLmZpbmFsUG9zaXRpb24udG9wO1xyXG5cdFx0XHRcdFx0XHQkZWwuY3NzKCB7IGxlZnQgOiBlbGVtLmZpbmFsUG9zaXRpb24ubGVmdCwgdG9wIDogbGFzdEl0ZW1Ub3AgfSApO1xyXG5cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gdGhlIHBvc2l0aW9uIG9mIHRoZSBpdGVtcyB3aWxsIGluZmx1ZW5jZSB0aGUgZmluYWwgbWFyZ2luIGxlZnQgdmFsdWUgYW5kIGhlaWdodCBmb3IgdGhlIHVsXHJcblx0XHRcdC8vIGNlbnRlciB0aGUgdWxcclxuXHRcdFx0bGFzdEl0ZW1Ub3AgPSB0aGlzLnNwcmVhZCA/IGxhc3RJdGVtVG9wIDogYWNjdW1UO1xyXG5cdFx0XHR0aGlzLmVsLmNzcygge1xyXG5cdFx0XHRcdG1hcmdpbkxlZnQgOiBtbCxcclxuXHRcdFx0XHRoZWlnaHQgOiBsYXN0SXRlbVRvcCArIHRoaXMuaXRlbVNpemUuaGVpZ2h0XHJcblx0XHRcdH0gKTtcclxuXHJcblx0XHR9LFxyXG5cdFx0X29wZW5QaWxlIDogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRpZiggIXRoaXMuc3ByZWFkICkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gZmluYWwgc3R5bGVcclxuXHRcdFx0dmFyIGZzO1xyXG5cdFx0XHRmb3IoIHZhciBwaWxlIGluIHRoaXMucGlsZXMgKSB7XHJcblxyXG5cdFx0XHRcdHZhciBwID0gdGhpcy5waWxlc1sgcGlsZSBdLCBjbnQgPSAwO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBwLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgKytpICkge1xyXG5cclxuXHRcdFx0XHRcdHZhciBlbGVtID0gcC5lbGVtZW50c1tpXSxcclxuXHRcdFx0XHRcdFx0JGl0ZW0gPSAkKCBlbGVtLmVsICksXHJcblx0XHRcdFx0XHRcdCRpbWcgPSAkaXRlbS5maW5kKCAnaW1nJyApLFxyXG5cdFx0XHRcdFx0XHRzdHlsZUNTUyA9IHBpbGUgPT09IHRoaXMucGlsZU5hbWUgPyB7XHJcblx0XHRcdFx0XHRcdFx0ekluZGV4IDogOTk5OSxcclxuXHRcdFx0XHRcdFx0XHR2aXNpYmlsaXR5IDogJ3Zpc2libGUnLFxyXG5cdFx0XHRcdFx0XHRcdHRyYW5zaXRpb24gOiB0aGlzLnN1cHBvcnQgPyAnbGVmdCAnICsgdGhpcy5vcHRpb25zLnBpbGVBbmltYXRpb24ub3BlblNwZWVkICsgJ21zICcgKyAoICggbGVuIC0gaSAtIDEgKSAqIHRoaXMub3B0aW9ucy5kZWxheSApICsgJ21zICcgKyB0aGlzLm9wdGlvbnMucGlsZUFuaW1hdGlvbi5vcGVuRWFzaW5nICsgJywgdG9wICcgKyB0aGlzLm9wdGlvbnMucGlsZUFuaW1hdGlvbi5vcGVuU3BlZWQgKyAnbXMgJyArICggKCBsZW4gLSBpIC0gMSApICogdGhpcy5vcHRpb25zLmRlbGF5ICkgKyAnbXMgJyArIHRoaXMub3B0aW9ucy5waWxlQW5pbWF0aW9uLm9wZW5FYXNpbmcgKyAnLCAnICsgdGhpcy50cmFuc2Zvcm1OYW1lICsgJyAnICsgdGhpcy5vcHRpb25zLnBpbGVBbmltYXRpb24ub3BlblNwZWVkICsgJ21zICcgKyAoICggbGVuIC0gaSAtIDEgKSAqIHRoaXMub3B0aW9ucy5kZWxheSApICsgJ21zICcgKyB0aGlzLm9wdGlvbnMucGlsZUFuaW1hdGlvbi5vcGVuRWFzaW5nIDogJ25vbmUnXHJcblx0XHRcdFx0XHRcdH0gOiB7XHJcblx0XHRcdFx0XHRcdFx0ekluZGV4IDogMSxcclxuXHRcdFx0XHRcdFx0XHR0cmFuc2l0aW9uIDogdGhpcy5zdXBwb3J0ID8gJ29wYWNpdHkgJyArIHRoaXMub3B0aW9ucy5vdGhlclBpbGVBbmltYXRpb24uY2xvc2VTcGVlZCArICdtcyAnICsgdGhpcy5vcHRpb25zLm90aGVyUGlsZUFuaW1hdGlvbi5jbG9zZUVhc2luZyA6ICdub25lJ1xyXG5cdFx0XHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0XHRcdGlmKCBwaWxlID09PSB0aGlzLnBpbGVOYW1lICkge1xyXG5cclxuXHRcdFx0XHRcdFx0aWYoICRpdGVtLmRhdGEoICdmcm9udCcgKSApIHtcclxuXHRcdFx0XHRcdFx0XHQkaXRlbS5maW5kKCAnZGl2LnRwLXRpdGxlJyApLmhpZGUoKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYoIGkgPCBsZW4gLSAxICApIHtcclxuXHRcdFx0XHRcdFx0XHQkaW1nLmNzcyggJ3Zpc2liaWxpdHknLCAndmlzaWJsZScgKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0ZnMgPSBlbGVtLmZpbmFsUG9zaXRpb247XHJcblx0XHRcdFx0XHRcdGZzLnRyYW5zZm9ybSA9IHRoaXMub3B0aW9ucy5yYW5kb21BbmdsZSAmJiBpICE9PSBwLmluZGV4ID8gJ3JvdGF0ZSgnICsgTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqICggNSArIDUgKyAxICkgLSA1ICkgKyAnZGVnKScgOiAnbm9uZSc7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiggIXRoaXMuc3VwcG9ydCApIHtcclxuXHRcdFx0XHRcdFx0XHQkaXRlbS5jc3MoICd0cmFuc2Zvcm0nLCAnbm9uZScgKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0Ly8gaGFjazogcmVtb3ZlIGJveC1zaGFkb3cgd2hpbGUgYW5pbWF0aW5nIHRvIHByZXZlbnQgdGhlIHNoYWRvdyBzdGFjayBlZmZlY3RcclxuXHRcdFx0XHRcdFx0aWYoIGkgPCBsZW4gLSAzICkge1xyXG5cdFx0XHRcdFx0XHRcdCRpdGVtLmNzcyggJ2JveC1zaGFkb3cnLCAnbm9uZScgKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2UgaWYoIGkgPCBsZW4gLSAxICApIHtcclxuXHRcdFx0XHRcdFx0JGltZy5jc3MoICd2aXNpYmlsaXR5JywgJ2hpZGRlbicgKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHQkaXRlbS5jc3MoIHN0eWxlQ1NTICk7XHJcblxyXG5cdFx0XHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRcdFx0XHRcdHBpbGUgPT09IHRoaXMucGlsZU5hbWUgP1xyXG5cdFx0XHRcdFx0XHR0aGlzLl9hcHBseVRyYW5zaXRpb24oICRpdGVtLCBmcywgdGhpcy5vcHRpb25zLnBpbGVBbmltYXRpb24ub3BlblNwZWVkLCBmdW5jdGlvbiggZXZ0ICkge1xyXG5cclxuXHRcdFx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQgfHwgdGhpcy5ub2RlTmFtZTtcclxuXHRcdFx0XHRcdFx0XHRpZiggdGFyZ2V0ICE9PSAnTEknICkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyICRlbCA9ICQoIHRoaXMgKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0Ly8gaGFjazogcmVtb3ZlIGJveC1zaGFkb3cgd2hpbGUgYW5pbWF0aW5nIHRvIHByZXZlbnQgdGhlIHNoYWRvdyBzdGFjayBlZmZlY3RcclxuXHRcdFx0XHRcdFx0XHQkZWwuY3NzKCAnYm94LXNoYWRvdycsICRlbC5kYXRhKCAnc2hhZG93JyApICk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmKCBzZWxmLnN1cHBvcnQgKSB7XHJcblx0XHRcdFx0XHRcdFx0XHQkZWwub2ZmKCBzZWxmLnRyYW5zRW5kRXZlbnROYW1lICk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHQrK2NudDtcclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHRpZiggY250ID09PSAkZWwuZGF0YSggJ3BpbGVDb3VudCcgKSApIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHQkKCBkb2N1bWVudCApLm9uZSggJ21vdXNlbW92ZS5zdGFwZWwnLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0c2VsZi5lbC5hZGRDbGFzcyggJ3RwLW9wZW4nICk7XHJcblx0XHRcdFx0XHRcdFx0XHR9ICk7XHJcblx0XHRcdFx0XHRcdFx0XHRzZWxmLm9wdGlvbnMub25BZnRlck9wZW4oIHNlbGYucGlsZU5hbWUsIGNudCApO1xyXG5cclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHR9ICkgOlxyXG5cdFx0XHRcdFx0XHR0aGlzLl9hcHBseVRyYW5zaXRpb24oICRpdGVtLCB7IG9wYWNpdHkgOiAwIH0sIHRoaXMub3B0aW9ucy5vdGhlclBpbGVBbmltYXRpb24uY2xvc2VTcGVlZCApO1xyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmVsLmNzcyggJ2hlaWdodCcsIGZzLnRvcCArIHRoaXMuaXRlbVNpemUuaGVpZ2h0ICk7XHRcclxuXHJcblx0XHR9LFxyXG5cdFx0X2Nsb3NlUGlsZSA6IGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRcdFx0Ly8gY2xvc2UuLlxyXG5cdFx0XHRpZiggdGhpcy5zcHJlYWQgKSB7XHJcblxyXG5cdFx0XHRcdHRoaXMuc3ByZWFkID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdHRoaXMub3B0aW9ucy5vbkJlZm9yZUNsb3NlKCB0aGlzLnBpbGVOYW1lICk7XHJcblxyXG5cdFx0XHRcdHRoaXMuZWwucmVtb3ZlQ2xhc3MoICd0cC1vcGVuJyApO1xyXG5cclxuXHRcdFx0XHQvLyBmaW5hbCBzdHlsZVxyXG5cdFx0XHRcdHZhciBmcztcclxuXHRcdFx0XHRmb3IoIHZhciBwaWxlIGluIHRoaXMucGlsZXMgKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIHAgPSB0aGlzLnBpbGVzWyBwaWxlIF0sIGNudCA9IDA7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBwLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgKytpICkge1xyXG5cclxuXHRcdFx0XHRcdFx0dmFyICRpdGVtID0gJCggcC5lbGVtZW50c1tpXS5lbCApLFxyXG5cdFx0XHRcdFx0XHRcdHN0eWxlQ1NTID0gcGlsZSA9PT0gdGhpcy5waWxlTmFtZSA/IHtcclxuXHRcdFx0XHRcdFx0XHRcdHRyYW5zaXRpb24gOiB0aGlzLnN1cHBvcnQgPyAnbGVmdCAnICsgdGhpcy5vcHRpb25zLnBpbGVBbmltYXRpb24uY2xvc2VTcGVlZCArICdtcyAnICsgdGhpcy5vcHRpb25zLnBpbGVBbmltYXRpb24uY2xvc2VFYXNpbmcgKyAnLCB0b3AgJyArIHRoaXMub3B0aW9ucy5waWxlQW5pbWF0aW9uLmNsb3NlU3BlZWQgKyAnbXMgJyArIHRoaXMub3B0aW9ucy5waWxlQW5pbWF0aW9uLmNsb3NlRWFzaW5nICsgJywgJyArIHRoaXMudHJhbnNmb3JtTmFtZSArICcgJyArIHRoaXMub3B0aW9ucy5waWxlQW5pbWF0aW9uLmNsb3NlU3BlZWQgKyAnbXMgJyArIHRoaXMub3B0aW9ucy5waWxlQW5pbWF0aW9uLmNsb3NlRWFzaW5nIDogJ25vbmUnXHJcblx0XHRcdFx0XHRcdFx0fSA6IHtcclxuXHRcdFx0XHRcdFx0XHRcdHRyYW5zaXRpb24gOiB0aGlzLnN1cHBvcnQgPyAnb3BhY2l0eSAnICsgdGhpcy5vcHRpb25zLm90aGVyUGlsZUFuaW1hdGlvbi5vcGVuU3BlZWQgKyAnbXMgJyArIHRoaXMub3B0aW9ucy5vdGhlclBpbGVBbmltYXRpb24ub3BlbkVhc2luZyA6ICdub25lJ1xyXG5cdFx0XHRcdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdFx0XHQkaXRlbS5jc3MoIHN0eWxlQ1NTICk7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRmcyA9IHAucG9zaXRpb247XHJcblxyXG5cdFx0XHRcdFx0XHRpZiggcGlsZSA9PT0gdGhpcy5waWxlTmFtZSApIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0JC5leHRlbmQoIGZzLCAkaXRlbS5kYXRhKCAnaW5pdGlhbFN0eWxlJyApICk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdC8vIGhhY2s6IHJlbW92ZSBib3gtc2hhZG93IHdoaWxlIGFuaW1hdGluZyB0byBwcmV2ZW50IHRoZSBzaGFkb3cgc3RhY2sgZWZmZWN0XHJcblx0XHRcdFx0XHRcdFx0aWYoIGkgPCBsZW4gLSAzICkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JGl0ZW0uY3NzKCAnYm94LXNoYWRvdycsICdub25lJyApO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdHBpbGUgPT09IHRoaXMucGlsZU5hbWUgPyB0aGlzLl9hcHBseVRyYW5zaXRpb24oICRpdGVtLCBmcywgdGhpcy5vcHRpb25zLnBpbGVBbmltYXRpb24uY2xvc2VTcGVlZCwgZnVuY3Rpb24oIGV2dCApIHtcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0IHx8IHRoaXMubm9kZU5hbWU7XHJcblx0XHRcdFx0XHRcdFx0aWYoIHRhcmdldCAhPT0gJ0xJJyApIHtcclxuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdHZhciAkZWwgPSAkKCB0aGlzICksIGV4dHJhU3R5bGUgPSAkZWwuZGF0YSggJ2V4dHJhU3R5bGUnICk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdC8vIGhhY2s6IHJlbW92ZSBib3gtc2hhZG93IHdoaWxlIGFuaW1hdGluZyB0byBwcmV2ZW50IHRoZSBzaGFkb3cgc3RhY2sgZWZmZWN0XHJcblx0XHRcdFx0XHRcdFx0JGVsLmNzcyggJ2JveC1zaGFkb3cnLCAkZWwuZGF0YSggJ3NoYWRvdycgKSApO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiggc2VsZi5zdXBwb3J0ICkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JGVsLm9mZiggc2VsZi50cmFuc0VuZEV2ZW50TmFtZSApO1xyXG5cdFx0XHRcdFx0XHRcdFx0c2VsZi5fYXBwbHlJbml0aWFsVHJhbnNpdGlvbiggJGVsICk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0JGVsLmNzcyggJGVsLmRhdGEoICdpbml0aWFsU3R5bGUnICkgKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmKCBleHRyYVN0eWxlICkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JGVsLmNzcyggZXh0cmFTdHlsZSApO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0KytjbnQ7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmKCAkZWwuZGF0YSggJ2Zyb250JyApICkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JGVsLmZpbmQoICdkaXYudHAtdGl0bGUnICkuc2hvdygpO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0aWYoIGNudCA9PT0gJGVsLmRhdGEoICdwaWxlQ291bnQnICkgKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRzZWxmLm9wdGlvbnMub25BZnRlckNsb3NlKCAkZWwuZGF0YSggJ3BpbGVOYW1lJyApLCBjbnQgKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHR9ICkgOiB0aGlzLl9hcHBseVRyYW5zaXRpb24oICRpdGVtLCB7IG9wYWNpdHkgOiAxIH0sIHRoaXMub3B0aW9ucy5vdGhlclBpbGVBbmltYXRpb24ub3BlblNwZWVkLCBmdW5jdGlvbiggZXZ0ICkge1xyXG5cclxuXHRcdFx0XHRcdFx0XHR2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQgfHwgdGhpcy5ub2RlTmFtZTtcclxuXHRcdFx0XHRcdFx0XHRpZiggdGFyZ2V0ICE9PSAnTEknICkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyICRlbCA9ICQoIHRoaXMgKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0aWYoICRlbC5pbmRleCgpIDwgbGVuIC0gMSAgKSB7XHJcblx0XHRcdFx0XHRcdFx0XHQkZWwuZmluZCggJ2ltZycgKS5jc3MoICd2aXNpYmlsaXR5JywgJ3Zpc2libGUnICk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiggc2VsZi5zdXBwb3J0ICkge1xyXG5cdFx0XHRcdFx0XHRcdFx0JGVsLm9mZiggc2VsZi50cmFuc0VuZEV2ZW50TmFtZSApO1xyXG5cdFx0XHRcdFx0XHRcdFx0c2VsZi5fYXBwbHlJbml0aWFsVHJhbnNpdGlvbiggJGVsICk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0fSApO1xyXG5cclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyByZXNldCBwaWxlIG5hbWVcclxuXHRcdFx0XHR0aGlzLnBpbGVOYW1lID0gJyc7XHJcblxyXG5cdFx0XHRcdC8vIHVwZGF0ZSB1bCBoZWlnaHRcclxuXHRcdFx0XHR0aGlzLmVsLmNzcyggJ2hlaWdodCcsIGZzLnRvcCArIHRoaXMuaXRlbVNpemUuaGVpZ2h0ICk7XHJcblxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0fSxcclxuXHRcdF9yZXNpemUgOiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdC8vIGdldCB1bCBzaXplIGFnYWluXHJcblx0XHRcdHRoaXMuX2dldFNpemUoKTtcclxuXHRcdFx0Ly8gcmVzZXQgaXRlbXMgcG9zaXRpb25zXHJcblx0XHRcdHRoaXMuX3NldEl0ZW1zUG9zaXRpb24oKTtcclxuXHJcblx0XHR9LFxyXG5cdFx0X2FwcGx5VHJhbnNpdGlvbiA6IGZ1bmN0aW9uKCBlbCwgc3R5bGVDU1MsIHNwZWVkLCBmbmNvbXBsZXRlICkge1xyXG5cclxuXHRcdFx0JC5mbi5hcHBseVN0eWxlID0gdGhpcy5zdXBwb3J0ID8gJC5mbi5jc3MgOiAkLmZuLmFuaW1hdGU7XHJcblxyXG5cdFx0XHRpZiggZm5jb21wbGV0ZSAmJiB0aGlzLnN1cHBvcnQgKSB7XHJcblxyXG5cdFx0XHRcdGVsLm9uKCB0aGlzLnRyYW5zRW5kRXZlbnROYW1lLCBmbmNvbXBsZXRlICk7XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmbmNvbXBsZXRlID0gZm5jb21wbGV0ZSB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9O1xyXG5cclxuXHRcdFx0ZWwuc3RvcCgpLmFwcGx5U3R5bGUoIHN0eWxlQ1NTLCAkLmV4dGVuZCggdHJ1ZSwgW10sIHsgZHVyYXRpb24gOiBzcGVlZCArICdtcycsIGNvbXBsZXRlIDogZm5jb21wbGV0ZSB9ICkgKTtcclxuXHJcblx0XHR9LFxyXG5cdFx0Y2xvc2VQaWxlIDogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHR0aGlzLl9jbG9zZVBpbGUoKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdH07XHJcblx0XHJcblx0dmFyIGxvZ0Vycm9yID0gZnVuY3Rpb24oIG1lc3NhZ2UgKSB7XHJcblxyXG5cdFx0aWYgKCB3aW5kb3cuY29uc29sZSApIHtcclxuXHJcblx0XHRcdHdpbmRvdy5jb25zb2xlLmVycm9yKCBtZXNzYWdlICk7XHJcblx0XHRcclxuXHRcdH1cclxuXHJcblx0fTtcclxuXHRcclxuXHQkLmZuLnN0YXBlbCA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xyXG5cclxuXHRcdHZhciBpbnN0YW5jZSA9ICQuZGF0YSggdGhpcywgJ3N0YXBlbCcgKTtcclxuXHRcdFxyXG5cdFx0aWYgKCB0eXBlb2Ygb3B0aW9ucyA9PT0gJ3N0cmluZycgKSB7XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKTtcclxuXHRcdFx0XHJcblx0XHRcdHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHJcblx0XHRcdFx0aWYgKCAhaW5zdGFuY2UgKSB7XHJcblxyXG5cdFx0XHRcdFx0bG9nRXJyb3IoIFwiY2Fubm90IGNhbGwgbWV0aG9kcyBvbiBzdGFwZWwgcHJpb3IgdG8gaW5pdGlhbGl6YXRpb247IFwiICtcclxuXHRcdFx0XHRcdFwiYXR0ZW1wdGVkIHRvIGNhbGwgbWV0aG9kICdcIiArIG9wdGlvbnMgKyBcIidcIiApO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoICEkLmlzRnVuY3Rpb24oIGluc3RhbmNlW29wdGlvbnNdICkgfHwgb3B0aW9ucy5jaGFyQXQoMCkgPT09IFwiX1wiICkge1xyXG5cclxuXHRcdFx0XHRcdGxvZ0Vycm9yKCBcIm5vIHN1Y2ggbWV0aG9kICdcIiArIG9wdGlvbnMgKyBcIicgZm9yIHN0YXBlbCBpbnN0YW5jZVwiICk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGluc3RhbmNlWyBvcHRpb25zIF0uYXBwbHkoIGluc3RhbmNlLCBhcmdzICk7XHJcblx0XHRcdFxyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0fSBcclxuXHRcdGVsc2Uge1xyXG5cdFx0XHJcblx0XHRcdHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoIGluc3RhbmNlICkge1xyXG5cclxuXHRcdFx0XHRcdGluc3RhbmNlLl9pbml0KCk7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cclxuXHRcdFx0XHRcdGluc3RhbmNlID0gJC5kYXRhKCB0aGlzLCAnc3RhcGVsJywgbmV3ICQuU3RhcGVsKCBvcHRpb25zLCB0aGlzICkgKTtcclxuXHRcdFx0XHRcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRyZXR1cm4gaW5zdGFuY2U7XHJcblx0XHRcclxuXHR9O1xyXG5cdFxyXG59ICkoIGpRdWVyeSwgd2luZG93ICk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
