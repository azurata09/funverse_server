//expressおまじない
import express from 'express'
const app: express.Express = express()

//
app.get("/user", (req:express.Request, res:express.Response)=>{
  res.json({
    "name": "azurata",
    "grade": "4",
    "bio": "あああああああああああああああああああああああ",
    "sns": {
      "x": "@azurata09_",
      "facebook": "sotaronaka09",
      "homepage": "https://www.azurata.me/"
    }
  }
)
})

app.listen(3000,()=>{
  console.log('ポート3000番で起動しました。')
})
