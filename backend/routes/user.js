const express = require('express');

const router = express.Router();
const zod = require('zod');
const { User } = require('../db');
const {authMiddleware} = require('../middleware');
const { JWT_SECRET } = require('../config');
const jwt = require('jsonwebtoken');

const signupSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
    firstname: zod.string(),
    lastname: zod.string(),
});

router.post('/signup', async (req, res) => {
    const body = req.body;
    const {success} = signupSchema.safeParse(body);
    if(!success){
        return res.json({
            message: "Email Already taken / Incorrect inputs"
        })
    }
    const user = await User.findOne({
        username: body.username
    });
    if(user._id){
        return res.json({
            message: "Email Already taken / Incorrect inputs"
        })
    }
    const newUser = await User.create({
        username: body.username,
        password: body.password,
        firstname: body.firstname,
        lastname: body.lastname,
    });

    const userId = newUser._id;
    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        message: "User Created Successfully",
        token: token,
    });  
})

const loginSchema = zod.object({
    username: zod.string().email(),
    password: zod.string(),
});

router.post('/signin', async (req, res) => {
    const body = req.body;
    const {success} = loginSchema.safeParse(body);
    if(!success){
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }
    const user = await User.findOne({
        username: body.username,
        password: body.password,
    });
    if(!user){
        return res.status(401).json({
            message: "Incorrect username or password"
        })
    }
    const userId = user._id;
    const token = jwt.sign({
        userId
    }, JWT_SECRET);
})

const updateSchema = zod.object({
    firstname: zod.string(),
    lastname: zod.string(),
    password: zod.string(),
});

router.put('/', authMiddleware, async (req, res) => {
    const body = req.body;
    const {success} = updateSchema.safeParse(body);
    if(!success){
        return res.status(411).json({
            message: "Error in inputs"
        })
    }
    await User.updateOne(body, {
        id: req.userId
    });
    res.json({
        message: "User Updated Successfully"
    });

    const user = await User.findById(req.userId);
    if(!user){
        return res.status(401).json({
            message: "User not found"
        })
    }
    user.firstname = body.firstname;
    user.lastname = body.lastname;
    user.password = body.password;
    await user.save();
    res.json({
        message: "User Updated Successfully"
    });
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})
module.exports = router;