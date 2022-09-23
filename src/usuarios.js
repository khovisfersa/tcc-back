const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();
const process = require('process');


const pool = new Pool({
	connectionString: process.env.POSTGRES_URL
})

router.use(function tileLog(req,res,next) {
	console.log("time: " + Date.now())
	next()
})

router.use(express.json())

router.post("/entrar_em_grupo", async (req,res) => {
	const { usuario, grupo } = req.body
	try {
		const {rows} = await pool.query("select usuarioid from usuario where login = $1",[usuario])
		const user_id = rows[0].usuarioid
		const rows2 = await pool.query("select grupoid from grupo where nome = $1",[grupo])
		console.log(rows2.rows[0].grupoid)
		const grupo_id = rows2.rows[0].grupoid
		const final = await pool.query("insert into usuario_em_grupo (usuarioid, grupoid) values ($1, $2)",[user_id, grupo_id])
		return res.status(200).send(final)
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

// registrar usuário como admin
router.put("/register_admin/:login", async (req,res) => {
	const login = req.login
	try {
		const admin = await pool.query("update usuario set isAdmin = TRUE where login = $1 returning*",[login])
		console.log('admin adicionado com sucesso')
		return res.status(200).send(admin)
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

// registrar usuario como conteudista
router.put("/register_admin/:login", async (req,res) => {
	const login = req.login
	try {
		const admin = await pool.query("update usuario set isConteudista = TRUE where login = $1 returning*",[login])
		console.log('Conteudista adicionado com sucesso')
		return res.status(200).send(admin)
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

//cadastrar novo usuário
router.post("/cadastro", async ( req,res) => {
	const { nome, email, login, password} = req.body
	try {
		const newUser = await pool.query("insert into usuario (nome, email, login, password) values ($1,$2, $3, $4) returning *",[nome, email, login, password])
		res.status.send(newUser.rows)
	} catch(err) {
		res.status(400).send(err)
	}
})





module.exports = router
