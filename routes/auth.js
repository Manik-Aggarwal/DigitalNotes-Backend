const express = require('express');
const User = require('../models/user');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = "Manikisagudboi.";

// create a new user
router.post("/createuser", [
    body('name', 'Enter a valid name').isLength({min: 1}),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Enter a valid password').isLength({min: 5}),
] ,async (req, res) => {
    let success = false;
    // if errors return errors
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }

    try {
        //check if user exist with same email already
        let user = await User.findOne({email: req.body.email});
        if(user){
            return res.status(400).json({errors: 'User already exists with same email'});
        }
        //create a new user
        const salt = await bcrypt.genSalt(10);
        let secPass = await bcrypt.hash(req.body.password, salt);
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass
        })
        // .then(user=>res.json(user))

        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({success,authToken});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
})

//authenticate a user
router.post("/login", [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    // if errors return errors
    let success = false;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {email, password} = req.body;
    try {
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({error: 'Invalid credentials'});
        }
        
        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
            return res.status(400).json({error: 'Invalid credentials'});
        }

        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({success,authToken});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
})

// get logged in user details, token needs to send
router.post("/getuser", fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(userId);
        const user = await User.findById(userId).select("-password");
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal err');
    }
})
module.exports = router;