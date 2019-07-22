const express = require('express')
const router = new express.Router()
const task = require('../models/task')
const auth = require('../middleware/auth')


router.post('/tasks', auth ,async (req,res) => {
    // const newtask = new task(req.body)
    const newtask = new task ({
        ...req.body,
        owner: req.user._id
    })
    try{
        await newtask.save()
        res.status(201).send(newtask)
    }catch(e){
        res.status(404).send(e)
    }
})

router.get('/tasks', auth , async (req,res) => {

    const match = {}
    const sort = {}
    
    if(req.query.status)
    {
        match.status = req.query.status === 'true'
    }   

    if(req.query.sortBy)
    {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'asc'? 1:-1
    }
    try{
       await req.user.populate({
           path:'tasks',
           match,
           options:{
               limit:parseInt(req.query.limit),
               skip:parseInt(req.query.skip),
               sort
           }
    }).execPopulate()
        res.send(req.user.tasks)
    }catch(e) {
        res.status(500).send(e)
    }

})

router.get('/tasks/:id', auth,async (req,res) => {
    const _id = req.params.id 

    try{
        const Task = await task.findOne({ _id , owner : req.user._id})
        if(!Task)
        {
            return res.status(404).send()
        }
        res.send(Task)
    }catch(e){
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id', auth ,async (req,res) => {

    const updates = Object.keys(req.body)
    const allowedupdates = ['description' , 'status']
    const check = updates.every((update) => allowedupdates.includes(update))

    if(!check)
    {
        return res.status(400).send({error:'Invalid opertion'})
    }
    try{
        const taskupd = await task.findById({ _id :req.params.id , owner: req.user._id})
      
        if(!taskupd)
        {
            return res.send(404).send()
        }
        updates.forEach((update) => taskupd[update] = req.body[update])
        await taskupd.save()

        res.send(taskupd)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth ,async (req,res) => {
    try{
        const taskdel = await task.findOneAndDelete({ _id :req.params.id , owner: req.user._id})
        if(!taskdel){
            return res.status(404).send()
        }
        res.send(taskdel)
    }catch(e)
    {
        res.status(404).send(e)
    }
})

module.exports = router