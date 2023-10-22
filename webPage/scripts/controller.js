let songList = []
let songListEl = document.getElementsByClassName('song-list')[0]
let addBtn = document.getElementById('songTitleAdd')
let addInput = document.getElementById('songTitleInput')
let updateBtn = document.getElementById('updateBtn')
let showBtn = document.getElementById('showBtn')
let hideBtn = document.getElementById('hideBtn')

let songListAdd = (songTitle)=>{
    songList.push(songTitle)
    let newSongBarEl = document.createElement('div')
    newSongBarEl.className = 'song-list-single-bar'
    let newSongTitleSpan = document.createElement('span')
    newSongTitleSpan.innerHTML = songTitle
    let newSongDeleteBtn = document.createElement('button')
    newSongDeleteBtn.innerHTML = 'X'
    newSongDeleteBtn.addEventListener('click',(e)=>{
        e.target.parentNode.remove()
        songList = []
        let allSongTitleEl = songListEl.getElementsByTagName('span')
        for (let index = 0; index < allSongTitleEl.length; index++) {
            songList.push(allSongTitleEl[index].innerText)
        }
    })
    newSongBarEl.appendChild(newSongTitleSpan)
    newSongBarEl.appendChild(newSongDeleteBtn)
    songListEl.appendChild(newSongBarEl)
}

let visibleToggle = ()=>{
    visibility = !visibility
    if(visibility){
        showHideBtn.innerText = 'HIDE'
    } else {
        showHideBtn.innerText = 'SHOW'
    }
}

addBtn.addEventListener('click',()=>{
    songListAdd(addInput.value)
    addInput.value = ''
})

var socket;
if (!window.WebSocket) {
    window.WebSocket = window.MozWebSocket;
}
if (window.WebSocket) {
    let wsOptions = {
        url: "ws://localhost:9059",
        pingTimeout: 15000,
        pongTimeout: 10000,
        reconnectTimeout: 2000,
        pingMsg: "heartbeat",
    };
    socket = new window.WebsocketHeartbeatJs(wsOptions);
    socket.onmessage = function (event) {
        let receiveObj = JSON.parse(event.data);
        if (receiveObj.title == 'setData') {
            if (receiveObj.data != songList) {
                songListEl.innerHTML = ''
                songList = []
                receiveObj.data.forEach(songTitle => {
                    songListAdd(songTitle)
                });
            }
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
    updateBtn.addEventListener('click',()=>{
        let sendObj = {
            title: 'songListUpdate',
            data:songList
        }
        socket.send(JSON.stringify(sendObj));
    })
    showBtn.addEventListener('click',()=>{
        let sendObj = {
            title: 'visibility',
            data: 1
        }
        socket.send(JSON.stringify(sendObj));
    })
    hideBtn.addEventListener('click',()=>{
        let sendObj = {
            title: 'visibility',
            data: 0
        }
        socket.send(JSON.stringify(sendObj));
    })
} else {
  alert("你的浏览器不支持 WebSocket！");
}