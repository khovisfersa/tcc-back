const express = require('express')
const extra = require('fs-extra')
var router = express.Router();
require('dotenv').config()
const { Pool } = require('pg')
const process = require('process')
const cors = require('cors');
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth.js")
const admin = require("../middleware/admin.js")
const conteudista = require("../middleware/conteudista.js")
const path = require('path')
const fs = require('fs')

const config = process.env



const pool = new Pool({
	connectionString: process.env.POSTGRES_URL
})

router.use(cors());

router.use(express.json())

const base = path.join(__dirname, '..', 'fileSystem')



router.use(function timeLog(req,res,next) {
	console.log("time:", Date.now());
	next();
})

router.get("/open_groups", async (req,res) => {
	try {
		const grupos = await pool.query("select g.nome,g.grupo_id, g.idioma, g.nivel, count(u.usuario_id) as qt_usuarios from  grupo g natural join usuario_em_grupo u group by g.nome, g.idioma, g.nivel, g.grupo_id having count(u.usuario_id)<5",[])

		res.status(200).send({grupos: grupos.rows})
	}
	catch(err) {
		res.status(400).send(err)

	}
})

router.get('/is_user_on_group/:usuario_id/:grupo_id', auth, async (req,res)=> {
	const { usuario_id, grupo_id } = req.params 
	try {
		const { rows } = await pool.query("SELECT grupo_id from usuario_em_grupo where usuario_id = $1",[usuario_id])
		if(rows[0].grupo_id == grupo_id) return res.status(200).send(true)
		else return res.status(200).send(false)
	} catch (err) {
		return res.status(400).send("Some sort of error might have happened")
	}
})

//deleta todos os grupos
router.get('/delete_all_groups', async (req,res) => {
	try {
		extra.emptydirSync('/home/admin/tcc/fileSystem/grupos');
		await pool.query("delete from usuario_em_grupo")
		const deleted_groups = await pool.query("delete from grupo returning grupo_id");
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
		const grupo = await pool.query('INSERT INTO grupo ("nome", "idioma", "nivel") VALUES ($1, $2, $3) returning grupo_id',[nome, idioma, nivel])
		console.log(grupo.rows[0])
		const usuario = await pool.query('INSERT INTO usuario_em_grupo ("usuario_id", "grupo_id") values ($1, $2)',[usuarioid,grupo.rows[0].grupo_id])
		fs.mkdir(path.join(base,  String(grupo.rows[0].grupo_id)), (err) => {
			console.log(err)
		})		
		return res.status(200).send(grupo.rows)
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

// usuário entra em um grupo
router.post("/entrar_em_grupo", async (req,res) => {
	// const { usuario, grupo } = req.body
	const {usuario_id, grupo_id } = req.body
	try {
		const final = await pool.query("insert into usuario_em_grupo (usuario_id, grupo_id) values ($1, $2)",[usuario_id, grupo_id])
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
		const grupo = await pool.query("SELECT usuario.login FROM usuario INNER JOIN (usuario_em_grupo INNER JOIN grupo USING(grupo_id)) USING(usuario_id) WHERE grupo.nome = $1",[grupo_name])
		console.log(grupo.rows)
		return res.status(200).send(grupo.rows)
	} catch (err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

router.get("/get_grupo_by_id/:grupo_id", async (req,res) => {
	const { grupo_id } = req.params 
	try {
		const grupo = await pool.query("SELECT * FROM grupo WHERE grupo_id = $1",[grupo_id])

		const users = await pool.query("SELECT u.usuario_id, u.username, u.isadmin, u.isconteudista, g.grupo_id, g.nivel, g.nome FROM usuario u INNER JOIN usuario_em_grupo ug ON ug.usuario_id = u.usuario_id INNER JOIN grupo g ON g.grupo_id = ug.grupo_id WHERE g.grupo_id = $1",[grupo_id]) 
		
		const finalizados = await pool.query("select t.title, t.tarefa_id, t.tipo, t.nivel, r.nota from resposta r natural join tarefa t where r.grupo_id = $1 and r.isopen = false",[grupo_id])

		const aberto = await pool.query("select t.tarefa_id, t.title, t.tipo from resposta r natural join tarefa t WHERE r.grupo_id = $1 AND r.isopen = true",[grupo_id])

		console.log(grupo.rows)
		console.log(users.rows)
		console.log(finalizados.rows)
		console.log(aberto.rows)


		// return res.status(200).send({grupo_info: grupo.rows[0], users: users.rows, feitos: finalizados.rows, aberto: { titulo: aberto.rows[0].title, dados: aberto.rows}})
		return res.status(200).send({grupo_info: grupo.rows[0], users: users.rows, feitos: finalizados.rows, aberto: aberto.rows[0] })

	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})


router.get("/nome/:grupo_id", async (req,res) => {
	const { grupo_id } = req.params
	try {
		const { rows } = await pool.query("select nome from grupo where grupo_id = $1",[grupo_id])

		return res.status(200).send(rows[0].nome)
	}
	catch(err) {
		return res.status(400).send(err)
	}
})


module.exports = router;
