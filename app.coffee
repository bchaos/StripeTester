path = require('path')
fortressPool= require path.join(__dirname, 'libs', 'fortressPool') 
stripe = require("stripe")("sk_live_0c3kHXxlJulHK483M2exvX9y");

stripe.charges.list {limit:20000}, (err,charges)->
    buildChargeList  charges.data, charges.length, 0, [], (realcharges) ->
        findFakeOrder realcharges
        
buildChargeList = (charge, length, index, realcharges, callback) ->

    if index = length
        callback realcharges 
    else
        console.log charge.data[index]
        createdTime1= charge[index].source.created
        createdTime2= charge[index].source.created+20000
        checkForTestOrder [createdTime1,createdTime2], charge[index].source.id, (result)->
                realCharges.push result.id
                buildChargeList charge, length,index+1,realcharges,callback
            
checkForTestOrder = (query, stripeorder,callback) ->
    fortressPool.getConnection (err,connection)->
        if err or typeof connection is "undefined"
            
            log.error "could not connect"
            callback -1
        else
            sql = 'SELECT * FROM orders where UNIX_TIMESTAMP(created_at) between  ? and ? '
            connection.query sql , query, (err,results) ->
                connection.release();
                if err
                    log.error "err"
                else if results[0]
                    callback results[0] 
findFakeOrder = (resultList)->
    fortressPool.getConnection (err,connection)->
        if err or typeof connection is "undefined"
            
            log.error "could not connect"
            callback -1
        else
            sql = 'SELECT * FROM orders not in ? '
            connection.query sql , query, (err,results) ->
                 connection.release();
                 if err
                    log.error "err"
                 else if results[0]
                    console.log results[0]
setOrderToTest = (query) ->
    fortressPool.getConnection (err,connection)->
         if err or typeof connection is "undefined"

                log.error "could not connect"
                callback -1
         else
            sql = 'Update orders Set status = 5 where id =?'
            query=connection.query sql, query, (err,results) ->
                console.log 'status updated'
            console.log query.sql
flagOrder = (query) ->
    fortressPool.getConnection (err,connection)->
        if err or typeof connection is "undefined"
            
            log.error "could not connect"
            callback -1
        else
            sql = 'Insert into testOrderFlag set ? '
            query= connection.query sql , query, (err,results) ->
                connection.release()
            console.log query.sql