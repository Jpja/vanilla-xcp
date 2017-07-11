var bitcore = require('bitcore');


//'asset' can be BTC, XCP or any asset (subasset can be longname or numeric)
//If BTC then 'btc_total' is ignored
function initializeTxPp(add_from, add_to, asset, asset_total, btc_total, transfee, mnemonic, div_id) {
    var privkey = getPrivKey(mnemonic, add_from);
    initializeTx(add_from, add_to, asset, asset_total, btc_total, transfee, privkey, div_id);
}
function initializeTx(add_from, add_to, asset, asset_total, btc_total, transfee, privkey, div_id) {
    document.getElementById(div_id).innerHTML = "Preparing transaction ...<br>Please wait";
            
    if (asset == "BTC") {
        sendBTC(add_from, add_to, asset_total, transfee, privkey, div_id);
    } else if (asset == "XCP" || asset == "PEPECASH" || asset == "FLDC") {
        //divisible asset .. keep asset_total as is
       sendXCP_opreturn(add_from, add_to, asset, asset_total, btc_total, transfee, privkey, div_id);
    } else {
        //other assets, loopup whether is divisible
       $.getJSON( "https://xchain.io/api/asset/" + asset, function( data ) {
        var divisible = -1;
        $.each( data, function( key, val ) {
            if (key == "divisible") {
                divisible = val;
            }
        });
        if (divisible == -1) {
            document.getElementById(div_id).innerHTML = "Error, Xchain API is down";
            return;
        } else if (divisible == false) {
            asset_total = parseFloat(asset_total) / 100000000;
        }
        sendXCP_opreturn(add_from, add_to, asset, asset_total, btc_total, transfee, privkey, div_id);
    });
   }
}


function sendXCP_opreturn(add_from, add_to, asset, asset_total, btc_total, transfee, privkey, div_id) {
    var source_html = "https://insight.bitpay.com/api/addr/"+add_from+"/utxo";     
    //var source_html = "https://chain.localbitcoins.com/api/addr/"+add_from+"/utxo"; 
    //var source_html = "http://btc.blockr.io/api/v1/address/unspent/"+add_from;
    
    var total_utxo = new Array();   
       
    $.getJSON( source_html, function( data ) {
        
        var amountremaining = ((parseFloat(btc_total) * 100000000) + (parseFloat(transfee)*100000000))/100000000;
        console.log(amountremaining);
        
        data.sort(function(a, b) {
            return b.amount - a.amount;
        });
        
        $.each(data, function(i, item) {
            
             var txid = data[i].txid;
             var vout = data[i].vout;
             var script = data[i].scriptPubKey;
             var amount = parseFloat(data[i].amount);
             
             amountremaining = amountremaining - amount;            
             amountremaining.toFixed(8);
    
             var obj = {
                "txid": txid,
                "address": add_from,
                "vout": vout,
                "scriptPubKey": script,
                "amount": amount
             };
            
             total_utxo.push(obj);
              
             //dust limit = 5460 
            
             if (amountremaining == 0 || amountremaining < -0.00005460) {                                 
                 return false;
             }
             
        });
    
        var utxo_key = total_utxo[0].txid;
        
        if (amountremaining < 0) {
            var satoshi_change = -(amountremaining.toFixed(8) * 100000000).toFixed(0);
        } else {
            var satoshi_change = 0;
        }
    
        var datachunk_unencoded = create_xcp_send_data_opreturn(asset, asset_total);
        
        var check_data = "1c"+datachunk_unencoded;
        
        var correct = isdatacorrect(check_data, asset, asset_total); 
        
        console.log(correct);
        
        console.log(datachunk_unencoded);
        
        var datachunk_encoded = xcp_rc4(utxo_key, datachunk_unencoded);
               
        var scriptstring = "OP_RETURN 28 0x"+datachunk_encoded;
        var data_script = new bitcore.Script(scriptstring);
        
        var transaction = new bitcore.Transaction();
            
        for (i = 0; i < total_utxo.length; i++) {
            transaction.from(total_utxo[i]);     
        }
        
        console.log(total_utxo);
    
        var btc_total_satoshis = parseFloat((btc_total * 100000000).toFixed(0));
        
        console.log(btc_total_satoshis);
        
        transaction.to(add_to, btc_total_satoshis);
        
        var xcpdata_opreturn = new bitcore.Transaction.Output({script: data_script, satoshis: 0}); 
       
        transaction.addOutput(xcpdata_opreturn);
        
        console.log(satoshi_change);
        
        if (satoshi_change > 5459) {
            transaction.change(add_from);
        }
        
        
        
        transaction.sign(privkey);

        var final_trans = transaction.uncheckedSerialize();
        
        console.log(final_trans);
        
        
        
        if (correct == "yes") {
            document.getElementById(div_id).innerHTML = "Pushing tx to network";
            sendBTCpush(final_trans, div_id);
        } else {
            document.getElementById(div_id).innerHTML = "Error, cannot create transaction.<br>API is likely down.<br>Try again later.";
        }

    });
    
}

