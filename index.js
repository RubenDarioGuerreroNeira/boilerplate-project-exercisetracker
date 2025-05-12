const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
// middleware para obtener los datos del body 
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const users = []
const exercises = []

// aqui inserto el formulario que esta en index 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  // crea usuario con id unico
  const newUser = {
    username: username,
    _id: Date.now().toString()
  }
  users.push(newUser)
  res.json({
    username: newUser.username,
    _id: newUser._id
  })
})

app.get("/api/users", (req, res) => {
  const formattedUsers = users.map(user => ({
    username: user.username,
    _id: user._id
  }))
  res.json(formattedUsers)
})

app.post("/api/users/:_id/exercises", (req, res) => {
  const { description, duration } = req.body
  let { date } = req.body
  const userId = req.params._id

  // validaciones
  if (!description) return res.status(400).json({ error: "Description is required" })
  if (!duration) return res.status(400).json({ error: "Duration is required" })
  if (isNaN(Number(duration))) return res.status(400).json({ error: "Duration must be a number" })

  // busco usuario
  const user = users.find(user => user._id === userId)
  if (!user) return res.status(400).json({ error: "User not found" })

  // manejo de fecha
  let dateObj;
  if (!date) {
    dateObj = new Date();
  } else {
    dateObj = new Date(date);
    if (dateObj.toString() === "Invalid Date") {
      dateObj = new Date();
    }
  }

  // crear y guardar ejercicio
  const exercise = {
    userId,
    description,
    duration: Number(duration),
    date: dateObj
  }

  exercises.push(exercise)

  // devolver respuesta con formato requerido
  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  // buscar usuario
  const user = users.find(u => u._id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // filtrar ejercicios por usuario
  let userExercises = exercises.filter(e => e.userId === userId);

  // filtrar por fecha (from)
  if (from) {
    const fromDate = new Date(from);
    if (fromDate.toString() !== "Invalid Date") {
      userExercises = userExercises.filter(e => e.date >= fromDate);
    }
  }

  // filtrar por fecha (to)
  if (to) {
    const toDate = new Date(to);
    if (toDate.toString() !== "Invalid Date") {
      userExercises = userExercises.filter(e => e.date <= toDate);
    }
  }

  // aplicar límite
  if (limit && !isNaN(Number(limit))) {
    userExercises = userExercises.slice(0, Number(limit));
  }

  // formatear ejercicios para la respuesta
  const formattedExercises = userExercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));

  // devolver respuesta con formato requerido
  res.json({
    username: user.username,
    count: formattedExercises.length,
    _id: user._id,
    log: formattedExercises
  });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})