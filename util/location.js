const axios = require( 'axios' )

const API_KEY = 'AIzaSyAgujiMNNeLmfdycyZGaoqqSjOVa8cPIZM';

async function getCoordsForAddress( address ) {


    axios.get( `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent( address )}&key=${API_KEY}` )
}