const express = require('express')
const cors = require('cors')
const PORT = 5000
const http = require('http')
const {Server} = require('socket.io')
const app = express()
const route = require('./route')

app.use(cors({ origin: "*" }))
app.use(route)

const server = http.createServer(app)

const io = new Server(server, {
    cors:{
        origin: "*",
        methods: ["GET","POST"],
    },
})

let users = []
let currUser = null

const addUser = (username, room) =>{
    const userObj = {username: username, room: room}
    const isExists = users.find(item=> username==item.username && room==item.room)
    if(!isExists) users.push(userObj)
    currUser = isExists || userObj
    return {isUserExists: !!isExists, user: currUser}
}

io.on('connection',(socket)=>{
    socket.on('join',({ room, username })=>{
        socket.join(room)       
        const isExists = users.find(item=> username==item.username && room==item.room)
        const {user} = addUser(username, room)        
        const msg = isExists ? `Вы вернулись в чат ${user.room}!` : `Вы вошли в чат ${user.room}!`
        socket.emit('message',{
            username: user.username,
            message: msg
        })
        socket.broadcast.to(user.room).emit('message',{
            username: user.username,
            message: `Пользователь ${user.username} вошёл в чат.`
        })
        socket.emit('getUsers', users.filter(item => item.room == room))
    })
    
    socket.on('sendMessage',(msg, username, room)=>{
            socket.emit('message',{
                username: username,
                message: msg
            })
            socket.broadcast.to(room).emit('message',{
                username: username,
                message: msg
            })
        socket.emit('getUsers', users.filter(item => item.room == room))
    })
    socket.on('leaveChat',(username, room)=>{
        users = users.filter(item => item.username != username && item.room == room)
        socket.broadcast.to(room).emit('message',{
            username: username,
            message: "Пользователь вышел из чата."
        })
    })
    socket.on('disconnect',()=>{
        console.log('User disconnected')
    })
})

server.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`)
})