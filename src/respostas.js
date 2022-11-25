const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const fs = require('fs')
require('dotenv').config()
const process = require('process');
let formidable = require('formidable');
const cors = require('cors');
const {  Blob } = require( 'buffer')
const path = require('path')


router.use(cors({
	origin:'*'
}));
router.use(express.json())

router.use(function timeLog(req,res,next) {
	console.log("respostas-time: " + Date.now())
	next()
})

const pool = new Pool({
	connectionString: process.env.POSTGRES_URL
})


// const base = '/home/admin/tcc/fileSystem/'
const base = path.join(__dirname, '..', 'fileSystem')

/////////////////rotas\\\\\\\\\\\\\\\\\\

// salvar arquivo de usuário na resposta de uma tarefa



// 
router.get('/upload', (req,res) => {
	return res.status(200).sendFile(base + "upload.html")
})


router.post('/uploadaudio', (req,res) => {
	console.log("respostas.js")
	console.log(req.file)
	let form = new formidable.IncomingForm();

	form.parse(req, function(error, fields, file) {
		try {
			console.log("tried")
			let file_path = file.fileupload.filepath;
			let new_path = base + "tmp/";
			console.log(new_path)
			new_path += file.fileupload.originalFilename;
			console.log("new path: ", new_path);
			console.log("file path: ", file_path);
			fs.rename(file_path, new_path, () => {
				return res.send("file uploaded successfully");
			})
		} catch(error) {
			console.log("treta")
			console.log(error);
			return res.status(400).send(error)
		}
	})
})


router.post('/upload_audio', async ( req,res ) => {
	const filename = req.body.filename
	const  blob = new Blob(req.body.file, {
		type: 'audio/mp3'
	})

	let form = new formidable.IncomingForm();


	console.log("coisou")
	form.parse(req, (error, fields, file) => {
		let file_path = file.file.filepath
		console.log(fields)
		console.log(base)
		let new_path = path.join(base, fields.grupo_id, fields.grupo_id + '-' + fields.tarefa_id + '-' + fields.identificador + '.mp3')
		try {
			fs.access(file_path, fs.constants.F_OK,(err) => {
				if(err) throw err
				console.log("existe!")
			})
			fs.chmod(file_path, 0o777, (err) => {
				if (err) throw err
				console.log("deu bom, eu acho")
			})
			fs.rename(file_path, new_path	, async (err) => {
				if(err) throw err;
				console.log("deu bom, meu consagrado")

				const new_entry = await pool.query("INSERT INTO usuario_de_grupo_responde (usuario_id, grupo_id, tarefa_id, identificador, nota, text) VALUES ($1, $2, $3, $4, $5, $6)",[fields.usuario_id, fields.grupo_id, fields.tarefa_id, fields.identificador, null, null])

				const { rows } = await pool.query("select count(identificador) from usuario_de_grupo_responde where tarefa_id= $1 and grupo_id = $2",[fields.tarefa_id, fields.grupo_id])

				let num = rows[0].count
				if(num == 5){
					const update = pool.query("UPDATE resposta SET isopen = FALSE WHERE grupo_id = $1 AND tarefa_id = $2",[fields.grupo_id, fields.tarefa_id])
				}


				return res.status(200).send("Agora sim, deu bom")
			})
		} catch(err) {
			console.log("deu ruim, menó")
			return res.status(400).send("deu ruim, menó")
		} 
		})
})


router.post('/create_resposta', async (req,res) => {
	try {
		const { tarefa_id, grupo_id, usuario_id, text, identificador } = req.body
		const make_resposta = await pool.query('INSERT INTO usuario_de_grupo_responde (tarefa_id, grupo_id, usuario_id, identificador, text) VALUES ($1, $2, $3, $4, $5)',[tarefa_id, grupo_id, usuario_id, identificador, text])

		const { rows } = await pool.query("SELECT identificador FROM usuario_de_grupo_responde WHERE tarefa_id = $1 AND grupo_id = $2",[tarefa_id, grupo_id])

		if(rows.length == 5) {
			const update = pool.query("UPDATE resposta SET isopen = FALSE WHERE grupo_id = $1 AND tarefa_id = $2",[grupo_id, tarefa_id])
		}

		console.log("make_resposta")

		return res.status(200).send(true)

	} catch (err) {
		return res.status(400).send(err)
	}
})


router.get('/avaliacoes/:grupo_id/:tarefa_id', async (req,res) => {
	const { grupo_id, tarefa_id } = req.params
	try {
		const avaliacoes = await pool.query("select * from avaliacao where grupo_id = $1 and tarefa_id = $2",[grupo_id, tarefa_id])

		return res.status(200).send(avaliacoes.rows)
	}
	catch(err) {
		res.status(400).send(err)
	}
})


