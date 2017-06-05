fs = require 'fs'
csvParse = require 'csv-parse'
async = require 'async'

console.log "Converting family..."
CSV_FILE = 'data/actions.csv'

getCards = (callback) ->
  fs.readFile CSV_FILE, 'utf-8', (err, data) ->
    console.log "Loaded csv data..."
    csvParse data, {delimiter: ','}, (err, result) ->
      cards = getCardsFromActions(result)
      callback null, cards

getCardsFromActions = (data) ->
  console.log data
  cardIds = {}
  for row in data
    cardIds[row[row.length-4]] = 1

  return Object.keys(cardIds)

writeFile = (file, data) ->
  fs.writeFile(file, data, (err) ->
    if err
      return console.log err
    else
      console.log "Done."
  )

async.series([
  getCards
  ],
  (err, result) ->
    console.log result
    output = result
    writeFile('data/cards.json', JSON.stringify(output))
)
console.log "Complete!"
