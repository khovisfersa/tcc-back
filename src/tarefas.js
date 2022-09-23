const express = require('express')
const router = express.Router()
const process = require('process');
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
	connectionString: process.env.POSTGRES_URL
})

router.use(function tileLog(req,res,next) {
	console.log("time: " + Date.now())
	next()
})

router.use(express.json());

router.post("/criar_tarefa", async (req,res) => {
	const { titulo, nivel, texto, avaliacao } = req.body
	try {
		const tarefa = pool.query('INSERT INTO tarefa ("titulo", "nivel", "texto", "metodo_de_avaliacao") VALUES ($1, $2, $3, $4) returning *',[titulo, nivel, texto, avaliacao])
		return res.status(200).send(tarefa.rows)
	} catch(err) {
		return res.status(400).send(err)
	}
})




module.exports = router
