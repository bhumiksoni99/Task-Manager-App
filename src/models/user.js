const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({ 
    name :{
        type:String,
        required :true,
        trim : true
}, age: {
    type:Number,
    default:0
},password :{
    type:String,
    required: true,
    trim:true,
    minlength:7,
    validate(value) {
        if(value.toLowerCase().includes('password')) {
            throw new Error('Cannot contain the word password')
        }
    }
},email: {
    type:String,
    unique:true,
    required:true,
    trim:true,
    validate(value) {
        if(!validator.isEmail(value)) {
           throw new Error('Enter a valid Email address')
        }
    }
}, tokens:[{
    token:{
        type:String,
        required:true
    }
}],avatar: {
    type:Buffer
}

},{
    timestamps:true
})

userSchema.virtual('tasks' ,{
    ref:'Tasks',
    localField: '_id',
    foreignField :'owner'
})  

userSchema.methods.toJSON = function () {
    const user = this

    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({_id : user._id.toString()} , process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token})
    await user.save()

    return token
}
userSchema.statics.findByCredentials = async (email, password) => {
    const User = await user.findOne({email})
    
    if(!User){
        throw new Error('Unable to login')
    }
    
    const isMatch = await bcrypt.compare(password,User.password)

    if(!isMatch) {
        throw new Error('Unable to login')
    }
    return User
}

//Hash the plain text password before saving
userSchema.pre('save' , async function (next) {
    const user = this

    if(user.isModified('password')){
        
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

const user = mongoose.model('User' ,userSchema)

module.exports = user
