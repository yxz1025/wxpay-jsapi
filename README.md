# wxpay-jsapi
微信支付，wxpay,  jsapi,微信js-sdk 支付koa和express

###如何使用？
       var WxPay = require("wxpay-jsapi");
       var opt = {
          appid: "appid",
          mch_id: "mch_id",
          key: "key",
          notify_url: "notify_url"
       };
       var wxpay = new WxPay(opt);
       var attach = "这里是需要传送得数据";
       var body = "这里是描述";
       var openid = "openid";
       var bookingNo = "20150806125346";//订单号长度有限制具体看微信API文档
       var total_fee = 10;//0.1元
    	 var ip = '127.0.0.1';
       wxpay.order(attach, body, openid, bookingNo, total_fee, ip).then(function(data){
          res.render('wxpay', {args: data});
       });
   
   
###页面调用例子
    		<script type="text/javascript">
            var onBridgeReady = function() {
             WeixinJSBridge.invoke('getBrandWCPayRequest', {
             	"appId": "<%= args.appId %>",
             	"timeStamp": "<%= args.timeStamp %>",
             	"nonceStr": "<%= args.nonceStr %>",
             	"package": "prepay_id=<%= args.package %>",
             	"signType": "MD5",
             	"paySign": "<%= args.paySign %>",
             },
             function(res) {
               if (res.err_msg == "get_brand_wcpay_request:ok") {
    				alert(res.err_msg); //成功页面
               } else if (res.err_msg == "get_brand_wcpay_request:cancel") {
    				alert(res.err_msg); //成功页面
               } else if (res.err_msg == "get_brand_wcpay_request:fail") {
                  alert(res.err_msg); //成功页面
               } else {
                 
               }
             });
            };
            if (document.addEventListener) {
             document.addEventListener("WeixinJSBridgeReady", onBridgeReady, true);
            } else {
             document.attachEvent("onWeixinJSBridgeReady", onBridgeReady);
            }
       //      $(function(){
    			// addCharge();
       //      });
    		</script>
