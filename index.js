require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

morgan.token('content', (req) => {
  if (req.method === 'POST'|| req.method==='PUT') {
    return JSON.stringify(req.body)
  }
  return ''
})

app.use(cors())
app.use(express.json())
app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms :content'
  )
)
app.use(express.static('build'))

app.get('/info', (request, response, next) => {
  Person.count({})
    .then((count) => {
      response.send(
        `Phonebook has info for ${count} people <br> ${new Date()}`
      )
    })
    .catch((error) => next(error))
})

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then((persons) => {
      response.json(persons)
    })
    .catch((error) => {
      next(error)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findById(id)
    .then((person) => {
      response.json(person)
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  const person = request.body

  Person.findByIdAndUpdate(id, person, { new: true, runValidators: true })
    .then((person) => {
      if (person) {
        return response.json(person)
      }
      return response.status(400).json({ error: 'person does not exist' })
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findByIdAndRemove(id)
    .then(() => {
      response.status(204).end()
    })
    .catch((error) => next(error))
})

app.post('/api/persons', async (request, response, next) => {
  const person = request.body

  const persons = await Person.find({ name:{ '$regex' : `^${request.body.name}$`, '$options' : 'i' } }).exec()

  if(persons.length>=1){
    return response.status(400).json({ error:'person with this name already exist' })
  }

  const newPerson = new Person(person)
  newPerson
    .save()
    .then((person) => {
      response.json(person)
    })
    .catch((error) => {
      next(error)
    })
})

const errorHandler = (error, request, response, next) => {
  console.error('this is the errro', error.name)

  if (error.name === 'CastError') {
    return response.status(400).json({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
