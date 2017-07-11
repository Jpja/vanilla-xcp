function sendBTCpush(hextx, div_id) {
	sendBTCpush_chainso(hextx, div_id);
    sendBTCpush_blockchaininfo(hextx, div_id);
	sendBTCpush_blockr(hextx, div_id);
}
//var isPushed = false;
function sendBTCpush_chainso(hextx, div_id) {
    url = 'https://chain.so/api/v2/send_tx/BTC';
    postdata = 'tx_hex=' + hextx; 
    if (url != null && url != "")
    {
        ajax(url, postdata, hextx, div_id);
    }
}
function sendBTCpush_blockchaininfo(hextx, div_id) {
	url = 'http://blockchain.info/pushtx';
	postdata = 'tx=' + hextx;
    if (url != null && url != "")
    {
        ajax(url, postdata, hextx, div_id);
    }
}
function sendBTCpush_blockr(hextx, div_id) {
	url = 'http://btc.blockr.io/api/v1/tx/push';
	postdata = 'hex=' + hextx;
	if (url != null && url != "")
	{
		ajax(url, postdata, div_id);
	}
}

function ajax(url, data, rawtx, div_id) {
    console.log(url);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            console.log(url + " state 4");
            document.getElementById(div_id).innerHTML = "Success! Transaction sent!";
            
            /*WHEN COME THIS FAR, ASSUME SUCCESS
                Tx is pushed to 3 services
                Only one of the three needs to work
                
                If the first pushes, but fails to give success feedback,
                the other two will return fail since already pushed.
                Therefore can get no success status. Happened.
                
                TODO: Find a better way
            */
            
            console.log(xhr.responseText);
            //var checksuccess = jQuery.parseJSON(xhr.responseText);
            /*
            console.log(url + " " + checksuccess.status);
            
            if (checksuccess.status != "success") {
                setTimeout(function(){
                    if (isPushed == false) {
                        document.getElementById(div_id).innerHTML = "Fail! Cannot push transaction!";
                    }
                }, 4000);
                $("#sendtokenbutton").html("Refresh to continue...");
                
                $("#freezeUnconfirmed").css("display", "block");
                $("#mainDisplay").css("display", "none");
                $("#mainDisplay-working").hide();
                //$("#yourtxid").html("<a href='https://blockchain.info/tx/"+newTxid+"'>View Transaction</a>");
                $("#yourtxid").html("Transaction Failed!");
                $("#txsendstatus").html("Something is wrong, please try again later");
                $(".tipsendcomplete").html("<div class='h1' style='padding: 60px 0 30px 0;'>Transaction Failed!</div><div class='h4'>Something is wrong, please try again later.</div></div>");
                
            } else {
                isPushed = true;
                document.getElementById(div_id).innerHTML = "Success! Transaction sent!";
                $("#sendtokenbutton").html("Sent! Refresh to continue...");
                //$("#sendtokenbutton").prop('disabled', true);

                var newTxid = rawtotxid(rawtx);

                console.log(newTxid);
                $("#freezeUnconfirmed").css("display", "block");
                $("#mainDisplay").css("display", "none");
                $("#mainDisplay-working").hide();
                //$("#yourtxid").html("<a href='https://blockchain.info/tx/"+newTxid+"'>View Transaction</a>");
                $("#yourtxid").html("<a href='https://chain.so/tx/BTC/"+newTxid+"'>View Transaction</a>");
                $("#txsendstatus").html("Balance will update after one confirmation");
                $(".tipsendcomplete").html("<div class='h1' style='padding: 60px 0 30px 0;'>Send Complete!</div><div class='h4'>Token balances update in wallet after one confirmation</div><hr><div class='h2'><a href='https://chain.so/tx/BTC/"+newTxid+"'>View Transaction</a></div>");
                
            }
            */
            xhr.close;
        }
    }
    xhr.open(data ? "POST" : "GET", url, true);
    if (data) xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data);
}



function ajax_blockchaininfo(url, data, rawtx) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            console.log(xhr.responseText);
     
            $("#sendtokenbutton").html("Sent! Refresh to continue...");
            //$("#sendtokenbutton").prop('disabled', true);

            var newTxid = rawtotxid(rawtx);

            console.log(newTxid);
            $("#freezeUnconfirmed").css("display", "block");
            $("#mainDisplay").css("display", "none");
            $("#mainDisplay-working").hide();
            //$("#yourtxid").html("<a href='https://blockchain.info/tx/"+newTxid+"'>View Transaction</a>");
            $("#yourtxid").html("<a href='https://blockchain.info/tx/"+newTxid+"'>View Transaction</a>");
            $("#txsendstatus").html("Balance will update after one confirmation");
            $(".tipsendcomplete").html("<div class='h1' style='padding: 60px 0 30px 0;'>Send Complete!</div><div class='h4'>Token balances update in wallet after one confirmation</div><hr><div class='h2'><a href='https://blockchain.info/tx/"+newTxid+"'>View Transaction</a></div>");
                         
            xhr.close;
        }
    }
    xhr.open(data ? "POST" : "GET", url, true);
    if (data) xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data);
}
/*
function sendBTCpush_blockchaininfo(hextx) {
    url = 'http://blockchain.info/pushtx';
    postdata = 'tx=' + hextx;
    
    $("#mainDisplay").css("display", "none");
    $("#mainDisplay-working").show();
    
//    url = 'https://chain.so/api/v2/send_tx/BTC';
//    postdata = 'tx_hex=' + hextx;
    
    if (url != null && url != "")
    {
        ajax_blockchaininfo(url, postdata, hextx);
    }
}
*/

function ajaxCB(url, data, rawtx, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            console.log(xhr.responseText);
            
            var checksuccess = jQuery.parseJSON(xhr.responseText);
            
            callback(checksuccess.status);
            
            xhr.close;
        }
    }
    xhr.open(data ? "POST" : "GET", url, true);
    if (data) xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data);
}


function sendBTCpushCB(hextx, callback) {
//    url = 'http://blockchain.info/pushtx';
//    postdata = 'tx=' + hextx;
    
    url = 'https://chain.so/api/v2/send_tx/BTC';
    postdata = 'tx_hex=' + hextx;
    
    if (url != null && url != "")
    {
        ajaxCB(url, postdata, hextx, function(status){
        
            callback(status);
        
        });
    }
}




    
