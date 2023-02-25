"use strict"

const db = require('../db');
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

//Related models for users

class User {
    //auth user with username and password

    //Returns { username, first_name, last_name, email, is_admin}
    //Throws UnauthorizedError if user is not found or incorrect password

    static async authenticate(data) {
        //try to find user first
        const res = await db.query(
            `SELECT username,
                    password,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email,
                    is_admin AS "isAdmin"
            FROM users 
            WHERE username = $1`,
            [data.username]
        )
        const user = res.rows[0]

        if (user) {
            //compare hashed password to a new hash from password
            const enteredPW = data.password
            const isValid = await bcrypt.compare(enteredPW, user.password)
            console.log('VALID?', isValid)
            if (isValid === true) {
                return user;
            }
        }

        throw new UnauthorizedError("Invalid username/password")
    }

    //Register user with data

    //Returns { username, firstName, lastName, email, isAdmin }
    //Throws BadRequestError on duplicates

    static async register(
        { username, password, firstName, lastName, email, isAdmin }) {
        const duplicateCheck = await db.query(
            `SELECT username
             FROM users
             WHERE username = $1`,
            [username]
        )

        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`instance.Duplicate username: ${username}`)
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

        const res = await db.query(
            `INSERT INTO users
            (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING username,first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
            [username,
                hashedPassword,
                firstName,
                lastName,
                email,
                isAdmin
            ],
        )

        const user = res.rows[0];
        return user;
    }

    //Find all users

    //Returns [{ username, first_name, last_name, email, is_admin }, ...]

    static async findAll() {
        const res = await db.query(
            `SELECT username,
                first_name AS "firstName",
                last_name AS "lastName",
                email,
                is_admin AS "isAdmin"
            FROM users
            ORDER BY username`,

        )
        return res.rows
    }

    //Given a username, return data about user

    //Returns { username, first_name, last_name, is_admin, pins}
    //Throws NotFoundError if user not found

    static async get(username) {
        const userRes = await db.query(
            `SELECT username,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email,
                    is_admin AS "isAdmin"
            FROM users
            WHERE username = $1`,
            [username],
        )

        const user = userRes.rows[0]
        if (!user) throw new NotFoundError(`No user: ${username}`)

        const userPins = await db.query(
            `SELECT p.id, p.title, p.review, p.rating, p.username
             FROM pins AS p
             LEFT JOIN users AS u
                ON p.username = u.username
             WHERE p.username = $1`, [username]
        )
        user.uPinList = userPins.rows;
        return user;

    }

    //Updates user data with `data`
    //This is a "partial update" - only changes provided portions
    //Data can include: { firstName, lastName, password, email, isAdmin}

    //Returns { username, firstName, lastName, email, isAdmin }
    //Throws NotFoundError if not found

    static async update(username, data) {

        const dataRes = await db.query(
            `SELECT username,
                    password,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    email,
                    is_admin AS "isAdmin"
            FROM users 
            WHERE username = $1`,
            [username]
        )
        const dataUser = dataRes.rows[0]

        if (dataUser) {
            //compare hashed password to a new hash from password
            const enteredPW = data.password
            const isValid = await bcrypt.compare(enteredPW, dataUser.password)
            console.log('VALID?', isValid)
            if (isValid === true) {
                const { setCols, values } = sqlForPartialUpdate(
                    data,
                    {
                        firstName: "first_name",
                        lastName: "last_name",
                        isAdmin: "is_admin",
                    });
                const usernameVarIdx = "$" + (values.length + 1);

                const querySql = `UPDATE users 
                          SET ${setCols} 
                          WHERE username = ${usernameVarIdx} 
                          RETURNING username,
                                    first_name AS "firstName",
                                    last_name AS "lastName",
                                    email,
                                    is_admin AS "isAdmin"`;
                const res = await db.query(querySql, [...values, username]);
                const user = res.rows[0];

                if (!user) throw new NotFoundError(`No user: ${username}`);

                delete user.password;
                return user;
            }
            if (!isValid) throw new UnauthorizedError("Invalid password")
        }

        
    }

    //Deletes given user from database, returns undefined

    static async remove(username) {
        let res = await db.query(
            `DELETE
             FROM users
             WHERE username = $1
             RETURNING username`,
            [username],
        );
        const user = result.rows[0];

        if (!user) throw new NotFoundError(`No user: ${username}`);
    }

    // Favorite a pin: updates database, returns undefined
    // username: user favoriting pin
    // pinId: pin id

    static async favPin(username, pin_id) {
        const validatePin = await db.query(
            `SELECT id
       FROM pins
       WHERE id = $1`, [pin_id])
        const pin = validatePin.rows[0]

        if (!pin) throw new NotFoundError(`No pin: ${pin_id}`)

        const validateUser = await db.query(
            `SELECT username
       FROM users
       WHERE username = $1`, [username])
        const user = validateUser.rows[0]

        if (!user) throw new NotFoundError(`No username: ${username}`)



        const dupFav = await db.query(
            `SELECT username, pin_id
         FROM favorites
         WHERE username = $1 AND pin_id = $2`,
            [username, pin_id]
        )

        if (dupFav.rows[0])
            throw new BadRequestError(`${username} already favorited pin ${pin_id}`)

        await db.query(
            `INSERT INTO favorites (pin_id, username)
       VALUES ($1, $2)`,
            [pin_id, username]
        )
    }

    // Delete a favorited pin: updates database, returns undefined

    static async deleteFav(username, pin_id) {
        const validatePin = await db.query(
            `SELECT id
         FROM pins
         WHERE id = $1`, [pin_id])
        const pin = validatePin.rows[0]

        if (!pin) throw new NotFoundError(`No pin: ${pin_id}`)

        const validateUser = await db.query(
            `SELECT username
         FROM users
         WHERE username = $1`, [username])
        const user = validateUser.rows[0]

        if (!user) throw new NotFoundError(`No username: ${username}`)

        await db.query(
            `DELETE
            FROM favorites 
            WHERE username = $1 AND pin_id = $2
            RETURNING username, pin_id`,
            [username, pin_id]
        )
    }

    // Get all favorite pins of one user
    //Returns {[id, title, review, rating], ...}

    static async userFavList(username) {
        const res = await db.query(`
        SELECT p.id, p.title, p.review, p.rating, p.username
            FROM pins AS p
            LEFT JOIN favorites AS f
                ON p.id =  f.pin_id
            LEFT JOIN users AS u
                ON u.username = f.username
            WHERE u.username = $1`, [username])

        const favList = res.rows
        return favList;
    }


}

module.exports = User