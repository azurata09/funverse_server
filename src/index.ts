import express from 'express'
import sqlite from 'sqlite3'

const app: express.Express = express()
const port = 3000

app.use(express.json())

const db = new sqlite.Database('./data/data.db', (err) => {
  if (err) {
    console.error(err)
    throw new Error('データベースが開けませんでした')
  }

  console.log('データベースが開かれました')

  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userID TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      grade TEXT,
      bio TEXT
    );`,
    (err) => {
      if (err) {
        console.error(err)
        throw new Error('usersテーブルの作成に失敗しました')
      }
      console.log('usersテーブルが作成されました')
    },
  )

  db.run(
    `CREATE TABLE IF NOT EXISTS sns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userID TEXT NOT NULL,
        anySNS TEXT,
        homepage TEXT,
        FOREIGN KEY (userID) REFERENCES users (userID)
      );`,
    (err) => {
      if (err) {
        console.error(err)
        throw new Error('snsテーブルの作成に失敗しました')
      }
      console.log('snsテーブルが作成されました')
    },
  )

  db.run(
    'CREATE TABLE IF NOT EXISTS close_table (userId TEXT PRIMARY KEY, close INTEGER NOT NULL);',
  )
})

app.get('/users/:userID', (req: express.Request, res: express.Response) => {
  const userID = req.params.userID

  //userID重複チェック
  db.get<{ userID: number; name: string; grade: string; bio: string }>(
    'SELECT * FROM users WHERE userID = ?',
    [userID],
    (err, row) => {
      if (err) {
        console.error('データベースエラー', err.message)
        return res
          .status(500)
          .send({ error: '内部サーバーエラーが発生しました' })
      }

      if (row) {
        // userIDが存在する
        return res.status(200).json({
          userID: row.userID,
          name: row.name,
          grade: row.grade,
          bio: row.bio,
        })
      }
      return res.status(404).send({ error: 'ユーザーが見つかりません' })
    },
  )
})

app.post('/users/:userID', (req: express.Request, res: express.Response) => {
  //"name"を取得
  const { name, grade, bio, sns } = req.body
  const userID = req.params.userID

  if (!name) {
    console.log(`${name}が必要です`)
    res.status(400).send({ error: 'nameが必要です' })
  }

  //userID重複チェック
  db.get('SELECT * FROM users WHERE userID = ?', [userID], (err, row) => {
    if (err) {
      console.error('データベースエラー', err.message)
      return res.status(500).send({ error: '内部サーバーエラーが発生しました' })
    }

    if (row) {
      //userIDが既に存在する
      console.error('ユーザーIDが既に存在する')
      return res.status(409).send({ erroe: 'このユーザーIDは既に存在します' })
    }

    //データベースにusers情報追加
    db.run(
      'INSERT INTO users (userID, name, grade, bio) VALUES (?,?,?,?);',
      [req.params.userID, name, grade || null, bio || null],
      (err) => {
        if (err) {
          console.error('ユーザー情報エラー:', err.message)
          return res.status(500).send('ユーザー情報の挿入に失敗しました')
        }

        //sns情報追加
        if (sns) {
          const { anySNS, homepage } = sns
          db.run(
            'INSERT INTO sns(userID, anySNS, homepage) VALUES(?,?,?);',
            [req.params.userID, anySNS || null, homepage || null],
            (err) => {
              if (err) {
                console.error('SNS挿入エラー:', err.message)
                return res
                  .status(500)
                  .send({ error: 'SNS情報の挿入に失敗しました' })
              }
              console.log('ユーザー情報が作成された(sns含)')
              res.status(201).json({
                message: 'ユーザー情報が作成されました',
                userID: req.params.userID,
                name,
                grade,
                bio,
                sns,
              })
            },
          )
        } else {
          console.log('ユーザー情報が作成された(sns含不)')
          res.status(201).json({
            message: 'ユーザー情報が作成されました',
            userID: req.params.userID,
            name,
            grade,
            bio,
          })
        }
      },
    )
  })
})

//ユーザー情報更新
app.put('/users/:userID', (req: express.Request, res: express.Response) => {
  //"name"を取得
  const { name, grade, bio, sns } = req.body
  const userID = req.params.userID

  if (!name) {
    console.log(`${name}が必要です`)
    res.status(400).send({ error: 'nameが必要です' })
  }

  //userID存在チェック
  db.get('SELECT * FROM users WHERE userID = ?', [userID], (err, row) => {
    if (err) {
      console.error('データベースエラー', err.message)
      return res.status(500).send({ error: '内部サーバーエラーが発生しました' })
    }
  })
  db.serialize(() => {
    //データベースのusers情報更新
    db.run(
      'UPDATE users SET name = ?, grade = ?, bio = ? WHERE userID = ?;',
      [name, grade || null, bio || null, userID],
      (err) => {
        if (err) {
          console.error('ユーザー更新エラー:', err.message)
          return res.status(500).send('ユーザー情報の更新に失敗しました')
        }

        //sns情報追加
        if (sns) {
          const { anySNS, homepage } = sns
          db.run(
            'UPDATE sns SET anySNS = ?, homepage = ? WHERE userID = ?;',
            [anySNS || null, homepage || null, userID],
            (err) => {
              if (err) {
                console.error('SNS更新エラー:', err.message)
                return res
                  .status(500)
                  .send({ error: 'SNS情報の更新に失敗しました' })
              }

              console.log('ユーザー情報が更新された(sns含)')
              res.status(201).json({
                message: 'ユーザー情報が更新されました',
                userID: req.params.userID,
                name,
                grade,
                bio,
                sns,
              })
            },
          )
        } else {
          console.log('ユーザー情報が更新された(sns含不)')
          res.status(201).json({
            message: 'ユーザー更新が作成されました',
            userID: req.params.userID,
            name,
            grade,
            bio,
          })
        }
      },
    )
  })
})

app.post('/discover', (req: express.Request, res: express.Response) => {
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
