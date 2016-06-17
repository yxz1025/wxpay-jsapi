var Promise = require('bluebird');
var co = require('co');
var request = Promise.promisifyAll(require("request"));
var crypto = require('crypto');
var ejs = require('ejs');
var fs = require('fs');
var messageTpl = fs.readFileSync(__dirname + '/message.ejs', 'utf-8');

function WxPay(opts) {
    this.opts = opts || {};
    this.appid = this.opts.appid || "";
    this.mch_id = this.opts.mch_id || "";
    this.key = this.opts.key || "";
    this.notify_url = this.opts.notify_url || "";
};

//解析xml
WxPay.prototype.getXMLNodeValue = function(node_name, xml) {
    var tmp = xml.split("<" + node_name + ">");
    var _tmp = tmp[1].split("</" + node_name + ">");
    return _tmp[0];
};

//微信排序算法
WxPay.prototype.raw = function(args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var newArgs = {};
    keys.forEach(function(key) {
        newArgs[key] = args[key];
    });
    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
};

//随机字符串
WxPay.prototype.createNonceStr = function() {
    return Math.random().toString(36).substr(2, 15);
};

//时间戳
WxPay.prototype.createTimeStamp = function() {
    return parseInt(new Date().getTime() / 1000) + '';
}

//支付签名
WxPay.prototype.paysignjs = function(package, signType) {
    var self = this;
    var ret = {
        appId: self.appid,
        nonceStr: self.createNonceStr(),
        package: package,
        signType: signType,
        timeStamp: self.createTimeStamp()
    };
    var string = self.raw(ret);
    string = string + '&key=' + self.key;
    var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
    return sign.toUpperCase();
};

//jsapi签名
WxPay.prototype.jsApiSign = function(attach, body, openid, out_trade_no, spbill_create_ip, total_fee, trade_type) {
    var self = this;
    var ret = {
        appid: self.appid,
        attach: attach,
        body: body,
        mch_id: self.mch_id,
        nonce_str: self.createNonceStr(),
        notify_url: self.notify_url,
        openid: openid,
        out_trade_no: out_trade_no,
        spbill_create_ip: spbill_create_ip,
        total_fee: total_fee,
        trade_type: trade_type
    };
    var string = self.raw(ret);
    string = string + '&key=' + self.key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
    var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
    return sign.toUpperCase();
};

//下单支付
WxPay.prototype.order = co.wrap(function* (attach, body, openid, bookingNo, total_fee, ip) {
	var self = this;
    var deferred = Q.defer();
    var nonce_str = self.createNonceStr();
    var timeStamp = self.createTimeStamp();
    var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var formData = "<xml>";
    formData += "<appid>" + self.appid + "</appid>"; //appid
    formData += "<attach>" + attach + "</attach>"; //附加数据
    formData += "<body>" + body + "</body>";
    formData += "<mch_id>" + self.mch_id + "</mch_id>"; //商户号
    formData += "<nonce_str>" + nonce_str + "</nonce_str>"; //随机字符串，不长于32位。
    formData += "<notify_url>" + self.notify_url + "</notify_url>";
    formData += "<openid>" + openid + "</openid>";
    formData += "<out_trade_no>" + bookingNo + "</out_trade_no>";
    formData += "<spbill_create_ip>" + ip + "</spbill_create_ip>";
    formData += "<total_fee>" + total_fee + "</total_fee>";
    formData += "<trade_type>JSAPI</trade_type>";
    formData += "<sign>" + self.jsApiSign(attach, body, openid, bookingNo, ip, total_fee, 'JSAPI') + "</sign>";
    formData += "</xml>";
    var response = yield request.postAsync({url: url, body: formData});
    if (response.statusCode == 200) {
        var body = response.body;
        var prepay_id = self.getXMLNodeValue('prepay_id', body.toString("utf-8"));
        var tmp = prepay_id.split('[');
        var tmp1 = tmp[2].split(']');
        //签名
        var _paySignjs = self.paysignjs('prepay_id=' + tmp1[0], 'MD5');
        var args = {
            appId: self.appid,
            timeStamp: timeStamp,
            nonceStr: nonce_str,
            signType: "MD5",
            package: tmp1[0],
            paySign: _paySignjs
        };
        return args;      
    }
    return false;
});

module.exports = WxPay;