function sendBTC(add_from, add_to, sendtotal, transfee, privkey, div_id) {
    
    var source_html = "https://insight.bitpay.com/api/addr/"+add_from+"/utxo";   
    //var source_html = "https://chain.localbitcoins.com/api/addr/"+add_from+"/utxo";
    
    
    //var source_html = "http://btc.blockr.io/api/v1/address/unspent/"+add_from;
    
    var total_utxo = new Array();   
    var sendtotal_satoshis = parseFloat(sendtotal).toFixed(8) * 100000000;   
    //sendtotal_satoshis.toFixed(0);
    
    console.log(sendtotal_satoshis);
    sendtotal_satoshis = Math.round(sendtotal_satoshis);
    console.log(sendtotal_satoshis);
    
    //console.log("sendtotal_satoshis " + sendtotal_satoshis);
    //var mnemonic = $("#newpassphrase").html();
    //var privkey = getprivkey(add_from, mnemonic);
    
    
//    $.getJSON( source_html, function( apidata ) {
    $.getJSON( source_html, function( data ) {
        
        var amountremaining = (parseFloat(sendtotal) + parseFloat(transfee));
      
//        var data = apidata.data.unspent;
        
        data.sort(function(a, b) {
            return b.amount - a.amount;
        });
        
        $.each(data, function(i, item) {
            
             var txid = data[i].txid;
             var vout = data[i].vout;
             var script = data[i].scriptPubKey;

            
//             var txid = data[i].tx;
//             var vout = data[i].n;
//             var script = data[i].script;
             var amount = parseFloat(data[i].amount);
             
             amountremaining = amountremaining - amount;            
             amountremaining.toFixed(8);
    
             var obj = {
                "txid": txid,
                "address": add_from,
                "vout": vout,
                "scriptPubKey": script,
                "amount": amount
             };
            
             total_utxo.push(obj);
              
             //dust limit = 5460 
            
             if (amountremaining == 0 || amountremaining < -0.00005460) {                                 
                 return false;
             }
             
        });
        
        console.log(total_utxo);
        
        if (amountremaining < 0) {
            var satoshi_change = -(amountremaining.toFixed(8) * 100000000).toFixed(0);
        } else {
            var satoshi_change = 0;
        }
        
        console.log(satoshi_change);
        
        var transaction = new bitcore.Transaction();
            
        for (i = 0; i < total_utxo.length; i++) {
            transaction.from(total_utxo[i]);
        }
        
        transaction.to(add_to, sendtotal_satoshis);
            
        if (satoshi_change > 5459) {
            transaction.to(add_from, satoshi_change);
        }
        transaction.sign(privkey);

        var final_trans = transaction.serialize();
        
        console.log(final_trans);
        
        document.getElementById(div_id).innerHTML = "Pushing tx to network";
        sendBTCpush(final_trans, div_id);
    });
       
}





















function randomIntFromInterval(min,max) {

    return Math.floor(Math.random()*(max-min+1)+min); 
    
}

function padprefix(str, max) {   
    
    str = str.toString();
    return str.length < max ? padprefix('0' + str, max) : str;   
    
}

function padtrail(str, max) {

    while (str.length < max) {
        str += "0";
    }
    return str;
}

function hex_byte() {

    var hex_digits = "0123456789abcdef";
    var hex_dig_array = hex_digits.split('');
    
    var hex_byte_array = new Array();
        
    for (a = 0; a < 16; a++){
        for (b = 0; b < 16; b++){            
            hex_byte_array.push(hex_dig_array[a] + hex_dig_array[b]);           
        }
    }
    
    return hex_byte_array;
   
}


