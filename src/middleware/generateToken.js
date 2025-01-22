import jwt from 'jsonwebtoken'  
import userModel from '../users/userModel.js'



const generateToken = async (userId) => {
       
    try {
        const JWT_SECRET = process.env.JWT_SECRET_KEY
        const user = await userModel.findById(userId);
        if(!user){
           throw new Error('user not found')
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
            expiresIn: "1h",
        });
        return token;
    } catch (error) {
        
    }
}

export default generateToken;
