const express = require('express')
const extra = require('fs-extra')
var router = express.Router();
require('dotenv').config()
const { Pool } = require('pg')
const process = require('process')



router.use(function timeLog(req,res,next) {
	console.log("time:", Date.now());
	next();
})

router.use(express.json())

const pool = new Pool({
	connectionString: process.env.POSTGRES_URL
})


//deleta todos os grupos
router.get('/delete_all_groups', async (req,res) => {
	try {
		extra.emptydirSync('/home/admin/tcc/fileSystem/grupos');
		await pool.query("delete from usuario_em_grupo")
		const deleted_groups = await pool.query("delete from grupo returning grupoid");
		return res.status(200).send(deleted_groups)
	} catch (err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

// retorna todos os grupos
router.get("/grupos", async (req,res) => {
	try {
		const grupos  = await pool.query("select * from grupo")
		console.log(grupos.rows)
		return res.status(200).send(grupos.rows)
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

// retorna todos os grupos de um idioma 
router.get("/grupos/:idioma", async (req,res) => {
	const { idioma } = req.params
	try {
		const grupos  = await pool.query("select * from grupo where idioma = $1",[idioma])
		console.log(grupos)
		return res.status(200).send(grupos.rows)
	} catch(err) {
		return res.status(400).send(err)
	}
})

// cria um novo grupo
router.post("/criar_grupo", async (req,res) => {
	const { nome, idioma, nivel, usuarioid } = req.body
	try {
		const grupo = await pool.query('INSERT INTO grupo ("nome", "idioma", "nivel") VALUES ($1, $2, $3) returning grupoid',[nome, idioma, nivel])
		console.log(grupo.rows[0])
		const usuario = await pool.query('INSERT INTO usuario_em_grupo ("usuarioid", "grupoid") values ($1, $2)',[usuarioid,grupo.rows[0].grupoid])
		// fs.mkdir()		
		return res.status(200).send(grupo.rows)
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

// usuário entra em um grupo
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


// retorna os nomes dos usuários de um grupo
router.get("/usuarios_em_grupo/:grupo_name", async (req,res) => {
	const { grupo_name } = req.params
	console.log("nome do grupo: " + grupo_name)
	try {
		const grupo = await pool.query("SELECT usuario.login FROM usuario INNER JOIN (usuario_em_grupo INNER JOIN grupo USING(grupoid)) USING(usuarioid) WHERE grupo.nome = $1",[grupo_name])
		console.log(grupo.rows)
		return res.status(200).send(grupo.rows)
	} catch (err) {
		console.log(err)
		return res.status(400).send(err)
	}
})





module.exports = router;
