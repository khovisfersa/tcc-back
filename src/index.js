const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const process = require('process');
const app = express();
const cors = require('cors');
const formidable = require('formidable');
require('dotenv').config();

app.use(require('./grupos.js'));
app.use(require('./usuarios.js'));
app.use(require('./tarefas.js'));
app.use(require('./respostas.js'));
app.use(cors({
	origin: '*'
}));

const base = "/home/admin/tcc/"
const pool = new Pool({
	connectionString: process.env.POSTGRES_URL
})

app.use(express.json())
const PORT = process.env.PORT || 3333

app.get('/',(req ,res) => {
	res.status(200).sendFile( __dirname + "/index.html")
})


app.get('/upload', (req,res) => {
	res.sendFile(__dirname + "/upload.html")
})


app.post('/upload', (req,res) => {
	console.log("index.js")
	console.log(req)
	let form = new formidable.IncomingForm();

	form.parse(req, function(error, fields, file) {
		try {
			
			let file_path = file.fileupload.filepath;
			let new_path = base + "tmp/";
			new_path += file.fileupload.originalFilename;
			console.log("new path :", new_path);
			console.log("file path :", file_path);
			fs.rename(file_path, new_path, () => {
				return res.send("file uploaded successfully")
			})
		}catch(error) {
			console.log(error);
			return  res.status(400).send(error)
		}
	})
})

app.get("/grupos/:idioma", async (req,res) => {
	const { idioma } = req.params
	try {
		const grupos  = await pool.query("select * from grupo where idioma = $1",[idioma])
		console.log(grupos)
		return res.status(200).send(grupos.rows)
	} catch(err) {
		return res.status(400).send(err)
	}
})

app.post("/entrar_em_grupo", async (req,res) => {
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

app.get("/usuarios_em_grupo/:grupo_name", async (req,res) => {
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

app.put("/register_admin/:login", async (req,res) => {
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

app.post("/cadastro", async ( req,res) => {
	const { nome, email, login, password} = req.body
	try {
		const newUser = await pool.query("insert into usuario (nome, email, login, password) values ($1,$2, $3, $4) returning *",[nome, email, login, password])
		res.status.send(newUser.rows)
	} catch(err) {
		res.status(400).send(err)
	}
})

app.get('/tarefas', async (req,res) => {
	try{
		const { rows } = await pool.query("select * from tarefa")
		console.log(rows)
		return res.status(200).send(rows)
	} catch(err) {
		return res.status(400).send(err)
	}
})

app.post("/criar_tarefa", async (req,res) => {
	const { titulo, nivel, texto, avaliacao } = req.body
	try {
		const tarefa = pool.query('INSERT INTO tarefa ("titulo", "nivel", "texto", "metodo_de_avaliacao") VALUES ($1, $2, $3, $4) returning *',[titulo, nivel, texto, avaliacao])
		return res.status(200).send(tarefa.rows)
	} catch(err) {
		return res.status(400).send(err)
	}
})

app.get("/usuarios", async (req,res) => {
	try{
		const { rows } = await pool.query("select * from usuario")
		console.log(rows)
		return res.status(200).send(rows)
	} catch(err) {
		return res.status(400).send(err)
	}
})

app.post('/:grupo/:tarefa/criar_resposta', async (req,res) => {
	const grupo = req.grupo
	const tarefa = req.tarefa
	// const {}
})

//


// usuário gravar sua parte


/////////////////////////////////////////// TEST Area \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


app.get('/download', async(req,res) => {
	const fileId = await func.searchFile("teste.mp3")
	// res.body = await func.downloadFile(fileId)
	return res.status(200).send(func.downloadFile(fileId))
})

app.get('/audio',(req,res) => {
	const range = req.headers.range;
	console.log(__dirname + "/tmp/")
	const videoPath = __dirname + "/tmp/Google drive API javascript #2 _ Get files, download files, update files & delete files of Drive JS.mp3"
	console.log("video path: " + videoPath)
	const videoSize = fs.statSync(videoPath).size;

	const chunkSize = 1*1e6;
	console.log(range)
	const start = Number(range.replace(/\D/g, ""));
	const end = Math.min(start + chunkSize, videoSize-1);
	const contentLength = end - start + 1

	console.log("start: " + start)

	const headers = {
		"Content-Range": `bytes ${start} - ${end}/${videoSize}`,
		"Accept-Ranges": "bytes",
		"Content-length": contentLength,
		"content-Type": "audio/mp3"
	}

	res.writeHead(206, headers)

	const stream = fs.createReadStream(videoPath,{start, end})
	stream.pipe(res)
})

app.get('/get_file/:file', async (req,res) => {
	const {file} = req.params;
	console.log('file: ', file)
	const resposta = await func.searchFile(file)
	const fileInfo = tools.getInfoFromId(resposta[0].id)
	try {
		tools.performRequest_download_start(req, res, fileInfo)
	} catch(err) {
		console.log(err)
	}
	return res.status(200).send(resposta)
})

app.get('/receive_file_stream/:file', (res,req) => {
	const file_info = tools.getFileInfo()
})

app.listen(PORT, () => {
	console.log("listening to port: " + PORT)
})