router.get('/ja_comentei/:grupo_id/:tarefa_id/:usuario_id', async (req,res) => {
	const { grupo_id, tarefa_id, usuario_id} = req.params

	try {
		const didI = await pool.query("select * from avaliacao where grupo_id= $1 and tarefa_id = $2 and usuario_id = $3",[grupo_id, tarefa_id, usuario_id])

		if(didI.rows[0].length == 0) {
			return res.status(200).send(false)
		}
		else {
			return res.status(200).send(true)
		}
	}
	catch(err) {
		return res.status(400).send(err)
	}
})


router.post('/criar_avaliacao', async (req,res) => {
	const { usuario_id, tarefa_id, grupo_id, comentario, nota } = req.body


	try {
		const insert = await pool.query("insert into avaliacao (usuario_id, grupo_id, tarefa_id, comentario, nota) VALUES ($1, $2, $3, $4, $5) returning comentario",[usuario_id, grupo_id, tarefa_id, comentario, nota])

		return res.status(200).send(insert.rows[0])
	} catch(err) {
		return res.status(400).send(err)
	}
})


router.get('/audio_by_name/:grupo_id/:name',(req,res) => {
	const { name, grupo_id } = req.params

	try {
		const range = req.headers.range;
    const videoPath = path.join(base,grupo_id, name + '.mp3') 	//base + "/" + name + ".mp3"
    console.log(videoPath)
    const videoSize = fs.statSync(videoPath).size;
    console.log(videoSize)
    const chunkSize = 1*1e6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, videoSize - 1);
    const contentLength = end - start + 1
    const headers = {
            "Content-Range": `bytes ${start} - ${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-length": contentLength,
            "content-Type": "audio/mp3"
    }

    res.writeHead(206, headers)

    const stream = fs.createReadStream(videoPath,{start, end})
    stream.pipe(res)	
	} catch(err) {
		res.status(404).send("Audio não encontrado")
	}
})


router.get('/audio',(req,res) => {
	console.log("respostas")
    const range = req.headers.range;
    const videoPath = base + "/4-2-1.mp3"
    console.log(videoPath)
    const videoSize = fs.statSync(videoPath).size;
    console.log(videoSize)
    const chunkSize = 1*1e6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, videoSize - 1);
    const contentLength = end - start + 1
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


router.get('/get_respostas_texto/:grupo_id/:tarefa_id', async (req,res) => {
	const { grupo_id, tarefa_id } = req.params

	try {
		const respostas = await pool.query("select * from usuario_de_grupo_responde where grupo_id = $1 and tarefa_id = $2",[grupo_id, tarefa_id]) 

		return res.status(200).send(respostas.rows)

	}
	catch(err) {
		return res.status(400).send(err)
	}
})


router.post('/make_avaliacao', async (req,res) => {
	const { grupo_id, tarefa_id, usuario_id, comentario, nota } = req.body
	try {
		const insert = await pool.query("INSERT INTO avaliacao (usuario_id, grupo_id, tarefa_id, comentario, nota) VALUES ($1, $2, $3, $4, $5)",[usuario_id, grupo_id, tarefa_id, comentario, nota])

		const { rows } = await pool.query("select avg(nota) from avaliacao where grupo_id = $1 and tarefa_id = $2 group by tarefa_id",[grupo_id, tarefa_id])
		
		const update = await pool.query("update resposta set nota = $1 where grupo_id = $2 and tarefa_id = $3",[rows[0].avg, grupo_id, tarefa_id])

		return res.status(200).send("ok")
	}
	catch(err) {
		console.log(err)
		return res.status(400).send("Deu ruim, ó")
	}
})


router.post('/tarefas_avaliaveis', async (req,res) => {
	const { usuario_id } = req.body

	try {
		const idioma = await pool.query("select idioma from usuario u inner join (usuario_em_grupo ug natural join grupo g) on ug.usuario_id = u.usuario_id where u.usuario_id = $1",[usuario_id])

		const tarefas = await pool.query("select r.tarefa_id, t.title, r.nota, r.grupo_id, t.nivel, g.nome, g.idioma from resposta r inner join tarefa t on t.tarefa_id = r.tarefa_id inner join grupo g on g.grupo_id = r.grupo_id where g.idioma = $1 and r.isopen = false",[idioma.rows[0].idioma])
	
		return res.status(200).send(tarefas.rows)
	}
	catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})


module.exports = router
