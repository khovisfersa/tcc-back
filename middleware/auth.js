const jwt = require("jsonwebtoken")
const config = process.env

const verifyToken = (req,res,next) => {
	console.log(req.headers)
	const token = req.body.token || req.query.token || req.headers["x-access-token"];
	console.log("header-token: " + req.headers["x-access-token"])

	if(!token) {
		return res.status(403).send("Uma token é necessária para autenticação")
	}

	try {
		const decoded = jwt.verify(token, config.TOKEN_KEY);
		req.user = decoded
		console.log("decoded")
		console.log(req.user)
	} catch(err) {
		return res.status(401).send("Token inválida")
	}

	return next();
};

module.exports = verifyToken