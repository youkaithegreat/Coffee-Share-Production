const express = require( "express" )
const bodyParse = require( "body-parser" )
const mongoose = require( 'mongoose' )

const placesRoutes = require( './routes/places-routes' );
const userRoutes = require( './routes/user-routes' )
const HttpError = require( './models/http-error' )
const bodyParser = require( "body-parser" );

const app = express();

app.use( bodyParser.json() )

app.use( ( req, res, next ) => {
    res.setHeader( 'Access-Control-Allow-Origin', '*' );
    res.setHeader( 'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization' )
    res.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE' )

    next();
} )

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

mongoose.connect( "mongodb+srv://user123:udemy123@youkaicreations.nnxkdyz.mongodb.net/places?retryWrites=true&w=majority" )
    .then( () => {

        app.listen( 3001, () => {
            console.log( "listening" )
        } );
    } ).catch( err => {
        console.log( err )
    } )
