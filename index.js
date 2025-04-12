require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
app.use(express.json())
app.use(cors())
const Person = require('./models/agenda')
app.use(express.static('dist'))

  
app.get('/', (request, response) => {
    response.send('<h1>App personas</h1>')
  })
  
  /* app.get('/api/persons', (request, response) => {
    response.json(persons)
  }) */

  app.get('/api/persons', (request, response) => {
      Person.find({}).then(p => {
        response.json(p)
      })
  })

  app.get('/info', (request, response) => {
    const cantidad = persons.length
    const fecha = new Date()
    response.send(`<h1>Tenemos agendadas ${cantidad} personas</h1><h2>${fecha}</h2>`)
  })


  app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id).then(p => {
      if (p) {
        response.json(p)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => 
      next(error)
  )
  })

  app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
  })

/* app.post('/api/persons', (request, response) => {
  const body = request.body
  if (!body.name || !body.number) {
    return response.status(400).json({ 
      error: 'content missing' 
    })
  }
  //const espPerson = persons.find(p => p.name == body.name)
  const espPerson = persons.find(p => {
    console.log(`Comparando: ${p.name} con ${body.name}`);
    return p.name === body.name;
  })
  console.log('body name:',body.name)
  console.log('persona del find:', espPerson)
  if (espPerson) {
    console.log('entro a nombre encontrado')
    return response.status(400).json({ 
      error: 'name must be unique' 
    })
  }
  console.log('siguio despues del return')
  const generateId = () => {
    const maxId = persons.length > 0
          ? Math.max(...persons.map(n => n.id))
          : 0
    return maxId + 1
  }
  const person = {
    id: generateId(),
    name: body.name,
    number: body.number    
  }
  persons = persons.concat(person)
  response.json(person)
}) */
app.post('/api/persons', (request, response, next) => {
    const body = request.body
  
    /* if (body.name === undefined || body.number === undefined) {
      return response.status(400).json({ error: 'content missing' })
    } */
  
    const newPerson = new Person({
      name: body.name,
      number: body.number || false,
    })
  
    newPerson.save().then(p => {
      response.json(p)
    }).catch(error => next(error))
})  

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})  

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  console.log('******************Este error es: ******************');
  console.dir(error, { showHidden: true })
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

// este debe ser el último middleware cargado, ¡también todas las rutas deben ser registrada antes que esto!
app.use(errorHandler)

const PORT = process.env.PORT
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

