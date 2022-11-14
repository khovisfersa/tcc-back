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
const base = path.join(__dirname, '..', 'fileSystem','tmp')

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
		console.log("veio pra ca")
		var user_id = req.body.user_id
		var grupo_id = req.body.grupo_id
		var tarefa_id = req.body.tarefa_id
		var identificador = req.body.identificador
		var text = req.body.text | null
		
		var filename = req.body.filename
		const  blob = new Blob(req.body.file, {
			type: 'audio/mp3'
		})

		let form = new formidable.IncomingForm();

		console.log("coisou")
		form.parse(req, (error, fields, file) => {
			let file_path = file.file.filepath
			let new_path = path.join(base, fields.filename + '.mp3')
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

					const new_entry = await pool.query("INSERT INTO usuario_de_grupo_responde (usuario_id, grupo_id, tarefa_id, identificador, nota, text) VALUES ($1, $2, $3, $4, $5, $6)",[usuario_id, grupo_id, tarefa_id, identificador, null, null])

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

		console.log("make_resposta")

		return res.status(200).send(true)

	} catch (err) {
		return res.status(400).send(err)
	}
})



// router.post('/rate_resposta', async ( req,res ) => {
// 	try {
// 		const {  }
// 	} catch(err) {

// 	}
// })


// router.post('/upload_audio', async (req,res) => {
// 	try {
// 		console.log("veio pra ca")
		
// 		var filename = req.body.filename || "teste"
// 		console.log("req.body: ")
// 		console.log("req.filename: " + req.filename)
// 		console.log("////////////////////////////")

// 		console.log("file name: " + filename)

// 		var file_path = base + filename + ".mp3"



// 		const  blob = new Blob(req.body.file, {
// 			type: 'audio/mp3'
// 		})

// 		fs.createWriteStream(file_path).write(JSON.stringify(blob))

// 		// const buffer = Buffer.from( await blob.arrayBuffer() )
// 		// fs.writeFile(base + 'tmp/' + filename + '.mp3', buffer, () => console.log('audio saved!') );
// 		return res.status(200).send("file created successfully")
// 	} catch(err) {
// 		console.log(err)
// 		return res.status(400).send(err)
// 	}
// })

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

	}
})

// router.get('/audio_by_resposta', (req,res) => {})

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

// router.get('/get_respostas/:grupo_id/:tarefa_id', (req,res) => {
// 	const {grupo_id, tarefa_id } = req.params
// 	try {
// 		const tipo = await pool.query("SELECT tipo FROM tarefa WHERE tarefa_id = $1",[tarefa_id])

// 		const resposta = await pool.query("SELECt * FROM resposta WHERE grupo_id = $1 and isopen = false ",[grupo_id])


// 		// if(tipo.rows[0].tipo == 'audio') {
// 		// 	const idents = []
// 		// 	idents.push()	
// 		// }

// 		if(tipo.rows[0].tipo == 'audio') {
			
// 		}

// 		else if (tipo.rows[0].tipo == 'texto'){
// 			const idents = await pool.query("SELECT identificador, text, usuario_id FROM usuario_de_grupo_responde WHERE grupo_id = $1 AND tarefa_id = $2",[grupo_id, tarefa_id])

// 		}

// 		return res.status(200).send({resposta: resposta, idents: idents})		
// 	}
// 	catch(err) {
// 		console.log(err)
// 		return res.status(400).send(err)
// 	}
// })

module.exports = router
