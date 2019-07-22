const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email,name) => {
    sgMail.send({
        to:email,
        from:'bhumiksoni009@gmail.com',
        subject:'Welcome',
        text:'Hi there ' + name + '!. Welcome to the task manager app.'
    })
}

const sendDeleteEmail = (email,name) => {
    sgMail.send({
        to:email,
        from:'bhumiksoni009@gmail.com',
        subject:'Goodbye',
        text:'Hi ' + name + '!. Thank you for using the application. Tell us what we can do to make the app better.'
    })
}

module.exports = {
    sendWelcomeEmail,
    sendDeleteEmail
}



