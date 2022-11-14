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
const config = process.env

// se começar a dar problema com o res.send(), o negócio é o seguinte: você tá mandando um número sozinho no send
//, aí, o express entende isso como se fosse um código de status e dá ruim




const pool = new Pool({
	connectionString: process.env.POSTGRES_URL
})

router.use(cors());

router.use(express.json())



router.use(function timeLog(req,res,next) {
	console.log("time:", Date.now());
	next();
})


router.use(express.json());

router.post("/criar_tarefa", auth, conteudista, async (req,res) => {
	const { title, nivel, text, tipo, rubrica } = req.body
	try {
		console.log("teste")
		const tarefa = pool.query('INSERT INTO tarefa ("title", "nivel", "text", file_path, tipo, "rubrica") VALUES ($1, $2, $3, NULL, $4, $5) returning *',[title, nivel, text, tipo, rubrica])
		console.log("tarefa")
		console.log(tarefa)

		return res.status(200).send(tarefa.rows)
	} catch(err) {
		return res.status(400).send(err)
	}
})

router.post("/atribuir", auth, /*admin,*/ async (req,res) => {
	const {grupo_id, tarefa_id} = req.body

	try{
		const closing = await pool.query("UPDATE resposta SET isopen = FALSE WHERE grupo_id = $1 AND isopen = TRUE",[grupo_id])
		const insert = await pool.query("INSERT INTO resposta (grupo_id, tarefa_id, content_path, isopen) VALUES ($1,$2,'',true)",[grupo_id, tarefa_id])

		return res.status(200).send("tarefa atribuida com sucesso")
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

router.post("/avaliar", auth, async (req,res) => {
	const { usuario_id, grupo_id, tarefa_id, comentario, nota } = req.body

	try{
		const insert = await pool.query("insert into avaliacao (usuario_id, grupo_id, tarefa_id, comentario, nota) values ($1, $2, $3, $4, $5)",[usuario_id, grupo_id, tarefa_id, comentario, nota])

		return res.status(200).send("Avaliação feita com sucesso")
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

router.get('/tarefa/:id', async (req,res) => {
	const { id } = req.params
	try {
		console.log("testeeeeeeeee: " + id)
		const { rows } = await pool.query('SELECT * FROM tarefa WHERE tarefa_id = $1',[id])
		console.log(rows)
		console.log("after testeeeeeee")
		return res.status(200).send(rows[0])
	} 
	catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})

router.get('/tarefa_ativa/:grupo_id', async (req,res) => {
	const { grupo_id } = req.params
	try {
		let resposta = await pool.query("SELECT tarefa_id FROM resposta WHERE grupo_id = $1 AND isopen = true", [grupo_id])

		let tarefa_id = resposta.rows[0].tarefa_id

		let identificadores = await pool.query("SELECT identificador FROM usuario_de_grupo_responde WHERE tarefa_id = $1 AND grupo_id = $2",[tarefa_id, grupo_id])

		let idents = []

		let tarefaInfo = await pool.query("SELECT * FROM tarefa WHERE tarefa_id = $1",[tarefa_id])

		if(identificadores.rows){
			identificadores.rows.forEach( element => {
				idents.push(parseInt(element.identificador))
			})
		}

		console.log("identificadores: ")
		console.log(identificadores.fields)
		return res.send({identificadores: idents, tarefa_info: tarefaInfo.rows[0]})
	}
	catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})


// router.get('/get_tarefa_ativa/:grupo_id', async (req,res) => {
// 	try {
// 		const { grupo_id } = req.params	
// 		let { rows } = await pool.query("SELECT tarefa_id FROM resposta WHERE grupo_id = $1 AND isopen = true",[grupo_id])

// 		console.log(coiso)
		

// 		// var ativa_id = rows[0].tarefa_id
// 		// console.log("Ativa_id: " + ativa_id)
// 		// res.status(200)
// 		// console.log("ativa_id: " + ativa_id)
// 		// return res.status(200).send(ativa_id)		
// 	} 
// 	catch(err) {
// 		return res.status(400).send(err)
// 	}
// })



module.exports = router
