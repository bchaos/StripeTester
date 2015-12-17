path = require('path')
fortressPool= require path.join(__dirname, 'libs', 'fortressPool') 
stripe = require("stripe")("sk_test_E7EiG2iK8nfAQkRvW6VrfCzH");

stripe.charges.list {limit:20000}, (err,charges)->
    for charge in charges.data
        createdTime1= charge.created-60000
        createdTime2= charge.created+60000
        checkForTestOrder [createdTime1,createdTime2], charge.id
        
    
checkForTestOrder = (query, stripeorder) ->
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
                    for result in results 
                        #flagOrder {orderId: result.id,stripeId:stripeorder }
                        setOrderToTest result.id  
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