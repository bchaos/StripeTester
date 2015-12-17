path = require('path')
fortressPool= require path.join(__dirname, 'libs', 'fortressPool') 
stripe = require("stripe")("sk_live_0c3kHXxlJulHK483M2exvX9y");

stripe.charges.list {limit:20000}, (err,charges)->
    buildChargeList  charges.data, charges.data.length, 0, [], (realcharges) ->
        findFakeOrder realcharges ,(results)->
            consule.log 'items found'
            console.log results.length
            
            for result in results 
                
                flagOrder {orderid:result.id}
        
buildChargeList = (charge, length, index, realcharges, callback) ->
    if index is length
        callback realcharges 
    else
        createdTime1= charge[index].created-60000
        createdTime2= charge[index].created+60000
        checkForTestOrder [createdTime1,createdTime2], charge[index].id, (result)->
                realcharges.push result.id
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
findFakeOrder = (resultList,callback)->
    whereIn = '';
    firsttime=1
    for result in resultList
        if !firsttime
            whereIn+=','
        whereIn +="'"+result+"'"
        firsttime=0
    whereIn +=;
    console.log whereIn
    fortressPool.getConnection (err,connection)->
        if err or typeof connection is "undefined"
            log.error "could not connect"
            callback -1
        else
            sql = 'SELECT * FROM orders where id not in (?) '
            query =connection.query sql , whereIn, (err,results) ->
                 connection.release();
                 if err
                    log.error "err"
                 else if results[0]
                     callback results
            console.log query.sql
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