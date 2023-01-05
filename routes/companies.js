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

      If the company given cannot be found, this should return a 404 status response.*/
router.get("/companies/:code", async function (req, res){
  const code = req.params.code
  const results = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  )
  const company = results.rows[0]
  if(company){
    return res.json({ company })
  }
  else{
    throw new NotFoundError()
  }
})


/** Adds a company.

      Needs to be given JSON like: {code, name, description}

      Returns obj of new company: {company: {code, name, description}} */
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

/**Edit existing company.

    Should return 404 if company cannot be found.

    Needs to be given JSON like: {name, description}

    Returns update company object: {company: {code, name, description}} */
router.put("/companies/:code", async function (req, res){
  debugger;
  const code = req.params.code
  if (req.body === undefined) throw new BadRequestError();
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
  if(company === undefined){throw new NotFoundError}

  return res.status(201).json({ company });
})
/** Deletes company.

  Should return 404 if company cannot be found.

  Returns {status: "deleted"} */
router.delete("/companies/:code", async function (req, res){
  debugger;
  const code = req.params.code
  const company = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  )
  if(company.rows[0] === undefined){throw new NotFoundError}
  const results = await db.query(
    `DELETE FROM companies WHERE code = $1`, [code]);
  return res.json({status: "Deleted"})
})
module.exports = router;
