"use strict"

const express = require("express");

const {NotFoundError} = require("../expressError")

const db = require("../db");
const router = new express.Router();

/** Return info on invoices: like {invoices: [{id, comp_code}, ...]} */
router.get("/invoices", async function (req, res){
  const results = await db.query(
    `SELECT id, comp_code
      FROM invoices`);

    const invoices = results.rows;

    return res.json({invoices});
  });

/** Returns obj on given invoice.
 * If invoice cannot be found, returns 404.
 * Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
 */
router.get("/invoices/:id", async function (req, res){
  const id = req.params.id
  const results = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, code, name, description
      FROM invoices
      INNER JOIN companies
      ON invoices.comp_code = companies.code
      WHERE invoices.id = $1`, [id]
  )
  const invoice = results.rows[0]

  if(!invoice) throw new NotFoundError(`Invoice with id ${id} not found`);

  const code = invoice.code
  const name = invoice.name
  const description = invoice.description

  const company = {code, name, description}

  invoice.company = company

  return res.json({ invoice })
  });

/** Adds an invoice.
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.post("/invoices", async function (req, res){
  debugger;
  if (req.body === undefined) throw new BadRequestError();

  const {comp_code, amt} = req.body

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
  )

  const invoice = results.rows[0]
  return res.status(201).json({ invoice })
})

/** PUT /invoices/[id]
 * Updates an invoice.
 * If invoice cannot be found, returns a 404.
 * Needs to be passed in a JSON body of {amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/invoices/:id", async function (req, res){
  const id = req.params.id

  if (!req.body) throw new BadRequestError();

  const {amt} = req.body;

  const results = await db.query(
    `UPDATE invoices
           SET amt=$2
           WHERE id = $1
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [id, amt]
  );
  const invoice = results.rows[0]

  if(!invoice) throw new NotFoundError();//add string template literals for more specific message

  return res.status(201).json({ invoice});
})

/** Deletes company.
 *  Should return 404 if company cannot be found.
 *  Returns {status: "deleted"}
*/
router.delete("/invoices/:id", async function (req, res){
  const id = req.params.id

  const results = await db.query(
    `DELETE FROM invoices
          WHERE id = $1
          RETURNING id`, [id]);

  const invoice = results.rows[0]

  if(!invoice) throw new NotFoundError(`Cannot find invoice id ${id} to delete.`);

  return res.json({status: "Deleted"})
})



  module.exports = router;