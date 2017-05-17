// connect to db and then get the
// query handler method
var db = require('./db')

function getRules (req, res, next) {
  var sqlGetAllRules = db.miniQuery('../sql/getAllRules.sql')
  db.foddb.any(sqlGetAllRules)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          size: data.length,
          message: 'Retrieved all rules'
        })
    })
    .catch(function (err) {
      return next(err.message)
    })
}

function getRuleById (req, res, next) {
  var ruleId = parseInt(req.params.id)
  var sqlRuleByID = db.miniQuery('../sql/RuleById.sql')
  db.foddb.one(sqlRuleByID, {id: ruleId})
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          size: data.length,
          message: 'Retrieved one rule using given rule Id'
        })
    })
    .catch(function (err) {
      return next(err.message)
    })
}

/**
 * create a rule with form parameters
 */
function createRule (req, res, next) {
  db.foddb.none('', req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          // size: data.length,
          message: 'Inserted one rule'
        })
    })
    .catch(function (err) {
      return next(err.message)
    })
}

module.exports = {
  getRules: getRules,
  getRuleById: getRuleById,
  createRule: createRule
}