function rawtotxid(raw) {

    var firstSHA = Crypto.SHA256(Crypto.util.hexToBytes(raw))
    var secondSHA = Crypto.SHA256(Crypto.util.hexToBytes(firstSHA))    
   
    return reverseBytes(secondSHA);  

}


function checkDivisibility(asset, callback) {
    var xcp_source_html = "https://counterpartychain.io/api/asset/"+asset;
    
    var result;
    
    $.getJSON( xcp_source_html, function( data ) {  
        
        if (data.success == 1) {
          
            var divisibility = data.divisible;
            
            if(divisibility == 1) {
                result = "true"; 
            } else {
                result = "false";
            }
            
        } else {
            
            result = "error";
            
        }
        
        callback(result);
        
    })
}

function assetid(asset_name) {
    
    //asset_name.toUpperCase();

    if (asset_name == "XCP") {
        
        var asset_id = (1).toString(16);
        
    } else if (asset_name.substr(0, 1) == "A") {
        
        var pre_id = asset_name.substr(1);
        
        var pre_id_bigint = BigIntegerSM(pre_id);
        
        var asset_id = pre_id_bigint.toString(16);
          
    } else {  
    
        var b26_digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
        var name_array = asset_name.split("");
    
        //var n = 0;
        var n_bigint = BigIntegerSM(0);
    
        for (i = 0; i < name_array.length; i++) { 
            
            //n *= 26;
            //n += b26_digits.indexOf(name_array[i]);
            
            n_bigint = BigIntegerSM(n_bigint).multiply(26);
            n_bigint = BigIntegerSM(n_bigint).add(b26_digits.indexOf(name_array[i]));
                    
        }    
     
        //var asset_id = n;
        var asset_id = n_bigint.toString(16);
    
    } 
    
    //return asset_id;
    console.log(asset_id);
    
    return asset_id;
    
}

function create_xcp_send_data(asset_name, amount) {
    
    var prefix = "1c434e54525052545900000000"; //CNTRPRTY
    var trailing_zeros = "000000000000000000000000000000000000000000000000000000000000000000";
    var asset_id = assetid(asset_name); 
    
    //var asset_id_hex = padprefix(asset_id.toString(16), 16);
    var asset_id_hex = padprefix(asset_id, 16);
    var amount_round = parseInt((amount*100000000).toFixed(0));
    
    var amount_hex = padprefix((amount_round).toString(16), 16);
    
    console.log(asset_id_hex);
    console.log(amount_hex);
                               
    var data = prefix + asset_id_hex + amount_hex + trailing_zeros; 
    
    return data;
    
}

function create_xcp_send_data_opreturn(asset_name, amount) {
    
    var prefix = "434e54525052545900000000"; //CNTRPRTY
    var asset_id = assetid(asset_name); 
    
    console.log("from cxsdo: "+asset_id);
    
    var asset_id_hex = padprefix(asset_id.toString(16), 16);
    
    var amount_round = parseInt((amount*100000000).toFixed(0));
    
    var amount_hex = padprefix((amount_round).toString(16), 16);
                               
    var data = prefix + asset_id_hex + amount_hex; 
    
    return data;
    
}

function create_broadcast_data(message, value, feefraction, type) {
    
    //max 32 character broadcast for single OP_CHECKMULTISIG output
    //fee fraction must be less than 42.94967295 to be stored as a 4-byte hexadecimal
    
    var feefraction_int = parseFloat(feefraction).toFixed(8) * 100000000;
    feefraction_int = Math.round(feefraction_int);
    
    if (message.length <= 46 && feefraction_int <= 4294967295) {
        
        var currenttime = Math.floor(Date.now() / 1000);
        var currenttime_hex = currenttime.toString(16);   
            
        var cntrprty_prefix = "434e5452505254590000001e"; //includes ID = 30
          
        var messagelength = message.length;
        var messagelength_hex = padprefix(messagelength.toString(16),2);
        
        var initiallength = parseFloat(messagelength) + 29;
        var initiallength_hex = padprefix(initiallength.toString(16),2);
         
        var feefraction_hex = padprefix(feefraction_int.toString(16),8);
       
        var message_hex_short = bin2hex(message);
        
        var value_binary = toIEEE754Double(parseFloat(value));
    
        var value_hex_array = new Array();
        
        for (i = 0; i < value_binary.length; ++i) {
            value_hex_array[i] = padprefix(value_binary[i].toString(16),2);
        }

        var value_hex = value_hex_array.join("");
        
        if (type == "OP_CHECKMULTISIG" && message.length <= 32) {
        
            var message_hex = padtrail(message_hex_short, 64);

            var broadcast_tx_data = initiallength_hex + cntrprty_prefix + currenttime_hex + value_hex + feefraction_hex + messagelength_hex + message_hex;
            
        } else if (type == "OP_RETURN") {
            
            var broadcast_tx_data = cntrprty_prefix + currenttime_hex + value_hex + feefraction_hex + messagelength_hex + message_hex_short;
            
        }
          
        return broadcast_tx_data;
    
    } else {
        
        var error = "error";
        return error;
        
    }
    
}

