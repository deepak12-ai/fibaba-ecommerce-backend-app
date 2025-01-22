import jwt from 'jsonwebtoken'

const verifyToken = (req, res, next) => {
    try {
        const JWT_SECRET = process.env.JWT_SECRET_KEY;
        const token = req.cookies.token;
        //const token = req.headers['authorization'].split(" ")[1];
        if(!token){
            return res.status(401).send({message: 'invalid token'})
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if(!decoded){
            return res.status(401).send({message: 'invalid token or token not found'})
        }
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();      
    } catch (error) {
            console.error('error while verifying token', error);
            res.status(401).send({message: 'Error while verifying token'})
    }
}

export default verifyToken;