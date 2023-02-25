"use strict"

//Routes for authenication

const jsonschema = require("jsonschema")

const User = require("../models/user")
const express = require("express")
const router = new express.Router()
const { createToken } = require("../helpers/tokens")
const userAuthSchema = require("../schemas/userAuth.json")
const userRegisterSchema = require("../schemas/userRegister.json")
const { BadRequestError } = require("../expressError")

//POST /auth/token: { username, password } => { token }
//Returns JWT token 
//Auth required: none

router.post("/token", async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userAuthSchema)
        console.log('VALID', validator)
        if (!validator.valid) {
            const errs = validator.errors.map(e=>e.stack)
            console.log('ERRS', errs)
            throw new BadRequestError(errs)
        }
        
        const user = await User.authenticate(req.body)
        const token = createToken(user)
        return res.json({ token })
    } catch (err) {
        return next(err)
    }
})

//POST /auth/register: { user } => { token }
//user must include { username, password, firstName, lastName, email}
//returns JWT token
//Auth required: none

router.post("/register", async function(req,res,next) {
    try {
        const validator = jsonschema.validate(req.body, userRegisterSchema)
        console.log('REGISTER VALID', validator)
        console.log('REG VALID', validator.valid)
        if(!validator.valid) {
            const errs = validator.errors.map(e=>e.stack)
            console.log('ERRS', errs)
            throw new BadRequestError(errs)
        }

        const newUser = await User.register({ ...req.body, isAdmin: false})
        console.log('NEWUSER', newUser)
        const token = createToken(newUser)
        return res.status(201).json({ token })
    } catch (err) {
        return next(err)
    }
})

module.exports = router 