function xcp_rc4(key, datachunk) {
    
    return bin2hex(rc4(hex2bin(key), hex2bin(datachunk)));
    
}

function address_from_pubkeyhash(pubkeyhash) {
    
    var publicKey = new bitcore.PublicKey(pubkeyhash);
    var address = bitcore.Address.fromPublicKey(publicKey);
    
    //console.log(address.toString());
    return address.toString();
    
}

function addresses_from_datachunk(datachunk) {
    
    var hex_byte_array = hex_byte();
    
    var pubkey_seg1 = datachunk.substring(0, 62);
    var pubkey_seg2 = datachunk.substring(62, 124);
    var first_byte = "02";
    var second_byte;
    var pubkeyhash;
    var address1="";
    var address2="";
    var rand;
    
    while (address1.length == 0) {
        rand = randomIntFromInterval(0,255);
        
        second_byte = hex_byte_array[rand];          
        pubkeyhash = first_byte + pubkey_seg1 + second_byte;
            
        if (bitcore.PublicKey.isValid(pubkeyhash)){
            console.log(pubkeyhash);        
            var hash1 = pubkeyhash;
            var address1 = address_from_pubkeyhash(pubkeyhash);
        }    

    }
    
    while (address2.length == 0) {
        rand = randomIntFromInterval(0,255);
        
        second_byte = hex_byte_array[rand];          
        pubkeyhash = first_byte + pubkey_seg2 + second_byte;
            
        if (bitcore.PublicKey.isValid(pubkeyhash)){
            console.log(pubkeyhash);
            var hash2 = pubkeyhash;
            var address2 = address_from_pubkeyhash(pubkeyhash);
        }  

    }
         
    console.log(address1);
    console.log(address2);
    
    var data_hashes = [hash1, hash2];
    
    return data_hashes;
    
}

function isdatacorrect(data_chunk, asset, asset_total) {
            
            var asset_id = padprefix(assetid(asset),16);
    
    console.log(asset_id);
            
            var assethex = data_chunk.substring(42, 26);
    
    console.log(assethex);
    
            var amount = data_chunk.substring(58, 42);
            //var asset_dec = parseInt(assethex, 16);
            var amount_dec = parseInt(amount, 16) / 100000000;
            
            if (asset_id == assethex && asset_total == amount_dec) {
                var correct = "yes";
            } else {
                var correct = "no";
            }
            
            return correct;
            
            console.log(correct);
}


