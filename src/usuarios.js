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
const config = process.env



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
router.put("/register_admin", auth, admin, async (req,res) => {
	const { username } = req.body
	try {
		const admin = await pool.query("update usuario set isAdmin = TRUE where username = $1 returning*",[username])
		console.log('admin adicionado com sucesso')
		return res.status(200).send(admin)
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

// registrar usuario como conteudista
router.put("/register_admin", auth, admin, async (req,res) => {
	const { username } = req.body
	try {
		const conteudista = await pool.query("update usuario set isConteudista = TRUE where username = $1 returning*",[username])
		console.log('Conteudista adicionado com sucesso')
		return res.status(200).send(conteudista)
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
	console.log("password: " + password)
	try {
		const usuario = await pool.query("SELECT usuario_id, username, password, isConteudista, isAdmin FROM usuario WHERE username = $1",[username])

		console.log(usuario.rows[0])
		
		const grupo = await pool.query("SELECT grupo_id FROM usuario NATURAL JOIN usuario_em_grupo WHERE usuario_id = $1",[usuario.rows[0].usuario_id])

		console.log(grupo.rows)
		if (usuario.rows[0].password == password) {
			const token = jwt.sign(
				// {user_id: rows[0].usuario_id, username},
				{ 
					"user_id": usuario.rows[0].usuario_id,
					"user_name":username, 
					"isConteudista": usuario.rows[0].isconteudista, 
					"isAdmin": usuario.rows[0].isadmin
				},
				process.env.TOKEN_KEY,
				{
					expiresIn: "2h"
				}
			);

			let user = {}
			user.usuario_id = usuario.rows[0].usuario_id
			if(grupo.rows.length != 0){
				user.grupo_id = grupo.rows[0].grupo_id
			}
			user.username = usuario.rows[0].username
			user.token = token
			user.isadmin = usuario.rows[0].isadmin
			user.isconteudista = usuario.rows[0].isconteudista
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



// pegar informações do usuário
/////////////////////////////////////////////////////////////////////////////////////////////
// Procurar uma forma de enviar/comparar as senhas que não envolva enviálas em plain text  //
//                                                                                         //
//                                                                                         //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
router.get("/user_id", auth, async (req,res) => {
	try {
		const token = req.headers['x-access-token']

		if(!token) {
			return res.status(403).send("Uma token é necessária para autenticação 2")
		}

		const decoded = jwt.verify(token, config.TOKEN_KEY);
		req.user = decoded
		console.log("decoded")

		return res.status(200).send({user_id: decoded.user_id})


	} catch (err) {
		console.log(err)
		return res.status(400).send('Deu ruim')
	}
})

router.get('/user_info', auth, async (req,res) => {
	try {
		const token = req.headers['x-access-token']

		if(!token) {
			return res.status(403).send("Uma token é necessária para autenticação 2")
		}

		const decoded = jwt.verify(token, config.TOKEN_KEY)

		// const { rows } = await pool.query("SELECT usuario_id, username, isConteudista, isAdmin, grupo_id FROM usuario NATURAL JOIN usuario_em_grupo WHERE usuario_id = $1",[decoded.user_id])

		const usuario = await pool.query("SELECT usuario_id, username, isAdmin, isConteudista FROM usuario WHERE usuario_id = $1",[decoded.user_id])

		const grupo = await pool.query("SELECT grupo_id FROM grupo NATURAL JOIN usuario_em_grupo WHERE usuario_id = $1",[usuario.rows[0].usuario_id])

		let user = {}

		user.username = usuario.rows[0].username
		user.isadmin = usuario.rows[0].isadmin
		user.user_id = usuario.rows[0].usuario_id
		user.isconteudista = usuario.rows[0].isconteudista
		user.token = token
		user.grupo_id = 0

		if(grupo.rows[0]) {
			user.grupo_id = grupo.rows[0].grupo_id
		}
		console.log(user)

		return res.status(200).send(user)
	} catch(err) {
		return res.status(400).send(err)
	}
})

router.get("/user_name", auth, async (req,res) => {
	try {
		const token = req.headers['x-access-token']

		if(!token) {
			return res.status(403).send("Uma token é necessária para autenticação 2")
		}

		const decoded = jwt.verify(token, config.TOKEN_KEY);
		req.user = decoded
		console.log("decoded")
		console.log(decoded)

		return res.status(200).send({user_name: decoded.user_name})


	} catch (err) {
		console.log(err)
		return res.status(400).send('Deu ruim')
	}
})

router.get("/user_grupos", auth, async (req,res) => {
	try {
		const token = req.headers["x-access-token"]

		const decoded = jwt.verify(token, config.TOKEN_KEY);

		let { rows } = await pool.query("select grupo_id from usuario_em_grupo where usuario_id = $1",[decoded.user_id])
		const grupo_id = rows[0].user_id
		let resposta = await pool.query("select nome, idioma, nivel from grupo where grupo_id = $1",[rows[0].user_id])

		return res.status(200).send(resposta.rows[0])
	} catch(err) {
		return res.status(400).send(err)
	}
})

module.exports = router
