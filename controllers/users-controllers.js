const { get } = require( "../routes/places-routes" )
const bcrypt = require( 'bcryptjs' )
const jwt = require( 'jsonwebtoken' )
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

    let hashedPassword;

    try {
        hashedPasword = await bcrypt.hash( password, 12 )
    }
    catch ( err ) {
        const error = new HttpError( "Could not create user, please try again, hash failed", 500 )
        return next( error )
    }

    const createdUser = new User( {
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
        places: []
    } )


    try {
        await createdUser.save();
    } catch ( err ) {
        const error = new HttpError( "create user save broke", 500 )
        return next( error )
    }

    let token;
    try {
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            'supersecret_dont_share',
            { expiresIn: '1h' }
        )
    } catch ( err ) {
        const error = new HttpError( "create user save broke", 500 )
        return next( error )
    }


    res.status( 201 ).json( { userId: createdUser.id, email: createdUser.email, token: token } )
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

    if ( !existingUser ) {
        const error = new HttpError( "Invalid credentials, could not log you in", 401 )
        return next( error )
    }

    let isValidPassword = false;
    try {

        isValidPassword = await bcrypt.compare( password, existingUser.password )
    } catch ( err ) {
        const error = new HttpError( "Could not log you in, please check your credentials and try again.", 500 )
        return next( error )
    }

    if ( !isValidPassword ) {
        const error = new HttpError( "Invalid credentials, could not log you in", 401 )
        return next( error )
    }

    let token;
    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            'supersecret_dont_share',
            { expiresIn: '1h' }
        )
    } catch ( err ) {
        const error = new HttpError( "create user save broke", 500 )
        return next( error )
    }

    res.status( 201 ).json( { message: "loggedin", userId: createdUser.id, email: createdUser.email, token: token } )
}

exports.getUsers = getUsers;
exports.login = login;
exports.signup = signup;