function sendXCP(add_from, add_to, asset, asset_total, btc_total, msig_total, transfee, mnemonic) {
       
    //var mnemonic = $("#newpassphrase").html();
    
    var privkey = getprivkey(add_from, mnemonic);
     
    var source_html = "https://"+INSIGHT_SERVER+"/api/addr/"+add_from+"/utxo";     
    //var source_html = "https://chain.localbitcoins.com/api/addr/"+add_from+"/utxo";
    var total_utxo = new Array();   
       
    $.getJSON( source_html, function( data ) {
        
        var amountremaining = (parseFloat(btc_total) + parseFloat(msig_total) + parseFloat(transfee));
        
        data.sort(function(a, b) {
            return b.amount - a.amount;
        });
        
        $.each(data, function(i, item) {

//             //chain.so
//             var txid = data[i].txid;
//             var vout = data[i].output_no;
//             var script = data[i].script_hex;
//             var value = parseFloat(data[i].amount);
            
             //insight
             var txid = data[i].txid;
             var vout = data[i].vout;
             var script = data[i].scriptPubKey;
             var amount = parseFloat(data[i].amount);
             
             amountremaining = amountremaining - amount;            
             amountremaining.toFixed(8);
    
             var obj = {
                "txid": txid,
                "address": add_from,
                "vout": vout,
                "scriptPubKey": script,
                "amount": amount
             };
            
             total_utxo.push(obj);
              
             //dust limit = 5460 
            
             if (amountremaining == 0 || amountremaining < -0.00005460) {                                 
                 return false;
             }
             
        });
    
        var utxo_key = total_utxo[0].txid;
        
        if (amountremaining < 0) {
            var satoshi_change = -(amountremaining.toFixed(8) * 100000000).toFixed(0);
        } else {
            var satoshi_change = 0;
        }
        
        console.log(asset);
        console.log(asset_total);
        
        var datachunk_unencoded = create_xcp_send_data(asset, asset_total);
        
        var correct = isdatacorrect(datachunk_unencoded, asset, asset_total); 
        
        console.log(datachunk_unencoded);
        console.log(correct + " correct");
        
        var datachunk_encoded = xcp_rc4(utxo_key, datachunk_unencoded);
        
        
        
        console.log(datachunk_encoded);
        
        var address_array = addresses_from_datachunk(datachunk_encoded);
        
        var sender_pubkeyhash = new bitcore.PublicKey(bitcore.PrivateKey.fromWIF(privkey));
        
        var scriptstring = "OP_1 33 0x"+address_array[0]+" 33 0x"+address_array[1]+" 33 0x"+sender_pubkeyhash+" OP_3 OP_CHECKMULTISIG";
        console.log(scriptstring);
        var data_script = new bitcore.Script(scriptstring);
        
        var transaction = new bitcore.Transaction();
            
        for (i = 0; i < total_utxo.length; i++) {
            transaction.from(total_utxo[i]);
        }
    
        var btc_total_satoshis = parseFloat((btc_total * 100000000).toFixed(0));
        transaction.to(add_to, btc_total_satoshis);
        
        var msig_total_satoshis = parseFloat((msig_total * 100000000).toFixed(0));
        
        var xcpdata_msig = new bitcore.Transaction.Output({script: data_script, satoshis: msig_total_satoshis}); 
        
        transaction.addOutput(xcpdata_msig);
                  
        if (satoshi_change > 5459) {
            transaction.to(add_from, satoshi_change);
        }
        
        transaction.sign(privkey);

        var final_trans = transaction.serialize();
        
        console.log(final_trans);   
        
        //sendXCP_opreturn(add_from, add_to, asset, asset_total, btc_total, transfee, mnemonic);
       
            
        if (correct == "yes") {   
            sendBTCpush(final_trans);  //push raw tx to the bitcoin network via Blockchain.info
        } else {
            $("#sendtokenbutton").html("Error, refresh to continue...");
        }

    });
    
}


function sendBroadcast(add_from, message, value, feefraction, msig_total, transfee, mnemonic, callback) {
       
    //var mnemonic = $("#newpassphrase").html();
    
    var privkey = getprivkey(add_from, mnemonic);
     
    var source_html = "https://"+INSIGHT_SERVER+"/api/addr/"+add_from+"/utxo";  
    var total_utxo = new Array();   
       
    $.getJSON( source_html, function( data ) {
        
        var amountremaining = parseFloat(msig_total) + parseFloat(transfee);
        
        data.sort(function(a, b) {
            return b.amount - a.amount;
        });
        
        $.each(data, function(i, item) {
            
             var txid = data[i].txid;
             var vout = data[i].vout;
             var script = data[i].scriptPubKey;
             var amount = parseFloat(data[i].amount);
             
             amountremaining = amountremaining - amount;            
             amountremaining.toFixed(8);
    
             var obj = {
                "txid": txid,
                "address": add_from,
                "vout": vout,
                "scriptPubKey": script,
                "amount": amount
             };
            
             total_utxo.push(obj);
              
             //dust limit = 5460 
            
             if (amountremaining == 0 || amountremaining < -0.00005460) {                                 
                 return false;
             }
             
        });
    
        var utxo_key = total_utxo[0].txid;
        
        if (amountremaining < 0) {
            var satoshi_change = -(amountremaining.toFixed(8) * 100000000).toFixed(0);
        } else {
            var satoshi_change = 0;
        }
    
        var datachunk_unencoded = create_broadcast_data(message, value, feefraction);
        
        console.log(datachunk_unencoded);
        
        if (datachunk_unencoded != "error") {
        
            var datachunk_encoded = xcp_rc4(utxo_key, datachunk_unencoded);
            var address_array = addresses_from_datachunk(datachunk_encoded);
        
            var sender_pubkeyhash = new bitcore.PublicKey(bitcore.PrivateKey.fromWIF(privkey));
        
            var scriptstring = "OP_1 33 0x"+address_array[0]+" 33 0x"+address_array[1]+" 33 0x"+sender_pubkeyhash+" OP_3 OP_CHECKMULTISIG";
            console.log(scriptstring);
            var data_script = new bitcore.Script(scriptstring);
        
            var transaction = new bitcore.Transaction();
            
            for (i = 0; i < total_utxo.length; i++) {
                transaction.from(total_utxo[i]);
            }
        
            var msig_total_satoshis = parseFloat((msig_total * 100000000).toFixed(0));
        
            var xcpdata_msig = new bitcore.Transaction.Output({script: data_script, satoshis: msig_total_satoshis}); 
        
            transaction.addOutput(xcpdata_msig);
                  
            if (satoshi_change > 5459) {
                transaction.to(add_from, satoshi_change);
            }
        
            transaction.sign(privkey);

            var final_trans = transaction.serialize();
            
            console.log(final_trans);
        
            sendBTCpush(final_trans);  //uncomment to push raw tx to the bitcoin network
            
            callback();
            
        } else {
            
            $("#broadcastmessage").val("Error! Refresh to Continue...");
            
        }
        


    });
    
}

