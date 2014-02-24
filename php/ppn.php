<?php

class ppn {

	private $searchParams = array(
		'providerType' => 'all',
		'searchRadius' => 10,
		'lat' => null,
		'lng' => null,
		'latRadius' => 0,
		'lngRadius' => 0,
	);

	public $providerTypes = array (
		0 => 'air ambulance',
		1 => 'clinic',
		2 => 'ground ambulance',
		3 => 'hospital',
		4 => 'lab',
	);
	
	public function processSearchParams() {
		
		// provider type, whitelist
		if ( isset( $_REQUEST['providerType'] ) ) {
			$providerType = strtolower( $_REQUEST['providerType'] );
			if ( ! in_array( $providerType, $this->providerTypes ) ) {
				$this->searchParams['providerType'] = 'all';
			} else {
				$this->searchParams['providerType'] = $providerType;
			}
		}
		
		// search radius, cast float
		if ( isset( $_REQUEST['searchRadius'] ) ) {
			$this->searchParams['searchRadius'] = (float) $_REQUEST['searchRadius'];
			if ( 100 < $this->searchParams['searchRadius'] ) {
				$this->searchParams['searchRadius'] = 100;
			}
		}
		
		// latitude, cast float
		if ( isset( $_REQUEST['lat'] ) ) {
			$this->searchParams['lat'] = (float) $_REQUEST['lat'];
		}
		$lat = $this->searchParams['lat'];
		
		// longitude, cast float
		if ( isset( $_REQUEST['lng'] ) ) {
			$this->searchParams['lng'] = (float) $_REQUEST['lng'];
		}
		
		// latRadius
		//$latRadius = ( $dist * 180 ) / ( 6378.1 * pi() );
		$latRadius = $this->searchParams['searchRadius'] * 0.0089823;
		$this->searchParams['latRadius'] = $latRadius;
		
		// lngRadius
		$lngRadius = $latRadius / ( cos( deg2rad( $this->searchParams['lat'] ) ) );
		$this->searchParams['lngRadius'] = $lngRadius;
		
	}
	
	public function getProviders( $region = null ) {
	
		$db = mysql_connect( 'localhost', 'super107_provide', 'xxxx' );
		if ( ! $db ) {
			error_log( mysql_last_error(), 1, 'pduke@ingleinternational.com' );
			exit();
		}

		if ( ! mysql_select_db( 'super107_providers', $db ) ) {
			error_log( mysql_error( $db ), 1, 'pduke@ingleinternational.com' );
			exit();
		}
		
		$providerType = $this->searchParams['providerType'];
		
		$searchRadius = $this->searchParams['searchRadius'];
		
		$lat = $this->searchParams['lat'];
		
		$lng = $this->searchParams['lng'];
		
		$latRadius = $this->searchParams['latRadius'];
		
		$lngRadius = $this->searchParams['lngRadius'];
		
		
		// determine table to search
		if ( strcmp( 'latin-america', $region ) == 0 ) {
			$tableName = 'providers_latinamerica';
		} else {
			$tableName = 'providers_canada';
		}
		
		if ( strcmp( $this->searchParams['providerType'], 'all' ) == 0 ) { // all types of providers
			$q = 'SELECT * FROM %s WHERE lat > %f AND lat < %f AND lng > %f AND lng < %f';
			$q = sprintf( $q,
				$tableName,
				$lat - $latRadius,
				$lat + $latRadius,
				$lng - $lngRadius,
				$lng + $lngRadius
			);
		} else { // specific type of provider
			$q = "SELECT * FROM %s WHERE type = '%s' AND lat > %f AND lat < %f AND lng > %f AND lng < %f";
			$q = sprintf( $q,
				$tableName,
				$providerType,
				$lat - $latRadius,
				$lat + $latRadius,
				$lng - $lngRadius,
				$lng + $lngRadius
			);
		}
		
		mysql_query('SET CHARACTER SET utf8');
		
		$results = mysql_query( $q, $db );
		
		$output = array();
		
		while ( $row = mysql_fetch_assoc( $results ) ) {
			$content = '<h4>' . $row['facility'] . '</h4>';
			$content .= $row['street'] . '<br />';
			
			if ( strcmp( $row['city'], '' ) != 0 ) {
				$content .= $row['city'] . ', ';
			}
			
			$content .= $row['country'];
			
			if ( strcmp( $row['postal'], '' ) != 0 ) {
				$content .= ', ' . $row['postal'];
			} 
			$content .= '<br />';
			
			if ( strcmp( $row['telephone'], '' ) != 0 ) {
				$content .= '<b>Tel: </b>' . $row['telephone'] . '<br />';
			}
			
			$output[] = array(
				'content' => $content,
				'type' => $row['type'],
				'lat' =>$row['lat'],
				'lng' =>$row['lng'],
			);
		}
		
		return $output;
	}
	
}
