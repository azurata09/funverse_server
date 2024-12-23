//expressおまじない
import express from 'express'

import fs from 'node:fs'
import sqlite from 'sqlite3'

const app: express.Express = express()
const port = 3000

const initDataSql = fs.readFileSync('./sql/sampleData.sql').toString()
const dummyDataSqls = fs
  .readFileSync('./sql/sampleData.sql')
  .toString()
  .split(';')
  .slice(0, -1)

const db = new sqlite.Database('./data/data.db', (err) => {
  if (err) {
    console.error(err)
    throw Error('データベースが開けませんでした')
  }
  console.log('データベースが開かれました')

  db.run(
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, userID TEXT NOT NULL);',
    (err) => {
      if (err) {
        console.error(err)
        throw Error('テーブルの作成に失敗しました')
      }
      console.log('テーブルが作成されました')
    },
  )
})

app.get('/user/:userID', (req: express.Request, res: express.Response) => {
  //res.send("こんにち");
  res.json({
    userID: req.params.userID,
    name: 'azurata',
    grade: '4',
    bio: 'あいうえお',
    sns: {
      x: '@azurata09_',
      facebook: 'sotaronaka09',
      homepage: 'https://www.azurata.me/',
    },
  })

  db.run(
    'INSERT INTO users (userID) Values (?);',
    [req.params.userID],
    (err) => {
      if (err) {
        console.error(err)
        throw Error('データの挿入に失敗しました')
      }
      console.log('データが挿入されました')
    },
  )
})

app.listen(port, () => {
  console.log(`ポート${port}番で起動しました。`)
})
