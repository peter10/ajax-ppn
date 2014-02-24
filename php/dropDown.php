<?php

header( 'Content-type: text/javascript' );

require_once( 'ppn.php' );

$ppn = new ppn();

$providerTypesJs = json_encode( $ppn->providerTypes );

echo $providerTypesJs;