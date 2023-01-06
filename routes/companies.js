"use strict"

const express = require("express");

const {NotFoundError} = require("../expressError")

const db = require("../db");
const router = new express.Router();

/** Returns list of companies, like {companies: [{code, name}, ...]} */
router.get("/companies", async function (req, res){
  const results = await db.query(
    `SELECT code, name
      FROM companies`);

    const companies = results.rows;

    return res.json({companies});
  });

/** Return obj of company: {company: {code, name, description}}
 *  If the company given cannot be found, this should return a 404 status response.
*/
router.get("/companies/:code", async function (req, res){
  const code = req.params.code
  const comp = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  )


  const company = comp.rows[0]

  if(!company) throw new NotFoundError(`Cannot find company code ${code}`);
debugger;
  const comp_code = company.code

  const results = await db.query(
    `SELECT id, amt, paid, comp_code, add_date, paid_date
      FROM invoices
      WHERE comp_code = '${comp_code}'`
  )
  const invoices = results.rows

  company.invoices = invoices
  return res.json({ company })
})


/** Adds a company.
 *  Needs to be given JSON like: {code, name, description}
 *  Returns obj of new company: {company: {code, name, description}}
*/
router.post("/companies", async function (req, res){
  if (req.body === undefined) throw new BadRequestError();

  const {code, name, description} = req.body;

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`, [code, name, description]
  )
  const company = results.rows[0]

  return res.status(201).json({ company });
})

/** Edit existing company.
 *  Should return 404 if company cannot be found.
 *  Needs to be given JSON like: {name, description}
 *  Returns update company object: {company: {code, name, description}}
 */
router.put("/companies/:code", async function (req, res){
  const code = req.params.code

  if (!req.body) throw new BadRequestError();

  const {name, description} = req.body;

  const results = await db.query(
    `UPDATE companies
           SET name=$2,
               description=$3
           WHERE code = $1
           RETURNING code, name, description`,
    [code, name, description]
  );
  const company = results.rows[0]

  if(!company) throw new NotFoundError(`Cannot find company code ${id} to update.`);

  return res.status(201).json({ company });
})
/** Deletes company.
 *  Should return 404 if company cannot be found.
 *  Returns {status: "deleted"}
*/
router.delete("/companies/:code", async function (req, res){
  const code = req.params.code

  const results = await db.query(
    `DELETE FROM companies
          WHERE code = $1
          RETURNING code`, [code]);

  const company = results.rows[0]

  if(!company) throw new NotFoundError(`Cannot find company code ${id} to delete.`);

  return res.json({status: "Deleted"})
})
module.exports = router;
