<?php

header( 'Content-type: text/javascript' );

require_once( 'ppn.php' );

$ppn = new ppn();

$ppn->processSearchParams();

$providersJs = json_encode( $ppn->getProviders(  ) );

echo $providersJs;