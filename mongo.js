const mongoose = require('mongoose')
if (process.argv.length<3) {
  console.log('give password as argument')
  process.exit(1)
}
const password = process.argv[2]
const nameAux = process.argv[3]
const numberAux = process.argv[4]
const url =
  `mongodb+srv://tamarasquinones:${password}@cluster0.qynhttm.mongodb.net/agendaApp?retryWrites=true&w=majority`
mongoose.set('strictQuery',false)
mongoose.connect(url)
const agendaSchema = new mongoose.Schema({
  name: String,
  number: String,
})
const Person = mongoose.model('Person', agendaSchema)
const person = new Person({
  name: nameAux,
  number: numberAux,
})
/* person.save().then(result => {
  console.log('person saved!')
  mongoose.connection.close()
}) */
Person.find({}).then(result => {
    result.forEach(p => {
      console.log(p)
    })
    mongoose.connection.close()
})