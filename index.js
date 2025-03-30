const express = require('express')
const app = express()

app.use(express.json())

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(requestLogger)

let persons = [
    { 
      "id": 1,
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": 2,
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": 3,
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": 4,
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]
  
app.get('/', (request, response) => {
    response.send('<h1>App personas</h1>')
  })
  
  app.get('/api/persons', (request, response) => {
    response.json(persons)
  })

  app.get('/info', (request, response) => {
    const cantidad = persons.length
    const fecha = new Date()
    response.send(`<h1>Tenemos agendadas ${cantidad} personas</h1><h2>${fecha}</h2>`)
  })


  app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    console.log(id)
    const person = persons.find(p => p.id === id)
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  })

  app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(p => p.id !== id)
  
    response.status(204).end()
  })

app.post('/api/persons', (request, response) => {
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
})


const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

