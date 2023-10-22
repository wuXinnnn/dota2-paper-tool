let voteBgEl = document.getElementById('voteBg')
let voteBarLeftDataPercentEl = document.getElementById('voteBarLeftDataPercent')
let voteBarRightDataPercentEl = document.getElementById('voteBarRightDataPercent')
let voteBarLeftBgEl = document.getElementById('voteBarBgTopContainer')
let voteBarRightBgEl = document.getElementById('voteBarBgBottomContainer')
var socket;
if (!window.WebSocket) {
    window.WebSocket = window.MozWebSocket;
}
if (window.WebSocket) {
    let wsOptions = {
        url: "ws://localhost:9069",
        pingTimeout: 15000,
        pongTimeout: 10000,
        reconnectTimeout: 2000,
        pingMsg: "heartbeat",
    };
    socket = new window.WebsocketHeartbeatJs(wsOptions);
    socket.onmessage = function (event) {
        let receiveObj = JSON.parse(event.data);
        if (receiveObj.title == 'setData') {
            if (receiveObj.data == -1) {
                let agreePercent = 0
                let agreePercentFixed = 0
                let denyPercent = 0
                let denyPercentFixed = 0
                $("#voteBarTopDataPerc span").animateNumbers(
                    agreePercentFixed,
                    false,
                    500
                );
                $("#voteBarBottomDataPerc span").animateNumbers(
                    denyPercentFixed,
                    false,
                    500
                );
                voteBarLeftBgEl.style.width = '0%'
                voteBarRightBgEl.style.width = '0%'
                return
            }
            let agreePercent = receiveObj.data * 100
            let agreePercentFixed = agreePercent.toFixed(0)
            let denyPercent = 100 - agreePercent
            let denyPercentFixed = 100 - agreePercentFixed
            $("#voteBarTopDataPerc span").animateNumbers(
                agreePercentFixed,
                false,
                1000
            );
            $("#voteBarBottomDataPerc span").animateNumbers(
                denyPercentFixed,
                false,
                1000
            );
            voteBarLeftBgEl.style.width = agreePercent + '%'
            voteBarRightBgEl.style.width = denyPercent + '%'
        } else if (receiveObj.title == 'setVisibility') {
            if (receiveObj.data) {
                // voteBgEl.style.transform = 'translateY(0px)'
                document.getElementById('voteBlockContainer').className = 'visible'
            }
            else{
                // voteBgEl.style.transform = 'translateY(274px)'
                document.getElementById('voteBlockContainer').className = 'hidden'
            }
        } else if (receiveObj.title == 'setTitle') {
            // document.getElementById('voteTitle').innerText = receiveObj.data.voteTitle
            document.getElementById('voteBarTopDataTitle').innerText = receiveObj.data.voteLeft
            document.getElementById('voteBarBottomDataTitle').innerText = receiveObj.data.voteRight
        }
    };
  //   socket.onopen = function (event) {
  //     var ta = document.getElementById("content");
  //     ta.innerHTML = "连接开启!";
  //   };
  //   socket.onclose = function (event) {
  //     var ta = document.getElementById("content");
  //     ta.innerHTML = ta.innerHTML + "连接被关闭";
  //   };
} else {
  alert("你的浏览器不支持 WebSocket！");
}