import express from 'express';
import userModel from './userModel.js'
import generateToken from '../middleware/generateToken.js'
// import verifyToken from '../middleware/verifyToken.js'
const router = express.Router();

//register end point
router.post('/register', async (req, res) => {
    try {
        const {username, email, password} = req.body;
        const user = new userModel({username, email, password});
        await user.save();
        res.status(201).send({message: 'user registered successfully'});
    } catch (error) {
        console.log('error registering user', error)
        res.status(500).send({message: 'error occured while registering user'})
    }
})

//login user end point
router.post('/login', async(req, res)=>{
    const {email, password} = req.body;
    try {
            const user = await userModel.findOne({email});
            if(!user){
                return res.status(404).send({message: 'user not found'})
            }
            const isMatch = await user.comparePassword(password);
            if(!isMatch){
                return res.status(401).send({message: 'Password does not match'})
            }
            const token = await generateToken(user._id);
            res.cookie('token', token, {
                httpOnly: true,
                sameSite: 'None',
                secure: true})
            res.status(200).send({message: 'user Logged in successfully', token, user:{
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                profileImage: user.profileImage,
                bio: user.bio,
                profession: user.profession
            }})
        
    } catch (error) {
        console.log('error logged in user', error)
        res.status(500).send({message: 'error occured while logging user'})
    }
})

//logout user end point
router.post('/logout', async(req, res) =>{
    res.clearCookie('token');
    res.status(200).send({message: 'user logged out successfully'})
})

//delete a user end point
router.delete('/users/:id', async(req, res) =>{
    try {
        const {id} = req.params;
        const user = await userModel.findByIdAndDelete(id);
        if(!user){
            return res.status(404).send({message: 'user not found'})
        }
        res.status(200).send({message: 'user deleted successfully'})
        
    } catch (error) {
           console.error('error deleting user', error);
           res.status(500).send({message: 'error occured while deleting user'})
    }
})

// get all users
router.get('/users', async(req, res) =>{
    try {
        const users = await userModel.find({}, 'id email role').sort({createdAt: -1});
        res.status(200).send(users)
    } catch (error) {
        console.error('error fetching user', error);
        res.status(500).send({message: 'error occured while fetching user'})
    }
})

// update user role
router.put('/users/:id', async(req, res)=>{
   try {
    const {id} = req.params;
    const {role} = req.body;
    const user = await userModel.findByIdAndUpdate(id, {role}, {new: true})
    if(!user){
        return res.status(404).send({message: 'user not found'})
    }
    res.status(200).send({message: 'User role updated successfully', user})
   } catch (error) {
    console.error('error updating user role', error);
    res.status(500).send({message: 'error occured while updating user role'})
   }
})

//update or edit profile
router.patch('/edit-profile', async(req, res) =>{
    try {
        const {userId, username, profileImage, bio , profession } = req.body;
        if(!userId){
            return res.status(400).send({message: 'User ID is required'})
        }
        const user = await userModel.findById(userId);
        if(!user){
            return res.status(404).send({message: 'User not found'})
        }
        // update user profile
        if( username !== undefined) user.username = username;
        if( profileImage !== undefined) user.profileImage = profileImage;
        if( bio !== undefined) user.bio = bio;
        if( profession !== undefined) user.profession = profession;
        await user.save();
        res.status(200).send({
        message: 'User profile updated successfully',
        user:  {    
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        profession: user.profession
    }
    })

    } catch (error) {
        console.error('error updating user profile', error);
        res.status(500).send({message: 'error occured while updating user profile'})
    }
    })


export default router;