function sendBroadcast_opreturn(add_from, message, value, feefraction, transfee, mnemonic, callback) {
       
    var privkey = getprivkey(add_from, mnemonic);
     
    var source_html = "https://"+INSIGHT_SERVER+"/api/addr/"+add_from+"/utxo";     
    
    var total_utxo = new Array();   
       
    $.getJSON( source_html, function( data ) {
        
        var amountremaining = (parseFloat(transfee)*100000000)/100000000;
        
        console.log(amountremaining);
        
        data.sort(function(a, b) {
            return b.amount - a.amount;
        });
        
        $.each(data, function(i, item) {
            
             var txid = data[i].txid;
             var vout = data[i].vout;
             var script = data[i].scriptPubKey;

            
//             var txid = data[i].tx;
//             var vout = data[i].n;
//             var script = data[i].script;
             var amount = parseFloat(data[i].amount);
             
             amountremaining = amountremaining - amount;            
             amountremaining.toFixed(8);
    
             var obj = {
                "txid": txid,
                "address": add_from,
                "vout": vout,
                "scriptPubKey": script,
                "amount": amount
             };
            
             total_utxo.push(obj);
              
             //dust limit = 5460 
            
             if (amountremaining == 0 || amountremaining < -0.00005460) {                                 
                 return false;
             }
             
        });
    
        var utxo_key = total_utxo[0].txid;
        
        if (amountremaining < 0) {
            var satoshi_change = -(amountremaining.toFixed(8) * 100000000).toFixed(0);
        } else {
            var satoshi_change = 0;
        }
    
        var datachunk_unencoded = create_broadcast_data(message, value, feefraction, "OP_RETURN");

        console.log(datachunk_unencoded);
        
        if (datachunk_unencoded != "error") {
            
            var datachunk_encoded = xcp_rc4(utxo_key, datachunk_unencoded);

            var bytelength = datachunk_encoded.length / 2;

            var scriptstring = "OP_RETURN "+bytelength+" 0x"+datachunk_encoded;
            var data_script = new bitcore.Script(scriptstring);

            var transaction = new bitcore.Transaction();

            for (i = 0; i < total_utxo.length; i++) {
                transaction.from(total_utxo[i]);     
            }

            console.log(total_utxo);

            var xcpdata_opreturn = new bitcore.Transaction.Output({script: data_script, satoshis: 0}); 

            transaction.addOutput(xcpdata_opreturn);

            console.log(satoshi_change);

            if (satoshi_change > 5459) {
                transaction.change(add_from);
            }

            transaction.sign(privkey);

            var final_trans = transaction.uncheckedSerialize();
            
            console.log(final_trans);
        
            sendBTCpush(final_trans);  //uncomment to push raw tx to the bitcoin network
            
            callback();
            
        } else {
            
            $("#broadcastmessage").val("Error! Refresh to Continue...");
            
        }
        


    });
    
}
