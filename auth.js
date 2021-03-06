require('dotenv').config()
const db = require('./db')
const jwt = require('jsonwebtoken')
const crptojs = require('crypto-json')

const authenticate = (req, res, next) => {
  const sqlUserAccess = db.miniQuery('.sql/users/userAccess.sql')
  const verUsername = db.miniQuery('.sql/users/isUser.sql')
  const verActiveUser = db.miniQuery('.sql/users/userStatus.sql')
  const updateLastLogin = db.miniQuery('.sql/users/updateLastLogin.sql')
  const id = crptojs.decrypt(req.body, process.env.SU_SEC_3SHA512, {
    algorithm: 'aes256',
    encoding: 'hex'
  })
  const ttoexp = '2h'

  db.foddb.any(verUsername, {username: id.un})
  .then((d) => {
    if (d.length === 0) { //! user
      res.status(404)
      .json({
        status: '404',
        message: 'That username is either unreal or inactive!'
      })
    } else { // isUser
      return db.foddb.any(verActiveUser, {username: d[0].username})
      .then((d) => {
        if (d[0].valid === 'active') { // isActive
          return db.foddb.any(sqlUserAccess, {username: id.un, password: id.ke})
          .then((d) => { // password matches
            if (d[0].hasAccess) {
              // create payload
              const payload = {
                ddpsEng: 'fastnetmon',
                clnt: req.ip,
                userid: d[0].administratorid,
                useruuid: d[0].uuid_administratorid,
                username: d[0].username,
                useralias: d[0].name,
                usrtype: d[0].kind,
                co: d[0].companyname
              }
              if (d[0].kind !== 'globaladmin') {
                payload.coid = d[0].coid
              }
              // sign payload with time to expire
              const token = jwt.sign(payload, process.env.SU_SEC, {
                expiresIn: ttoexp,
                algorithm: 'HS512',
                issuer: process.env.SU_ISSUER
              })
              delete payload.ddpsEng
              delete payload.userid
              delete payload.co
              // set payload time to expire
              payload.texp = ttoexp
              res.status(200)
              .json({
                type: 'auth',
                jwt: token,
                data: [{
                  type: 'users',
                  id: d[0].administratorid,
                  attributes: payload,
                  links: {
                    self: `/api/users/${d[0].administratorid}`
                  }
                }],
                status: '200',
                message: 'Awesome! Login successful!'
              })
              // update lastlogin time
              return db.foddb.any(updateLastLogin, {username: d[0].username}).then(d => d)
            } else {
              res.status(401)
              .json({
                status: '401',
                message: 'You might want to check that password again!'
              })
            }
          })
          .catch((err) => {
            return next(err.message)
          })
        } else {
          res.status(401)
          .json({
            status: '401',
            message: 'Inactive user! Can not log in.'
          })
        }
      })
      .catch((err) => {
        return next(err.message)
      })
    }
  })
  .catch((err) => {
    return next(err.message)
  })
}

const auth = {
  authenticate
}

module.exports = auth
