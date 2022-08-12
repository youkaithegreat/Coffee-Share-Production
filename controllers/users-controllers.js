const { get } = require( "../routes/places-routes" )
const { v4: uuidv4 } = require( 'uuid' );
const HttpError = require( '../models/http-error' )
const { validationResult } = require( 'express-validator' )
const User = require( '../models/user' )

const getUsers = async ( req, res, next ) => {

    let users;

    try {
        users = await User.find( {}, '-password' );
    } catch ( err ) {
        const error = new HttpError( "Fail getting users", 500 )
    }
    res.json( { users: users.map( user => user.toObject( { getters: true } ) ) } )
}

const signup = async ( req, res, next ) => {
    const errors = validationResult( req );
    if ( !errors.isEmpty() ) {
        console.log( errors );
        return next( new HttpError( "INvalid inputs, ", 422 ) )
    }

    const { name, email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne( { email: email } )
    } catch ( err ) {
        const error = new HttpError( "signup failed findONe", 500 )
        return next( error )
    }

    if ( existingUser ) {
        const error = new HttpError( "ALready has a user", 500 )
        return next( error )
    }

    const createdUser = new User( {
        name,
        email,
        image: "rarwar",
        password,
        places: []
    } )


    try {
        await createdUser.save();
    } catch ( err ) {
        const error = new HttpError( "create user save broke", 500 )
        return next( error )
    }

    res.status( 201 ).json( { user: createdUser.toObject( { getters: true } ) } )
}

const login = async ( req, res, next ) => {
    const { email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne( { email: email } )
    } catch ( err ) {
        const error = new HttpError( "logging in failed findONe", 500 )
        return next( error )
    }

    if ( !existingUser || existingUser.password !== password ) {
        const error = new HttpError( "Invalid credentials, could not log you in", 401 )
        return next( error )
    }

    res.json( { message: "Logged in!", user: existingUser.toObject( { getters: true } ) } )
}

exports.getUsers = getUsers;
exports.login = login;
exports.signup = signup;
