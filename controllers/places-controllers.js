const fs = require( "fs" )
const { v4: uuidv4 } = require( 'uuid' );
const { validationResult } = require( 'express-validator' )
const HttpError = require( '../models/http-error' );
const getCoordsForAddress = require( '../util/location' )
const User = require( '../models/user' )

const Place = require( '../models/place' );
const { default: mongoose } = require( 'mongoose' );

const getPlaceById = async ( req, res, next ) => {
    const placeId = req.params.pid;

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

    res.json( { place: place.toObject( { getters: true } ) } );
};


//code diverges based off his feelings
// const getPlacesByUserId = async ( req, res, next ) => {
//     const userId = req.params.uid;

//     let userWithPlaces;

//     try {
//         userWithPlaces = await Place.findById(userId).populate('places');
//     } catch ( err ) {
//         const error = new HttpError( "Something went wrong in getPlacesByUserId", 500 )

//         return next( error )
//     }


//     if ( !userWithPlaces || userWithPlaces.length === 0 ) {
//         return next(
//             new HttpError( 'Could not find a place for the provided user id.', 404 )
//         );
//     }

//     res.json( { places: userWithPlaces.map( place => place.toObject( { getters: true } ) ) } );
// };

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
        image: req.file.path,
        creator
    } );

    let user;

    try {
        user = await User.findById( creator )
    } catch ( err ) {
        const error = new HttpError( "Creating place failed", 500 )
        return next( error )
    }

    if ( !user ) {
        const error = new HttpError( "Could not find user for provided ID", 404 )
        return next( error )
    }

    console.log( user );

    try {
        const sess = await mongoose.startSession()
        sess.startTransaction();
        await createdPlace.save( { session: sess } )
        user.places.push( createdPlace )
        await user.save( { session: sess } )
        await sess.commitTransaction();

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
        return next( new HttpError( "INvalid inputs, ", 422 ) )
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

    if ( place.creator.toString() !== req.userData.userId ) {
        const error = new HttpError( "You are not allowed to edit this place", 401 )
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

const deletePlace = async ( req, res, next ) => {

    const placeId = req.params.pid;

    let place;

    try {
        place = await Place.findById( placeId ).populate( 'creator' );
    } catch ( err ) {
        const error = new HttpError( "deletePlace broke", 500 )
        return next( error )
    }

    if ( !place ) {
        const error = new HttpError( 'Could not find place for this id', 404 )
        return next( error )
    }

    if ( place.creator.id !== req.userData.userId ) {

        const error = new HttpError( "You are not allowed to delete this place", 401 )
        return next( error )
    }

    const imagePath = place.image;

    try {
        const sess = await mongoose.startSession()
        sess.startTransaction();
        await place.remove( { session: sess } );
        place.creator.places.pull( place );
        await place.creator.save( { session: sess } )
        await sess.commitTransaction();
    } catch ( err ) {
        const error = new HttpError( "Removal part two broke", 500 )
        return next( error )
    }

    fs.unlink( imagePath, err => {
        console.log( err )
    } )

    res.status( 200 ).json( { message: "Deleted place." } )
}

exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;