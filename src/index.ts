//expressおまじない
import express from 'express'

import bodyParser from 'body-parser'

// import fs from 'node:fs'
import sqlite from 'sqlite3'

const app: express.Express = express()
const port = 3000
app.use(bodyParser.json()) // 追加

// const initDataSql = fs.readFileSync('./sql/sampleData.sql').toString()
// const dummyDataSqls = fs
//   .readFileSync('./sql/sampleData.sql')
//   .toString()
//   .split(';')
//   .slice(0, -1)

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

  db.run(
    'CREATE TABLE IF NOT EXISTS close_table (userId TEXT PRIMARY KEY, close INTEGER NOT NULL);',
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

app.post('/close', (req: express.Request, res: express.Response) => {
  if (!req.body.id && typeof req.body.close !== 'number') {
    res.status(400).json({ message: 'No User ID' })
    return
  }

  if (!req.body.close && typeof req.body.close !== 'boolean') {
    res.status(400).json({ message: 'No User Close' })
    return
  }

  const id: number = req.body.id
  const close: boolean = req.body.close

  db.all('SELECT * FROM users WHERE userId = (?)', [id], (err, rows) => {
    if (err || rows.length < 1) {
      console.error(err)
      res.status(400).json({
        message: 'Invailed User ID',
      })
    }

    db.run(
      'INSERT INTO close_table (userId, close) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET close=excluded.close;',
      [id, close ? 1 : 0],
      (err) => {
        if (err) {
          console.error(err)
          res.status(500).json({ message: 'Failed to update close status' })
          return
        }
      },
    )
  })
  res.status(200).send()
  return
})

app.listen(port, () => {
  console.log(`ポート${port}番で起動しました。`)
})
