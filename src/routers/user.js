const express = require('express')
const router = new express.Router()
const sharp = require('sharp')
const user = require('../models/user')
const auth = require('../middleware/auth')
const task = require('../models/task')
const multer = require('multer')
const account = require('../emails/account')

router.post('/users', async (req,res) => {
    const newuser = new user(req.body)

//     newuser.save().then((result) => {
//         res.status(201).send(result)
//     }).catch((e) => {
//         res.status(400).send(e)
//     }) 
// })
    try {
    await newuser.save()
    account.sendWelcomeEmail(newuser.email, newuser.name)
    const Token = await newuser.generateAuthToken()
    res.status(201).send({user:newuser , token:Token})
    } catch(e){
        res.status(404).send(e)
    }
})

router.post('/users/login' , async (req,res) => {
    try{
    const User = await user.findByCredentials(req.body.email, req.body.password)
    const token = await User.generateAuthToken()
    res.send({user:User , token})
    } catch(e) {
        res.send(404).send()
    }
})
router.post('/users/logout' ,auth , async (req,res) => {
    try{
        req.user.tokens = req.user.tokens.filter((t) => {
            return t.token !== req.token
        })

        await req.user.save()
        res.send()
    }catch(e)
    {
        res.status(500).send()
    }
})

router.post('/users/logoutAll' , auth , async (req,res) =>{
   try{
       req.user.tokens = []
       await req.user.save()
       res.send()
   }catch(e)
   {
       res.status(500).send() 
   }
})
router.get('/users/me', auth , async (req,res) => {
    res.send(req.user)
})


router.patch('/users/me',auth, async (req,res) => {

    const updates = Object.keys(req.body)
    const allowedupdates = ['name' , 'age' , 'password', 'email']
    const check = updates.every((update) => allowedupdates.includes(update))

    if(!check)
    {
        return res.status(400).send({error:'Invalid opertion'})
    }
    try{
        //in the line below update takes value of all the objects one by one which you update 
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        // const taskupd = await task.findByIdAndUpdate(req.params.id , req.body,{new:true, runValidators:true})
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/users/me',auth , async (req,res) => {
    try{
        await task.deleteMany({ owner : req.user._id})

        await req.user.remove()
        account.sendDeleteEmail(req.user.email , req.user.name)
        res.send(req.user)
    }catch(e)
    {
        res.status(404).send(e)
    }
})

const upload = multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req,file,cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Pls upload an image.'))
        }
        cb(undefined,true)
    }
})

router.post('/users/me/avatar', auth , upload.single('avatar'), async (req,res) => {
    const buffer = await sharp(req.file.buffer).resize({width:300 , height: 300}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error , req, res , next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth , async (req,res) =>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar' , async (req,res) =>{
    try{
        const User = await user.findById(req.params.id)
        if(!User || !User.avatar){
            throw new Error()
        }
        res.set("Content-Type", "image/png")
        res.send(User.avatar)
    }catch(e) {
        res.status(404).send()
    }
})

module.exports = router