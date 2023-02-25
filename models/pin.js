"use strict";

const db = require("../db");
const { NotFoundError, UnauthorizedError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


/** Related functions for pins */

class Pin {
  /** Creates a pin
   *
   * data should be { title, review, rating, long, lat, date }
   *
   * Returns { id, title, review, rating, long, lat, date, username }
   **/

  static async create(data) {
    const result = await db.query(
          `INSERT INTO pins (title,
                             review,
                             rating,
                             long,
                             lat,
                             date,
                             username)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, title, review, rating, long, lat, date, username`,
        [
          data.title,
          data.review,
          data.rating,
          data.long,
          data.lat,
          data.date,
          data.username
        ]);
    let pin = result.rows[0];

    return pin;
  }

  /** Find all pins 
   * 
   * Returns [{ id, title, review, rating, long, lat, date, username }, ...]
   * */

  static async findAll() {

    const result = await db.query(`SELECT id,
                        title,
                        review,
                        rating,
                        long,
                        lat,
                        date,
                        username
                 FROM pins`)
  
    return result.rows;

  }



  /** Update pin data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, review, rating }
   *
   * Returns { id, title, review, rating, date, username }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {

    const {setCols, values} = sqlForPartialUpdate(data, {})
    const idVarIdx = "$" + (values.length + 1)

    const querySql = 
      `UPDATE pins 
       SET ${setCols}
       WHERE id=${idVarIdx}
       RETURNING id, title, review, rating, date, username`

    const res = await db.query(querySql, [...values, id])
    let pin = res.rows[0]

    if (!pin) throw new NotFoundError(`No pin: ${id}`);

    return pin;
  }



  /** Delete given pin from database; returns undefined.
   *
   * Throws NotFoundError if pin not found.
   **/

  static async remove(id) {

    const result = await db.query(
          `DELETE
           FROM pins
           WHERE id = $1
           RETURNING id`, [id]);
    const pin = result.rows[0];

    if (!pin) throw new NotFoundError(`No pin: ${id}`);
  }

}

module.exports = Pin;