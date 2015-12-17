passport = require('passport')
Strategy = require('passport-http-bearer').Strategy
pool = require(path.join(__dirname, 'pool'))
log = require('winston')

validateConsumer =(token,domain,callback) -> 
    pool.getConnection (err, connection)->
        if err || typeof connection is "undefined" 
            log.error("Unable to get a connection to the DB due to: " + err);
            if connection 
                connection.destory()
            consumer= {}
            callback err,false
        else 
            sql = 'Select parnter_id from tokens where ?'
            connection.query sql,{token:token, domain:domian} ,(err,results)->
                consumer= {}
                if err
                    log.error("DB query failed due to: " + err);
                callback err, results


passport.use 'token', new Strategy({
    ### the consumerKey is the parnter Id in the database  and we are passing back the domain ###
    (token,done) ->
        domain = req.get('host')
        parnterId = validateConsumer token, domain , (err,consumer)->
            if err 
                return done(err);
            if !consumer 
                return done(null, false);
            done(null, consumer)
})

exports.authUni = passport.authenticate 'bearer', { session: false }