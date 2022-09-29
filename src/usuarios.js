const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();
const process = require('process');
const cors = require('cors');
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth.js")
const admin = require("../middleware/admin.js")
const conteudista = require("../middleware/conteudista.js")



const pool = new Pool({
	connectionString: process.env.POSTGRES_URL
})

router.use(cors());

router.use(function tileLog(req,res,next) {
	console.log("time: " + Date.now())
	next()
})

router.use(express.json())


router.get('/user', auth, (req,res) => {
	
})

router.post('/welcome', auth, (req,res) => {
	res.status(200).send("Welcome, motherfucker!")
})

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



//  cadastrar novo usuário
///////////////////////////////////////////////////////////////////////////////////////////////////////
//   fazer com que a api veja se já existe um usuário cadastrado com essas coisas antes de cadastrar //
//                                                                                                   // 
//                                                                                                   // 
//                                                                                                   // 
/////////////////////////////////////////////////////////////////////////////////////////////////////// 
router.post("/cadastro", async ( req,res) => {
	const { nome, sobrenome, email, username, password} = req.body
	try {
		const newUser = await pool.query("insert into usuario (nome, sobrenome, email, username, password) values ($1, $2, $3, $4, $5) returning *",[nome, sobrenome, email, username, password])
		res.status(200).send(newUser.rows)
	} catch(err) {
		console.log(err)
		res.status(400).send(err)
	}
})



// fazer login do usuario
/////////////////////////////////////////////////////////////////////////////////////////////
// Procurar uma forma de enviar/comparar as senhas que não envolva enviálas em plain text  //
//                                                                                         //
//                                                                                         //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
router.post("/login", async (req,res) => {
	const {username, password} = req.body
	console.log("user: " + username)
	try {
		const {rows} = await pool.query("select usuario_id, username, password, isConteudista, isAdmin from usuario where username = $1",[username])
		console.log(rows[0])
		if (rows[0].password == password) {
			const token = jwt.sign(
				// {user_id: rows[0].usuario_id, username},
				{ 
					"user_id": rows[0].usuario_id,
					"user_name":username, 
					"isConteudista": rows[0].isconteudista, 
					"isAdmin": rows[0].isadmin
				},
				process.env.TOKEN_KEY,
				{
					expiresIn: "2h"
				}
			);

			let user = {}
			user.username = rows[0].username
			user.token = token
			console.log(token)

			return res.status(200).send(user)
		}
		else {
			return res.status(400).send("errou, otario")
		}

	}
	catch(err) {
		console.log(err)
		return res.status(400).send("Deu ruim por um motivo desconhecido")
	}
})





module.exports = router
