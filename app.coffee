path = require('path')
fortressPool= require path.join(__dirname, 'libs', 'fortressPool') 
stripe = require("stripe")("sk_live_0c3kHXxlJulHK483M2exvX9y");






getCustomers = (item, callback)->
    stripe.customers.list item  , (err,charges)->
        lastindex = charges.data.length-1
        lastObject = charges.data[lastindex].id
        console.log lastObject
        buildChargeList  charges.data, charges.data.length, 0, [], (realcharges) ->
            callback lastindex+1,lastObject ,realcharges
            
                
buildChargeList = (charge, length, index, realcharges, callback) ->
    if index is length
        callback realcharges 
    else
        last4 =charge[index].cards.data[0].last4
        if  last4 isnt 4242 or last4 isnt 4111
            createdTime1= charge[index].created
            createdTime2= charge[index].created+30000
          
            checkForCharge [createdTime1,createdTime2], charge[index].id, (result)->
               
                if result.id isnt 0 and result.id isnt undefined
                    realcharges.push result.id
                buildChargeList charge, length,index+1,realcharges,callback
        else 
            buildChargeList charge, length,index+1,realcharges,callback
            
checkForCharge = (query, stripeorder,callback) ->

    fortressPool.getConnection (err,connection)->
        if err or typeof connection is "undefined"
            console.log 'could not connect'
            callback -1
        else
            sql = 'SELECT * FROM orders where UNIX_TIMESTAMP(created_at) between  ? and ? '
            query=connection.query sql , query, (err,results) ->
                connection.release();
                if err
                    console.log 'err'
                else if results[0]
                    callback results[0] 
                else
                    callback 0
            
                    
findFakeOrder = (resultList,callback)->
    whereIn = '';
    firsttime=1
    for result in resultList
        if !firsttime
            whereIn+=','
        whereIn +=result
        firsttime=0
    console.log whereIn
    fortressPool.getConnection (err,connection)->
        if err or typeof connection is "undefined"
            log.error "could not connect"
            callback -1
        else
            sql = 'SELECT * FROM orders where id not in (?) and UNIX_TIMESTAMP(created_at) >  UNIX_TIMESTAMP(NOW())-2592000'
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
            connection.release();
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
finalChages=[]
buildAllCustomers=(offset)->
   
    getCustomers offset,(result,lastObject,charges)->
        finalChages=finalChages.concat charges
       
        if result is 100
            buildAllCustomers( {limit:100, starting_after:lastObject})
        else
            findFakeOrder finalChages ,(results)->
                console.log 'total fakecharges found'
                console.log results.length
                #for result in results     
                #setOrderToTest result.id
                
            
buildAllCustomers({limit:100})