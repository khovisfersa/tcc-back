const jwt = require("jsonwebtoken")
const config = process.env

const verifyAdmin = (req,res,next) => {
	const token = req.body.token || req.query.token || req.headers["x-access-token"];

	if(!token) {
		return res.status(403).send("Uma token é necessária para autenticação")
	}

	try {
		const decoded = jwt.verify(token, config.TOKEN_KEY);
		req.user = decoded
		if(!decoded.isAdmin) {
			return res.status(401).send("Usuário sem permissão para a operação")
		}
	} catch(err) {
		console.log(err)
		return res.status(401).send("Token inválida")
	}

	return next();
};

module.exports = verifyAdmin