
// object for namespacing
var ppn = {};

// markers on map
ppn.markers = [];

// represents the same info in an array of JSON
ppn.list = [];

// search parameters
ppn.searchParams = {};

// GET parameters
ppn.$_GET = {};


// get the list of types of providers via AJAX request, pass off to callback to write into document
ppn.getDropdown = function() {
	$.getJSON( '/ppn/php/dropDown.php', ppn.getDropdownCallback );
}

// AJAX callback function, writes provider search types into select dropdown
ppn.getDropdownCallback = function( data, textStatus, jqXHR ) {
	var options = '<option value="all">All</option>';
	for ( var i = 0; i < data.length; i++ ) {
		options += '<option value="' + data[i] + '">' + data[i].ucwords() + '</option>';
	}
	$( 'select#provider_type' ).html( options );
	
}

ppn.getProviders = function() {
	ppn.parseSearchParametersFromForm();
	$.getJSON( '/ppn/php/providers_latin-america.php', ppn.searchParams, ppn.getProvidersCallback );
}

ppn.getProvidersCallback = function( data, textStatus, jqXHR ) {
	if ( 'success' != textStatus.toLowerCase() ) {
		// handle error?
	} else {
		ppn.list = data;
		ppn.processList();
	}
}

// processes ppn.list to populate the UL and Google Map
ppn.processList = function() {	
	// clear the old markers
	for ( var i = 0; i < ppn.markers.length; i++ ) {
		ppn.markers[i].setMap( null );
	}
	ppn.markers.length = 0;
	
	// populate the UL and markers
	html = '';
	for ( var i = 0; i < ppn.list.length; i++ ) {
		// UL
		html += '<li style="border-bottom: 1px solid #ddd;">' + ppn.list[i].content + '</li>';
		
		// markers
		ppn.markers.push(
			new google.maps.Marker( {
				position: new google.maps.LatLng( ppn.list[i].lat, ppn.list[i].lng ),
				map: ppn.map
			} )
		);
	}
	// UL
	$( 'ul#physician_list' ).html( html );
	
	// display the search criteria
	$('#type_of_facility_display').html( ppn.searchParams.providerType );
	$('#distance_display').html( ppn.searchParams.searchRadius + ' km.' );
	$('#search_results_header').html( 'Search Results (' + ppn.list.length + ')');
	
	// event handling
	for ( var i=0; i < ppn.markers.length; i++ ) {
		ppn.markers[i].ppnIndex = i;
		google.maps.event.addListener( ppn.markers[i], 'click', function(){
			$('ul#physician_list').scrollTo( $('ul#physician_list li').eq( this.ppnIndex ) );
			ppn.highlightLists( this.ppnIndex );
		} );
	}
	// ie6 hover
	if ( $.browser.msie && $.browser.version < 7 ) {
		$('ul#physician_list li').hover( function(){
			$(this).addClass('hover');
		}, function(){
			$(this).removeClass('hover');
		} );
	}
}

// collects the search parameter information from the form elements and populates ppn.searchParams
ppn.parseSearchParametersFromForm = function() {
	ppn.searchParams = {
		'providerType' : $('select#provider_type').val(),
		'searchRadius' : $('select#search_radius').val(),
		'lat' : ppn.map.getCenter().lat(),
		'lng' : ppn.map.getCenter().lng()
	};
}

// event handler for UL
ppn.listItemClick = function(e){
	// figure out the index, then call highlight_lists
	var itemIndex = $(e.target).prevAll().length;
	
	ppn.highlightLists(itemIndex);
}

// run this when something has been clicked to highlight the selection
ppn.highlightLists = function ( item_index ) {
	// HTML list
	$('ul#physician_list li').each( function() { $(this).removeClass('active') });
	$('ul#physician_list li').eq(item_index).addClass('active');
	$('ul#physician_list').scrollTo( $('ul#physician_list li').eq(item_index) );
	
	// Google maps marker
	markers = ppn.markers;
	// reset all icons
	for ( var i =0; i < markers.length; i++ ) {
	//for ( var i =0; i < 4; i++ ) {
		markers[i].setIcon();
		markers[i].setZIndex(0);
	}
	// set active icon
	markers[item_index].setIcon('images/gmap_blue_icon.png');
	markers[item_index].setZIndex(10);
	ppn.map.panTo( markers[item_index].getPosition() ); 
}

// initializes some stuff
ppn.init = function() {
	
	// get the $_GET variables so we can geolocate http://stackoverflow.com/questions/439463/how-to-get-get-and-post-variables-with-jquery
	document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
		function decode(s) {
			return decodeURIComponent(s.split("+").join(" "));
		}
		ppn.$_GET[decode(arguments[1])] = decode(arguments[2]);
	});

	if ( typeof( ppn.$_GET['dist'] ) != 'undefined' ) {
		$('select#search_radius').val( ppn.$_GET['dist'] );
	}
	
	// populate dropdown
	ppn.getDropdown();
	
	ppn.geocodeClient();
	
	// UL event handling
	$('ul#physician_list').click( ppn.listItemClick );
	
	// submit event handling
	$('input[type="submit"]').click( ppn.getProviders );
	
}
$( ppn.init );

ppn.geocodeClient = function() {

	if ( typeof( ppn.$_GET['city'] ) != 'undefined' || typeof( ppn.$_GET['postalcode'] ) != 'undefined' ) {
		new google.maps.Geocoder().geocode(
			{ 'address': ppn.$_GET['city'] + ' ' + ppn.$_GET['postalcode'] },
			function(result, status){
				if ( 'ZERO_RESULTS' == status ) {
					ppn.clientLocation = new google.maps.LatLng(-34.5938, -58.402); // Buenos Aires
				}
				else {
				//console.log( result );
					ppn.clientLocation = result[0].geometry.location;
				}
				ppn.initializeMap();
			}
		);
	} else {
		ppn.clientLocation = new google.maps.LatLng(-34.5938, -58.402); // Buenos Aires
		ppn.initializeMap();
	}
}

//can call this after ppn.geocodeClient sets ppn.clientLocation
ppn.initializeMap = function() {
	
	ppn.map = new google.maps.Map(
			document.getElementById("map_canvas"),
			{
				zoom: 12,
				center: ppn.clientLocation,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			}
		);
	
	// now do the first search
	ppn.getProviders();
}

// some helper/library functions

String.prototype.ucwords = function() {
	return this.replace(/\b[a-z]/g, function(letter) {
		return letter.toUpperCase();
	});
}

// help out IE: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/IndexOf
if (!Array.prototype.indexOf) {  
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {  
        "use strict";  
        if (this === void 0 || this === null) {  
            throw new TypeError();  
        }  
        var t = Object(this);  
        var len = t.length >>> 0;  
        if (len === 0) {  
            return -1;  
        }  
        var n = 0;  
        if (arguments.length > 0) {  
            n = Number(arguments[1]);  
            if (n !== n) { // shortcut for verifying if it's NaN  
                n = 0;  
            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {  
                n = (n > 0 || -1) * Math.floor(Math.abs(n));  
            }  
        }  
        if (n >= len) {  
            return -1;  
        }  
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
        for (; k < len; k++) {  
            if (k in t && t[k] === searchElement) {  
                return k;  
            }  
        }  
        return -1;  
    }  
}