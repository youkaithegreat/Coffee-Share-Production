const express = require( "express" )
const bodyParse = require( "body-parser" )

const placesRoutes = require( './routes/places-routes' );
const userRoutes = require( './routes/user-routes' )
const HttpError = require( './models/http-error' )
const bodyParser = require( "body-parser" );

const app = express();

app.use( bodyParser.json() )

app.use( "/api/places", placesRoutes )
app.use( '/api/users', userRoutes )

app.use( ( req, res, next ) => {
    const error = new HttpError( "Could nto find this route.", 404 )
    throw error;
} )


app.use( ( error, req, res, next ) => {
    if ( res.headerSent ) {
        return next( error )
    }
    res.status( error.code || 500 ).json( { message: error.message || 'An unkown error occured!' } )
} )

app.listen( 3000, () => {
    console.log( "listening" )
} ); 