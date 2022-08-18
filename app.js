const fs = require( 'fs' )
const path = require( 'path' )

const express = require( "express" )
const bodyParse = require( "body-parser" )
const mongoose = require( 'mongoose' )
const cors = require( 'cors' )
const placesRoutes = require( './routes/places-routes' );
const userRoutes = require( './routes/user-routes' )
const HttpError = require( './models/http-error' )
const bodyParser = require( "body-parser" );

const app = express();

app.use( bodyParser.json() )


app.use( '/uploads/images/', express.static( path.join( 'uploads', 'images' ) ) )
app.use( express.static( path.join( 'public' ) ) )

// app.use( ( req, res, next ) => {

//     res.setHeader( 'Access-Control-Allow-Origin', '*' );
//     res.setHeader( 'Access-Control-Allow-Headers',
//         'Origin, X-Requested-With, Content-Type, Accept, Authorization' )
//     res.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE' )

//     next();
// } )


app.use( "/api/places", placesRoutes )
app.use( '/api/users', userRoutes )

app.use( ( req, res, next ) => {
    res.sendFile( path.resolve( __dirname, 'public', 'index.html' ) );
} )

app.use( ( req, res, next ) => {
    const error = new HttpError( "Could nto find this route.", 404 )
    throw error;
} )


app.use( ( error, req, res, next ) => {
    if ( req.file ) {
        fs.unlink( req.file.path, ( err ) => {
            console.log( err );
        } )
    }
    if ( res.headerSent ) {
        return next( error )
    }
    res.status( error.code || 500 ).json( { message: error.message || 'An unkown error occured!' } )
} )

const db_username = process.env.DB_USER
const db_password = process.env.DB_PASSWORD
const db_name = process.env.DB_NAME

mongoose.connect( `mongodb+srv://${db_username}:${db_password}@youkaicreations.nnxkdyz.mongodb.net/${db_name}?retryWrites=true&w=majority` )
    .then( () => {
        app.listen( process.env.PORT, () => {
            console.log( "listening" )
            console.log( process.env.DB_USER )
        } );
    } ).catch( err => {
        console.log( err )

    } )
