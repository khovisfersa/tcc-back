const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const fs = require('fs')
require('dotenv').config()
const process = require('process');
let formidable = require('formidable');
const cors = require('cors');
const {  Blob } = require( 'buffer')


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


const base = '/home/admin/tcc/fileSystem/'

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


router.post('/upload_audio', async (req,res) => {
	try {
		console.log("veio pra ca")
		console.log(req.header)
		
		var filename = req.body.filename
		console.log(req.body)
		const  blob = new Blob(req.body.file, {
			type: 'audio/mp3'
		})

		const buffer = Buffer.from( await blob.arrayBuffer() )
		fs.writeFile(base + 'tmp/prikith.mp3', buffer, () => console.log('audio saved!') );
		return res.status(200).send("file created successfully")
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})


router.get('/audio', (req,res) => {
	const range = req.header.range
	const video_path = base + '/tmp/Google drive API javascript'
})

module.exports = router
