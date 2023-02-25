"use strict"

//Routes for pins

const jsonschema = require("jsonschema")

const express = require("express");
const Pin = require("../models/pin");
const pinNewSchema = require("../schemas/pinNew.json");
const pinUpdateSchema = require("../schemas/pinUpdate.json")
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureCorrectUserOrAdmin } = require("../middleware/auth");


const router = express.Router()

//POST / 
//creates a pin 

//{ pin: { username, title, review, rating, long, lat, date } }

router.post('/', async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, pinNewSchema)
        if (!validator.valid) {
            const errs = validator.errors.map(e=>e.stack)
            throw new BadRequestError(errs)
        }
        const savedPin = await Pin.create(req.body)
        console.log(savedPin)
        return res.status(201).json({ savedPin })
    } catch (err) {
        return next(err);
    }
});

//GET / => { pins: [ { username, title, review, rating, long, lat, date }, ...]}

//Returns all pins

router.get('/', async function (req, res, next) {
    try {
        const pins = await Pin.findAll();
        return res.json({ pins })
    } catch (err) {
        return next(err)
    }
})

//PATCH /[pinId] { pin } => { pin }
//Returns { pin: { id, title, review, rating, date, username} }
//Authorization required: user of pin maker

router.patch('/:id', ensureLoggedIn, async function (req,res,next) {
    try {
        const validator = jsonschema.validate(req.body, pinUpdateSchema)
        if(!validator.valid) {
            const errs = validator.errors.map((e)=> e.stack)
            throw new BadRequestError(errs)
        }
        const pin = await Pin.update(req.params.id, req.body)
        return res.json({pin})
    } catch (err) {
        return next(err)
    }
})


//DELETE /[pinId] => { deleted: id}
//Authorization required: user of pin maker

router.delete('/:id', ensureLoggedIn, async function (req, res, next) {
    try {
        await Pin.remove(req.params.id)
        return res.json({ deleted: +req.params.id })
    } catch (err) {
        return next(err)
    }
})


module.exports = router;