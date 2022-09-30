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
		
		var filename = req.body.filename
		console.log("req.body: ")
		console.log("req.filename: " + req.filename)
		console.log("////////////////////////////")

		console.log("file name: " + filename)
		const  blob = new Blob(req.body.file, {
			type: 'audio/mp3'
		})

		const buffer = Buffer.from( await blob.arrayBuffer() )
		fs.writeFile(base + 'tmp/' + filename + '.mp3', buffer, () => console.log('audio saved!') );
		return res.status(200).send("file created successfully")
	} catch(err) {
		console.log(err)
		return res.status(400).send(err)
	}
})


router.get('/audio',(req,res) => {
	console.log("respostas")
    const range = req.headers.range;
    const videoPath = base + "tmp/3-1-1.mp3"
    const videoSize = fs.statSync(videoPath).size;
    const chunkSize = 1*1e6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, videoSize-1);
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

module.exports = router
