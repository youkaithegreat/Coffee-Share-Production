const { v4: uuidv4 } = require( 'uuid' );
const { validationResult } = require( 'express-validator' )
const HttpError = require( '../models/http-error' );
const getCoordsForAddress = require( '../util/location' )

const Place = require( '../models/place' )

let DUMMY_PLACES = [
    {
        id: 'p1',
        title: 'Empire State Building',
        description: 'One of the most famous sky scrapers in the world!',
        location: {
            lat: 40.7484474,
            lng: -73.9871516
        },
        address: '20 W 34th St, New York, NY 10001',
        creator: 'u1'
    }
];

const getPlaceById = async ( req, res, next ) => {
    const placeId = req.params.pid; // { pid: 'p1' }


    let place;
    try {

        place = await Place.findById( placeId )
    } catch ( err ) {
        const error = new HttpError( "Something went wrong with getPlaceById", 500 )

        return next( error )
    }

    if ( !place ) {
        const error = new HttpError( 'Could not find a place for the provided id.', 404 );
        return next( error )
    }

    res.json( { place: place.toObject( { getters: true } ) } ); // => { place } => { place: place }
};

// function getPlaceById() { ... }
// const getPlaceById = function() { ... }

const getPlacesByUserId = async ( req, res, next ) => {
    const userId = req.params.uid;

    let places;

    try {
        places = await Place.find( { creator: userId } )
    } catch ( err ) {
        const error = new HttpError( "Something went wrong in getPlacesByUserId", 500 )

        return next( error )
    }


    if ( !places || places.length === 0 ) {
        return next(
            new HttpError( 'Could not find a place for the provided user id.', 404 )
        );
    }

    res.json( { places: places.map( place => place.toObject( { getters: true } ) ) } );
};

const createPlace = async ( req, res, next ) => {
    const errors = validationResult( req );
    if ( !errors.isEmpty() ) {
        console.log( errors );
        return next( new HttpError( "INvalid inputs, ", 422 ) )
    }

    const { title, description, address, creator } = req.body;


    let coordinates;

    try {

        coordinates = await getCoordsForAddress( address )
    } catch ( error ) {
        return next( error )
    }
    // const title = req.body.title;
    const createdPlace = new Place( {
        title,
        description,
        address,
        location: coordinates,
        image: 'https://scontent-hou1-1.xx.fbcdn.net/v/t1.6435-9/48420122_10217592345750783_2060351848329510912_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=19026a&_nc_ohc=KOGZ1AFdOJwAX9lfM6L&_nc_ht=scontent-hou1-1.xx&oh=00_AT9AGE0LiKVvaEr3dbuGWDgD8UFBUAnsya_C8l38aWkJeA&oe=631AB3A1',
        creator
    } );

    try {

        await createdPlace.save();

    } catch ( err ) {
        const error = new HttpError(
            'Creating place failed, please try again.', 500
        )
        return next( error )
    }

    res.status( 201 ).json( { place: createdPlace } );
};

const updatePlace = async ( req, res, next ) => {

    const errors = validationResult( req );
    if ( !errors.isEmpty() ) {
        console.log( errors );
        throw new HttpError( "INvalid inputs, ", 422 )
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById( placeId );
    } catch ( err ) {
        const error = new HttpError( "something went wrong in updatePlace", 500 )
        return next( error )
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch ( err ) {
        const error = new HttpError( "Second part of updatePlace broke", 500 )
        return next( error )
    }


    res.status( 200 ).json( { place: place.toObject( { getters: true } ) } );
}

const deletePlace = ( req, res, next ) => {

    const placeId = req.params.pid;
    if ( DUMMY_PLACES.find( p => p.id == placeId ) ) {
        throw new HttpError( 'COuld not find a place for that id.', 404 )
    }
    DUMMY_PLACES = DUMMY_PLACES.filter( p => p.id !== placeId );
    res.status( 200 ).json( { message: "Deleted place." } )
}

exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;