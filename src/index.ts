//expressとsqlite使うよ
import express from 'express'
import sqlite from 'sqlite3'

//appでexpress使用
const app: express.Express = express()
//port指定
const port = 2000

// ExpressのJSONボディパーサーを設定
app.use(express.json())


/*sqlite(データベース)処理*/
const db = new sqlite.Database('./data/data.db', (err) => {
  //データベースを開く
  //エラー
  if (err) {
    console.error(err)
    throw new Error('データベースが開けませんでした')
  }
  //成功
  console.log('データベースが開かれました')

  //テーブルが存在しなければ作成する(nameについて)
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userID TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      grade TEXT,
      bio TEXT
    );`,
      (err) => {
        //エラー
        if (err) {
          console.error(err)
          throw new Error('usersテーブルの作成に失敗しました')
        }
    //成功
        console.log('usersテーブルが作成されました')
      }
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
        //エラー
        if (err) {
          console.error(err)
          throw new Error('snsテーブルの作成に失敗しました')
        }
      //成功
        console.log('snsテーブルが作成されました')
      }
    )
})


/*POST*/
//Post /users/:userIDのエンドポイント
app.post("/users/:userID", (req: express.Request, res: express.Response) => {
  //"name"を取得
  const {name, grade, bio, sns} = req.body;
  const userID = req.params.userID

  if(!name){
    console.log(`${name}が必要です`)
    res.status(400).send({error: 'nameが必要です'});
  }

  //userID重複チェック
  db.get(
    `SELECT * FROM users WHERE userID = ?`,
    [userID],(err,row) =>{
      if(err){
        console.error(`データベースエラー`,err.message);
        return res.status(500).send({ error: '内部サーバーエラーが発生しました' });
      }

      if(row){
        //userIDが既に存在する
        console.error(`ユーザーIDが既に存在する`);
        return res.status(409).send({erroe:`このユーザーIDは既に存在します`})
      }

    //データベースにusers情報追加
    db.run(
      'INSERT INTO users (userID, name, grade, bio) VALUES (?,?,?,?);',
      [req.params.userID, name, grade || null, bio || null],
      function (err) {
        if (err) {
          console.error('ユーザー情報エラー:', err.message);
          return res.status(500).send(
          'ユーザー情報の挿入に失敗しました'
          )
        }

        //sns情報追加
        if(sns){
          const{anySNS, homepage} = sns;
          db.run(
            `INSERT INTO sns(userID, anySNS, homepage) VALUES(?,?,?);`,
            [req.params.userID, anySNS || null, homepage ||null],
            function(err){
              if(err){
                console.error(`SNS挿入エラー:`,err.message);
                return res.status(500).send({error:`SNS情報の挿入に失敗しました`})
              }
              console.log(`ユーザー情報が作成された(sns含)`)
              res.status(201).json({
                message:`ユーザー情報が作成されました`,
                userID:req.params.userID,
                name,
                grade,
                bio,
                sns,
              })
            }
          )
        } else {
          console.log(`ユーザー情報が作成された(sns含不)`)
          res.status(201).json({
            message:`ユーザー情報が作成されました`,
            userID:req.params.userID,
            name,
            grade,
            bio,
          })
        }
      }
    )
  })
})

//ユーザー情報更新
app.put("/users/:userID", (req: express.Request, res: express.Response) => {
  //"name"を取得
  const {name, grade, bio, sns} = req.body;
  const userID = req.params.userID

  if(!name){
    console.log(`${name}が必要です`)
    res.status(400).send({error: 'nameが必要です'});
  }

  //userID存在チェック
  db.get(
    `SELECT * FROM users WHERE userID = ?`,
    [userID],(err,row) =>{
      if(err){
        console.error(`データベースエラー`,err.message);
        return res.status(500).send({ error: '内部サーバーエラーが発生しました' });
      }
    }
  )
  db.serialize(() => {
  //データベースのusers情報更新
    db.run(
      'UPDATE users SET name = ?, grade = ?, bio = ? WHERE userID = ?;',
      [name, grade || null, bio || null, userID],
      function (err) {
        if (err) {
          console.error('ユーザー更新エラー:', err.message)
          return res.status(500).send(
          'ユーザー情報の更新に失敗しました'
          )
        }

        //sns情報追加
        if(sns){
          const{anySNS, homepage} = sns;
          db.run(
            `UPDATE sns SET anySNS = ?, homepage = ? WHERE userID = ?;`,
            [anySNS || null, homepage || null, userID],
            function(err){
              if(err){
                console.error(`SNS更新エラー:`,err.message);
                return res.status(500).send({error:`SNS情報の更新に失敗しました`})
              }

              console.log(`ユーザー情報が更新された(sns含)`)
              res.status(201).json({
                message:`ユーザー情報が更新されました`,
                userID:req.params.userID,
                name,
                grade,
                bio,
                sns,
              })
            }
          )
        } else {
          console.log(`ユーザー情報が更新された(sns含不)`)
          res.status(201).json({
            message:`ユーザー更新が作成されました`,
            userID:req.params.userID,
            name,
            grade,
            bio,
          })
        }
      }
    )
  })
})

app.listen(port, () => {
  console.log('ポート' + port + '番で起動しました。')
})