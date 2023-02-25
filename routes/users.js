"use strict"

//Routes for users

const jsonschema = require("jsonschema")

const express = require("express");
const { ensureCorrectUserOrAdmin, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router()

//POST / { user } => { user, token }
//Only for admin users to add new users - new user can be an admin

//Returns newly created user and auth token
//{ user: { username, firstName, lastName, email, isAdmin }, token }
//Auth required: admin

router.post('/', ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema)
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const newUser = await User.register(req.body);
        const token = createToken(newUser);
        return res.status(201).json({ newUser, token });
    } catch (err) {
        return next(err);
    }
});

//GET / => { users: [ {username, firstName, lastName, email}, ...]}

//Returns list of all users
//Auth required: admin

router.get('/', ensureAdmin, async function (req, res, next) {
    try {
        const users = await User.findAll()
        return res.json({ users })
    } catch (err) {
        return next(err)
    }
})

//GET /[username] => { user }

//Returns { username, firstName, lastName, isAdmin }
//Auth required: admin or same user(username)

router.get('/:username', ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const user = await User.get(req.params.username)
        return res.json({ user })
    } catch (err) {
        return next(err)
    }
})

//PATCH /[username] { user } => { user }
//Updates user data for { firstName, lastName, email }

//Returns { username, firstName, lastName, email, isAdmin}
//Auth required: admin or same user (username)

router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        console.log('ROUTES USER', req.body)
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        
        const user = await User.update(req.params.username, req.body);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

//DELETE /[username] => { deleted: username }
//Auth required" admin or same user (username)

router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        await User.remove(req.params.username);
        return res.json({ deleted: req.params.username });
      } catch (err) {
        return next(err);
      }   
})

//POST /[username]/favorite/[id] 
//Returns {"favorited": pinId}
//Authorization required: admin or current user

router.post("/:username/favorite/:id", ensureCorrectUserOrAdmin, async function(req, res, next) {
    try {
        const pinId = +req.params.id
        await User.favPin(req.params.username, pinId)
        return res.json({ favorited: pinId})
    } catch (err) {
        return next(err)
    }
})

//DELETE /[username]/favorite/[id]
//Returns {"removed": pinId}
//Authorization required: admin or current user

router.delete("/:username/favorite/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
    try {
        const pinId = +req.params.id
        await User.deleteFav(req.params.username, pinId)
        return res.json({ removed: pinId })
    } catch (err) {
        return next(err)
    }
})

//GET /[username]/favorite
//Returns { favorites: [{ id, title, review, rating, username}, ... ]}
//Authorization required: admin or current user

router.get("/:username/favorite", ensureCorrectUserOrAdmin, async function(req,res,next) {
    try {
        const favs = await User.userFavList(req.params.username)
        return res.json({favorites: favs})
    } catch (err) {
        return next(err)
    }
})

module.exports = router;

