/*
cron "0 0 * * *" qiandao_sxmd.js, tag=书香门第签到
依赖: axios, iconv-lite 请在青龙面板依赖处安装
*/

const iconv = require("iconv-lite");
const axios = require("axios");

let ck = null;
let formhash = null;

if (process.env.sxmd_host) {
    SXMD_HOST = process.env.sxmd_host;
} else {
    SXMD_HOST = "www.txtnovel.vip"
    //注意: 此域名可能被墙, 你可能需要使用代理.
}

let account = ""
if (process.env.sxmd_account) {
    account = process.env.sxmd_account;
} else {
    console.log("没有填写账户, 请创建环境变量sxmd_account")
    process.exit(0)
}

let password = ""
if (process.env.sxmd_password) {
    password = process.env.sxmd_password;
} else {
    console.log("没有填写密码, 请创建环境变量sxmd_password")
    process.exit(0)
}

let result = "【书香门第】：";
// console.log(`\n\n当前书香门第网址为：https://${SXMD_HOST}\n`)
var headers = {
    Host: `${SXMD_HOST}`,
    cookie: "  ",
    referer: `http://${SXMD_HOST}/`,
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.81",
}

function login() {
    return new Promise(async (resolve) => {
        try {
            let loginurl =
                `http://${SXMD_HOST}/member.php?mod=logging&action=login&loginsubmit=yes&loginhash=&mobile=2`;
            let data = `formhash=&referer=http%3A%2F%2F${SXMD_HOST}%2F%3Fmobile%3Dyes&loginfield=username&username=${account}&password=${password}&questionid=0&answer=&submit=true&cookietime=2592000`;
            let res = await axios.post(loginurl, data, {
                headers: headers,
                responseType: 'arraybuffer'
            });
            const bufferData = Buffer.from(res.data, 'binary');
            const decodedData = iconv.decode(bufferData, 'gbk');
            if (decodedData.match(/欢迎您回来/)) {
                result += "| 登陆成功 ";
                // console.log("登陆成功");
                ckk = res.headers["set-cookie"];
                ck = "";
                for (i = 0; i < ckk.length; i++) {
                    ck += ckk[i].split("expires")[0];
                }
            } else {
                result += `| 登陆失败 | ${ decodedData }`;
                process.exit(0)
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}

function getformhash() {
    return new Promise(async (resolve) => {
        try {
            let url = `http://${SXMD_HOST}/plugin.php?id=dsu_paulsign:sign&mobile=yes`;
            let res = await axios.get(url, {
                headers: headers,
                responseType: 'arraybuffer'
            });
            const bufferData = Buffer.from(res.data, 'binary');
            const decodedData = iconv.decode(bufferData, 'gbk');
            formhash = decodedData.match(
                /<input type=\"hidden\" name=\"formhash\" value=\"(.+?)\" \/>/s
            )[1];

        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}

function sign() {
    return new Promise(async (resolve) => {
        try {
            let url = `http://${SXMD_HOST}/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&inajax=1&mobile=yes`;
            let data = `formhash=${formhash}&qdxq=kx`;
            let res = await axios.post(url, data, {
                headers: headers,
                responseType: 'arraybuffer'
            });
            const bufferData = Buffer.from(res.data, 'binary');
            const decodedData = iconv.decode(bufferData, 'gbk');
            let message = decodedData.match(/<div class="c">([^<]*)<\/div>/s);
            if (message) {
                result += `| 签到成功 | ${message[1].replace(/\r/g, "").replace(/\n/g, "").replace(/\t/g, "").replace(/<br \/>/g, "")}`;
            } else {
                result += `| 签到失败 | ${ decodedData }`;
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}

function info() {
    return new Promise(async (resolve) => {
        try {
            let url = `http://${SXMD_HOST}/home.php?mod=spacecp&ac=credit&op=base&mobile=yes`;
            let res = await axios.get(url, {
                headers: headers,
                responseType: 'arraybuffer'
            });
            const bufferData = Buffer.from(res.data, 'binary');
            const decodedData = iconv.decode(bufferData, 'gbk');
            const message = decodedData.match(/金币.*?(\d+)/)
            if (message) {
                result += `\n当前金币: ${ message[1] } 枚`;
            } else {
                result += `\n当前金币: 获取失败`
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}

function getinfos() {
    return new Promise(async (resolve) => {
        try {
            let url = `http://${SXMD_HOST}/plugin.php?id=dsu_paulsign:sign&mobile=yes`;
            let res = await axios.get(url, {
                headers: headers,
                responseType: 'arraybuffer'
            });
            const bufferData = Buffer.from(res.data, 'binary');
            const decodedData = iconv.decode(bufferData, 'gbk');

            // 使用正则表达式进行匹配
            const totalSignInDaysMatch = decodedData.match(/您累计已签到.*?(\d+).*?天/);
            const monthlySignInDaysMatch = decodedData.match(/您本月已累计签到.*?(\d+).*?天/);
            const lastSignInTimeMatch = decodedData.match(/您上次签到时间.*?>(.*?)</)
            const totalRewardMatch = decodedData.match(/总奖励.*?<b>(\d+)<\/b>.*?枚/)
            const lastRewardMatch = decodedData.match(/上次获得的奖励.*?<b>(\d+)<\/b>.*?枚/)
            const currentLevelMatch = decodedData.match(/您目前的等级.*?<b>(.*?)<\/b>/)
            const remainingDaysMatch = decodedData.match(/您只需再签到.*?<b>(\d+)<\/b>.*?天/)
            const nextLevelMatch = decodedData.match(/下一个等级.*?<b>(.*?)<\/b>/)

            if (totalSignInDaysMatch && totalSignInDaysMatch.length > 1) {
                result += `\n累计签到: ${totalSignInDaysMatch[1]} 天`;
            } else {
                result += `\n累计签到: 获取失败`
            }
            if (monthlySignInDaysMatch && monthlySignInDaysMatch.length > 1) {
                result += `\n本月签到: ${monthlySignInDaysMatch[1]} 天`;
            } else {
                result += `\n本月签到: 获取失败`
            }
            if (lastSignInTimeMatch && lastSignInTimeMatch.length > 1) {
                result += `\n上次签到: ${lastSignInTimeMatch[1]}`;
            } else {
                result += `\n上次签到: 获取失败`
            }
            if (totalRewardMatch && totalRewardMatch.length > 1) {
                result += `\n累计金币: ${totalRewardMatch[1]} 枚`;
            } else {
                result += `\n累计金币: 获取失败`
            }
            if (lastRewardMatch && lastRewardMatch.length > 1) {
                result += `\n上次金币: ${lastRewardMatch[1]} 枚`;
            } else {
                result += `\n上次金币: 获取失败`
            }
            if (currentLevelMatch && currentLevelMatch.length > 1) {
                result += `\n当前等级: ${currentLevelMatch[1]}`;
            } else {
                result += `\n当前等级: 获取失败`
            }
            if (remainingDaysMatch && remainingDaysMatch.length > 1) {
                result += `\n升级还需: ${remainingDaysMatch[1]} 天`;
            } else {
                result += `\n升级还需: 获取失败`
            }
            if (nextLevelMatch && nextLevelMatch.length > 1) {
                result += `\n下一等级: ${nextLevelMatch[1]}`;
            } else {
                result += `\n下一等级: 获取失败`
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}


async function task() {
    await login();
    headers.cookie = ck;
    if (ck) {
        await getformhash();
        await sign();
        await info();
        await getinfos();
        console.log(result);
    } else {}
    return result;
}
task()
