const net = require('net')
const https = require('https')
const path = require("path");
const bodyParser = require("body-parser");
const express = require('express')
const fetch = require('node-fetch')
const percom = require('percom');
// let opendotaSqlPre = "SELECT matches.match_id,matches.start_time,((player_matches.player_slot < 128) = matches.radiant_win) win,player_matches.hero_id,player_matches.account_id,leagues.name leaguename FROM matches JOIN match_patch using(match_id) JOIN leagues using(leagueid) JOIN player_matches using(match_id) JOIN heroes on heroes.id = player_matches.hero_id LEFT JOIN notable_players ON notable_players.account_id = player_matches.account_id LEFT JOIN teams using(team_id) WHERE TRUE "
// let opendotaSqlAfter = " ORDER BY matches.match_id DESC NULLS LAST LIMIT 500"
let extraLeagues = [
  {
    id: 15475,
    displayName: "Riyadh Masters 2023 by Gamers8"
  },
  {
    id: 15739,
    displayName: "DreamLeague Season 21 powered by Intel"
  },
]
let requestIntervalCount = 0
let teamList = []
let leagueList = []
let cachedMatches = []
let cachedTeamMatches = []
let cachedPlayers = []
let cachedPlayerMatchList = []
let cachedPlayersMatchData = []
let cachedHeroesLoc = []
let patchList = []
let selectedTeamIndex = -1
let leagueFilter = []
let includeOtherPosition = true
let includeRankData = false
// let numFilter = 0
let patchSelectedArray = []
let startDateTime = 0
let endDateTime = 0
let matchRequestCount = 0
let openDotaKeyString
let stratzToken = ''

let stratzOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': stratzToken
  }
}
let analyzersCount = 0
let cachedTeamMatchesData = []
let cachedPlayersMatchesData = []
let playersApi = {
  playersInfo: [],
  playersData: []
}
let teamApi = {}
let leagueApi = {}
// var webPagePath = path.join(__dirname, "./webPage");
// var outputApp = express();
// outputApp.use(bodyParser.json());
// outputApp.get("/overlay", function (req, res) {
//   res.writeHead(200, { "Content-Type": "text/html" });
//   res.end(fs.readFileSync(webPagePath + "/index.html"));
// });
// outputApp.use("/style", express.static(webPagePath + "/style"));
// outputApp.use("/scripts", express.static(webPagePath + "/scripts"));
// outputApp.use("/fonts", express.static(webPagePath + "/fonts"));
// var outputServer = outputApp.listen(9068, function () {
//   console.log("voteOverlay启动完成，端口为9068");
// });

let timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let requestLimitReset = () => {
  setInterval(() => {
    requestIntervalCount = 0
  }, 1050)
}

let getAllTeamsList = async () => {
  teamList = []
  let res
  // try {
  res = await fetch('https://api.opendota.com/api/teams')
  // } catch (error) {
  //   console.log(error)
  //   dialogShow('Open Dota请求错误')
  //   setTimeout(() => {
  //     dialogHide()
  //   }, 2000)
  // }
  let data = await res.json()
  let teamListTemp = []
  for (let index = 0; index < 200; index++) {
    teamListTemp[index] = data[index]
  }
  let timeStampCurrent = Date.parse(new Date()) / 1000
  teamListTemp.forEach(team => {
    if (timeStampCurrent - 10339200 < team.last_match_time) {
      teamList.push(team)
    }
  })
  console.log(teamList)
}

let getAllHerosLoc = async () => {
  let res
  // try {
  res = await fetch('https://www.dota2.com/datafeed/herolist?language=schinese')
  // } catch (error) {
  // console.log(error)
  // dialogShow('dota2.com请求错误')
  // setTimeout(() => {
  //   dialogHide()
  // }, 2000)
  // }
  let data = await res.json()
  let heroShortNames = JSON.parse(fs.readFileSync('heroes.json'))
  data.result.data.heroes = data.result.data.heroes.sort((a, b) => {
    return a.id - b.id
  })
  data.result.data.heroes.forEach((hero, index) => {
    cachedHeroesLoc[hero.id] = hero
    cachedHeroesLoc[hero.id].shortName = heroShortNames[index].shortName
    cachedHeroesLoc[hero.id].icon = `https://cdn.stratz.com/images/dota2/heroes/${heroShortNames[index].shortName}_icon.png`
  })
}

let getAllLeaguesList = async () => {
  let graphql = `
    {
      upcoming:leagues(request:{take:20, tiers:[MINOR,MAJOR,DPC_QUALIFIER,DPC_LEAGUE_QUALIFIER,DPC_LEAGUE,DPC_LEAGUE_FINALS,INTERNATIONAL], isFutureLeague:true, leagueEnded:false}){
        tier
        id
        displayName
      },
      ongoing:leagues(request:{take:20, tiers:[MINOR,MAJOR,DPC_QUALIFIER,DPC_LEAGUE_QUALIFIER,DPC_LEAGUE,DPC_LEAGUE_FINALS,INTERNATIONAL], isFutureLeague:false, leagueEnded:false}){
        tier
        id
        displayName
      },
      completed:leagues(request:{take:20, tiers:[MINOR,MAJOR,DPC_QUALIFIER,DPC_LEAGUE_QUALIFIER,DPC_LEAGUE,DPC_LEAGUE_FINALS,INTERNATIONAL], isFutureLeague:false, leagueEnded:true}){
        tier
        id
        displayName
      }
    }
  `
  let stratzPostOptions = {
    method: 'post',
    body: graphql,
    headers: {
      'Content-Type': 'application/graphql',
      'Authorization': stratzToken
    }
  }
  await requestLimitCheck()
  let res
  // try {
  res = await fetch('https://api.stratz.com/graphql', stratzPostOptions)
  // } catch (error) {
  //   console.log(error)
  //   dialogShow('Stratz请求错误')
  //   setTimeout(() => {
  //     dialogHide()
  //   }, 2000)
  // }
  let data = await res.json()
  console.log(data)
  leagueList = leagueList.concat(data.data.upcoming).concat(data.data.ongoing).concat(data.data.completed).concat(extraLeagues)
  console.log(leagueList)
}

let getAllPatchInfo = async () => {
  let graphql = `
    {
      constants{
        gameVersions{
          id
          name
          asOfDateTime
        }
      }
    }
  `
  let stratzPostOptions = {
    method: 'post',
    body: graphql,
    headers: {
      'Content-Type': 'application/graphql',
      'Authorization': stratzToken
    }
  }
  await requestLimitCheck()
  let res
  // try {
  res = await fetch('https://api.stratz.com/graphql', stratzPostOptions)
  // } catch (error) {
  //   console.log(error)
  //   dialogShow('Stratz请求错误')
  //   setTimeout(() => {
  //     dialogHide()
  //   }, 2000)
  // }
  let fullData = await res.json()
  data = fullData.data.constants.gameVersions
  data = data.sort((a, b) => {
    return b.id - a.id
  })
  patchList = data
  console.log(patchList)
}

let requestLimitCheck = async () => {
  if (requestIntervalCount >= 19) {
    await Promise.all([timeout(1000)])
    await requestLimitCheck()
  }
  else {
    requestIntervalCount++
    console.log(requestIntervalCount)
  }
}

let singlePlayerMatchListGet = async (player) => {
  let gameVersionIdsString = ''
  let startDateTimeString = ''
  let endDateTimeString = ''
  let rankMatchListData = []
  if (patchSelectedArray.length != 0) {
    gameVersionIdsString = ', gameVersionIds: ' + JSON.stringify(patchSelectedArray)
  }
  if (startDateTime != 0) {
    startDateTimeString = ', startDateTime: ' + startDateTime
  }
  if (endDateTime != 0) {
    endDateTimeString = ', endDateTime: ' + endDateTime
  }
  let graphql = `
    {
      player(steamAccountId: ${player.steamAccount.proSteamAccount.id}) {
        matchesGroupBy(request: {playerList: SINGLE, groupBy: LOBBY_TYPE${gameVersionIdsString}, lobbyTypeIds: [7]${startDateTimeString}${endDateTimeString}, take: 999}) {
          ... on MatchGroupByLobbyTypeType {
            matchCount
            lobbyType
          }
          __typename
        }
      }
    }
  `
  let stratzPostOptions = {
    method: 'post',
    body: graphql,
    headers: {
      'Content-Type': 'application/graphql',
      'Authorization': stratzToken
    }
  }
  if (includeRankData) {
    await requestLimitCheck()
    let rankMatchCountRes
    try {
      rankMatchCountRes = await fetch('https://api.stratz.com/graphql', stratzPostOptions)
    } catch (error) {
      console.log(error)
      dialogShow('Stratz请求错误')
      setTimeout(() => {
        dialogHide()
      }, 2000)
    }
    let rankMatchCountData = await rankMatchCountRes.json()
    console.log(rankMatchCountData)
    let rankMatchCount = 0
    try {
      rankMatchCount = rankMatchCountData.data.player.matchesGroupBy[0].matchCount
    } catch (error) {

    }
    let rankRequestCount = parseInt(rankMatchCount / 100) + 1
    let rankRequestLastTake = rankMatchCount % 100
    graphql = `{`
    for (let index = 0; index < rankRequestCount; index++) {
      let take = 100
      if (index == (rankRequestCount - 1)) {
        take = rankRequestLastTake
      }
      graphql += `
        rankPart${index}:player(steamAccountId: ${player.steamAccount.proSteamAccount.id}) {
          matches(request: {lobbyTypeIds: [7]${gameVersionIdsString}${startDateTimeString}${endDateTimeString},take:${take}}) {
            id
            players(steamAccountId:${player.steamAccount.proSteamAccount.id}){
              hero{
                name
                shortName
                id
              }
              lane
              isRadiant
              position
            }
            didRadiantWin
            midLaneOutcome
            bottomLaneOutcome
            topLaneOutcome
          }
        }
    `
    }
    graphql += `}`
    stratzPostOptions = {
      method: 'post',
      body: graphql,
      headers: {
        'Content-Type': 'application/graphql',
        'Authorization': stratzToken
      }
    }
    await requestLimitCheck()
    let rankPartRes
    try {
      rankPartRes = await fetch('https://api.stratz.com/graphql', stratzPostOptions)
    } catch (error) {
      console.log(error)
      dialogShow('Stratz请求错误')
      setTimeout(() => {
        dialogHide()
      }, 2000)
    }
    let rankMatchPartsData = await rankPartRes.json()
    // console.log(rankMatchPartsData)
    try {
      Object.values(rankMatchPartsData.data).forEach((rankMatchPartData) => {
        console.log(rankMatchPartData)
        rankMatchListData = rankMatchListData.concat(rankMatchPartData.matches)
      })
      rankMatchListData = rankMatchListData.sort((a, b) => {
        return b.id - a.id
      })
      console.log(rankMatchListData)
    } catch (error) {

    }
  }

  // let rankUrl = 'https://api.opendota.com/api/players/' + player.steamAccount.proSteamAccount.id + '/matches?patch=' + patchList[patchSelectedIndex].id + '&lobby_type=7&api_key=' + openDotaKeyString
  // if (dateLimit > 0) {
  //   rankUrl = rankUrl + '&date=' + parseInt(dateLimit).toString()
  // }
  // console.log(rankUrl)
  graphql = `{`
  leagueFilter.forEach((leagueId, index) => {
    graphql += `
      league${index}:player(steamAccountId:${player.steamAccount.proSteamAccount.id}){
        matches(request:{leagueId:${leagueId},take:100,skip:0${gameVersionIdsString}}){
          id
          players(steamAccountId:${player.steamAccount.proSteamAccount.id}){
            hero{
              name
              shortName
              id
            }
            lane
            isRadiant
            position
          }
          didRadiantWin
          midLaneOutcome
          bottomLaneOutcome
          topLaneOutcome
        }
      }
    `
  })
  graphql += `}`
  stratzPostOptions.body = graphql
  await requestLimitCheck()
  let leaguePartRes
  try {
    leaguePartRes = await fetch('https://api.stratz.com/graphql', stratzPostOptions)
  } catch (error) {
    console.log(error)
    dialogShow('Stratz请求错误')
    setTimeout(() => {
      dialogHide()
    }, 2000)
  }
  let leagueMatchPartData = await leaguePartRes.json()
  console.log(leagueMatchPartData)
  leagueMatchListData = []
  Object.values(leagueMatchPartData.data).forEach((leagueMatchPart) => {
    leagueMatchListData = leagueMatchListData.concat(leagueMatchPart.matches)
  })
  cachedPlayerMatchList[player.steamAccount.proSteamAccount.position] = {}
  cachedPlayerMatchList[player.steamAccount.proSteamAccount.position].rank = rankMatchListData
  cachedPlayerMatchList[player.steamAccount.proSteamAccount.position].league = leagueMatchListData
}

let getTeamData = async (teamId) => {
  let gameVersionIdsString = ''
  if (patchSelectedArray.length != 0) {
    gameVersionIdsString = ', gameVersionIds: ' + JSON.stringify(patchSelectedArray)
  }
  cachedTeamMatches = []
  cachedPlayers = []
  cachedHeroes = []
  let graphql = `{`
  leagueFilter.forEach((leagueId, index) => {
    graphql += `
        league${index}:team(teamId:${teamId}){
          matches(request:{leagueId:${leagueId}${gameVersionIdsString},take:100,skip:0}){
            id
            players{
              hero{
                name
                shortName
                id
              }
              lane
              isRadiant
              position
              steamAccountId
            }
            didRadiantWin
            midLaneOutcome
            bottomLaneOutcome
            topLaneOutcome
          }
        }
        `
  })
  graphql += `}`
  let stratzPostOptions = {
    method: 'post',
    body: graphql,
    headers: {
      'Content-Type': 'application/graphql',
      'Authorization': stratzToken
    }
  }
  await requestLimitCheck()
  let matchesRes
  try {
    matchesRes = await fetch('https://api.stratz.com/graphql', stratzPostOptions)
  } catch (error) {
    console.log(error)
    dialogShow('Stratz请求错误')
    setTimeout(() => {
      dialogHide()
    }, 2000)
  }
  let cachedMatchesParts = await matchesRes.json()
  console.log(cachedMatchesParts)
  Object.values(cachedMatchesParts.data).forEach((cachedMatchesPart) => {
    cachedTeamMatches = cachedTeamMatches.concat(cachedMatchesPart.matches)
  })
  console.log('matches')
  console.log(cachedTeamMatches)
  // await requestLimitCheck()
  graphql = `
    {
      team(teamId: ${teamId}) {
        id
        name
        logo
        members{
          steamAccount{
            proSteamAccount{
              id
              name
              realName
            }
          }
        }
        matches(request:{skip:0,take:20}){
          id
          players{
            steamAccount{
              proSteamAccount{
                id
                name
                realName
              }
            }
            position
          }
        }
      }
    }
  `
  stratzPostOptions.body = graphql
  await requestLimitCheck()
  let playersRes
  try {
    playersRes = await fetch('https://api.stratz.com/graphql', stratzPostOptions)
  } catch (error) {
    console.log(error)
    dialogShow('Stratz请求错误')
    setTimeout(() => {
      dialogHide()
    }, 2000)
  }
  let playersResData = await playersRes.json()
  console.log(playersResData)
  let playersData = playersResData.data.team.members.sort((a, b) => {
    return b.lastMatchId - a.lastMatchId
  })
  playersData.splice(5, playersData.length - 5)
  playersData.forEach((player, index) => {
    for (let matchIndex = 0; matchIndex < playersResData.data.team.matches.length; matchIndex++) {
      if (playersResData.data.team.matches[matchIndex].players[0].position == null) {
        continue
      }
      playersResData.data.team.matches[matchIndex].players.forEach((matchPlayer) => {
        if (player.steamAccount.proSteamAccount.id == matchPlayer.steamAccount.proSteamAccount.id) {
          playersData[index].steamAccount.proSteamAccount.positionString = matchPlayer.position
          playersData[index].steamAccount.proSteamAccount.position = matchPlayer.position.replace('POSITION_', '') - 1
        }
      })
    }


  })
  cachedPlayers = playersData
  cachedPlayers = cachedPlayers.sort((a, b) => {
    return a.steamAccount.proSteamAccount.position - b.steamAccount.proSteamAccount.position
  })
  console.log('players')
  console.log(cachedPlayers)
  let playerMatchListRequests = []
  cachedPlayers.forEach((cachedPlayer) => {
    playerMatchListRequests.push(singlePlayerMatchListGet(cachedPlayer))
  })
  await Promise.all(playerMatchListRequests)
  console.log(cachedPlayerMatchList)
  matchDataAnalyze()
}

let playerDataAnalyzer = () => {
  cachedPlayerMatchList.forEach((playerMatches, index) => {
    let winCount = 0
    let matchCount = playerMatches.rank.length + playerMatches.league.length
    let heroes = []
    let heroIds = []
    let outcomeWinCount = 0
    let outcomeTieCount = 0
    let outcomeStompCount = 0
    let outcomeWinErrorCount = 0
    let winErrorCount = 0
    Object.values(playerMatches).forEach((playerMatchesType) => {
      playerMatchesType.forEach((playerMatch) => {
        if (!includeOtherPosition && (playerMatch.players[0].position != cachedPlayers[index].steamAccount.proSteamAccount.positionString)) {
          return
        }
        let campString = ''
        if (playerMatch.players[0].isRadiant) {
          campString = 'RADIANT'
        }
        else {
          campString = 'DIRE'
        }
        let currentHeroId = playerMatch.players[0].hero.id
        if (!heroIds.includes(currentHeroId)) {
          heroIds.push(currentHeroId)
          heroes[currentHeroId] = {
            id: currentHeroId,
            name: cachedHeroesLoc[currentHeroId].name,
            name_loc: cachedHeroesLoc[currentHeroId].name_loc,
            name_english_loc: cachedHeroesLoc[currentHeroId].name_english_loc,
            shortName: cachedHeroesLoc[currentHeroId].shortName,
            pickCount: 0,
            winCount: 0,
            winRate: 0,
            outcomeWinCount: 0,
            outcomeStompCount: 0,
            outcomeTieCount: 0,
            outcomeWinRate: 0,
            outcomeStompRate: 0,
            outcomeTieRate: 0,
            outcomeWinErrorCount: 0,
            winErrorCount: 0
          }
        }
        heroes[currentHeroId].pickCount++
        if (playerMatch.didRadiantWin != null && playerMatch.players[0].isRadiant != null) {
          if (!(!playerMatch.didRadiantWin != !playerMatch.players[0].isRadiant)) {
            winCount++
            heroes[currentHeroId].winCount++
          }
        }
        else {
          winErrorCount++
        }
        heroes[currentHeroId].winRate = (heroes[currentHeroId].winCount / heroes[currentHeroId].pickCount - heroes[currentHeroId].winErrorCount).toFixed(4)
        if (!playerMatch.bottomLaneOutcome) {
          heroes[currentHeroId].outcomeWinErrorCount++
          outcomeWinErrorCount++
        }
        else {
          switch (playerMatch.players[0].position) {
            case 'POSITION_1':
            case 'POSITION_5':
              if (playerMatch.players[0].isRadiant) {
                if (playerMatch.bottomLaneOutcome == 'RADIANT_VICTORY' || playerMatch.bottomLaneOutcome == 'RADIANT_STOMP') {
                  outcomeWinCount++
                  heroes[currentHeroId].outcomeWinCount++
                  if (playerMatch.bottomLaneOutcome == 'RADIANT_STOMP') {
                    outcomeStompCount++
                    heroes[currentHeroId].outcomeStompCount++
                  }
                }
                if (playerMatch.bottomLaneOutcome == 'TIE') {
                  outcomeTieCount++
                  heroes[currentHeroId].outcomeTieCount++
                }
              }
              else {
                if (playerMatch.topLaneOutcome == 'DIRE_VICTORY' || playerMatch.topLaneOutcome == 'DIRE_STOMP') {
                  outcomeWinCount++
                  heroes[currentHeroId].outcomeWinCount++
                  if (playerMatch.topLaneOutcome == 'DIRE_STOMP') {
                    outcomeStompCount++
                    heroes[currentHeroId].outcomeStompCount++
                  }
                }
                if (playerMatch.topLaneOutcome == 'TIE') {
                  outcomeTieCount++
                  heroes[currentHeroId].outcomeTieCount++
                }
              }
              break;
            case 'POSITION_3':
            case 'POSITION_4':
              if (playerMatch.players[0].isRadiant) {
                if (playerMatch.topLaneOutcome == 'RADIANT_VICTORY' || playerMatch.topLaneOutcome == 'RADIANT_STOMP') {
                  outcomeWinCount++
                  heroes[currentHeroId].outcomeWinCount++
                  if (playerMatch.topLaneOutcome == 'RADIANT_STOMP') {
                    outcomeStompCount++
                    heroes[currentHeroId].outcomeStompCount++
                  }
                }
                if (playerMatch.topLaneOutcome == 'TIE') {
                  outcomeTieCount++
                  heroes[currentHeroId].outcomeTieCount++
                }
              }
              else {
                if (playerMatch.bottomLaneOutcome == 'DIRE_VICTORY' || playerMatch.bottomLaneOutcome == 'DIRE_STOMP') {
                  outcomeWinCount++
                  heroes[currentHeroId].outcomeWinCount++
                  if (playerMatch.bottomLaneOutcome == 'DIRE_STOMP') {
                    outcomeStompCount++
                    heroes[currentHeroId].outcomeStompCount++
                  }
                }
                if (playerMatch.bottomLaneOutcome == 'TIE') {
                  outcomeTieCount++
                  heroes[currentHeroId].outcomeTieCount++
                }
              }
              break;
            case 'POSITION_2':
              if (playerMatch.midLaneOutcome == campString + '_VICTORY' || playerMatch.midLaneOutcome == campString + '_STOMP') {
                outcomeWinCount++
                heroes[currentHeroId].outcomeWinCount++
                if (playerMatch.midLaneOutcome == campString + 'STOMP') {
                  outcomeStompCount++
                  heroes[currentHeroId].outcomeStompCount++
                }
              }
              if (playerMatch.midLaneOutcome == 'TIE') {
                outcomeTieCount++
                heroes[currentHeroId].outcomeTieCount++
              }
              break;
          }
        }
        heroes[currentHeroId].outcomeWinRate = (heroes[currentHeroId].outcomeWinCount / (heroes[currentHeroId].pickCount - heroes[currentHeroId].outcomeWinErrorCount)).toFixed(4)
        heroes[currentHeroId].outcomeStompRate = (heroes[currentHeroId].outcomeStompCount / (heroes[currentHeroId].pickCount - heroes[currentHeroId].outcomeWinErrorCount)).toFixed(4)
        heroes[currentHeroId].outcomeTieRate = (heroes[currentHeroId].outcomeTieCount / (heroes[currentHeroId].pickCount - heroes[currentHeroId].outcomeWinErrorCount)).toFixed(4)
      })
    })
    heroes = heroes.filter(Object)
    heroes = heroes.sort((a, b) => {
      return b.pickCount - a.pickCount || b.winCount - a.winCount
    })
    playersApi.playersData[index] = {
      matchCount: matchCount,
      winCount: winCount,
      winRate: (winCount / (matchCount - winErrorCount)).toFixed(4),
      heroCount: heroIds.length,
      outcomeWinCount: outcomeWinCount,
      outcomeStompCount: outcomeStompCount,
      outcomeWinRate: (outcomeWinCount / (matchCount - outcomeWinErrorCount)).toFixed(4),
      outcomeStompRate: (outcomeStompCount / (matchCount - outcomeWinErrorCount)).toFixed(4),
      outcomeTieRate: (outcomeTieCount / (matchCount - outcomeWinErrorCount)).toFixed(4),
      outcomeWinErrorCount: outcomeWinErrorCount,
      heroes: heroes
    }
  })
  // cachedTeamMatchesData.forEach((match)=>{

  // })
  // playersApi = []
}

let teamDataAnalyzer = () => {
  let matchCount = cachedTeamMatches.length
  let winCount = 0
  let radiantCount = 0
  let winErrorCount = 0
  let outcomeCount = {
    safeLaneWinCount: 0,
    safeLaneStompCount: 0,
    safeLaneTieCount: 0,
    safeLaneWinRate: 0,
    safeLaneStompRate: 0,
    safeLaneTieRate: 0,
    midLaneWinCount: 0,
    midLaneStompCount: 0,
    midLaneTieCount: 0,
    midLaneWinRate: 0,
    midLaneStompRate: 0,
    midLaneTieRate: 0,
    offLaneWinCount: 0,
    offLaneStompCount: 0,
    offLaneTieCount: 0,
    offLaneWinRate: 0,
    offLaneStompRate: 0,
    offLaneTieRate: 0,
    laneErrorCount: 0,
  }
  let allHeroes = []
  let allHeroesData = [[], [], [], [], []]
  let heroPairLane = [[], [], []]
  cachedTeamMatches.forEach((match) => {
    if (match.didRadiantWin == null || match.players[0].isRadiant == null) {
      matchCount--
      return
    }
    let campCheck = false
    let isRadiant = true
    let matchCampString = ''
    let radiantOffsetBase = 1
    let heroes_in_this_match = [[], [], [], [], []]
    let heroPairLaneCurrent = [[], [], []]
    let allHeroesMatchIndex = [[], [], [], [], []]
    let heroPairLaneMatchIndex = [-1, -1, -1]
    let playerSelfArray = []
    let playersMatchObject = {}
    match.players.forEach((player, index) => {
      if (player.steamAccountId == playersApi.playersInfo[0].id) {
        if (index > 4) {
          isRadiant = false
          matchCampString = 'DIRE'
          radiantOffsetBase = 0
        }
        else {
          matchCampString = 'RADIANT'
          radiantCount++
        }
        campCheck = true
      }
    })
    if (!campCheck) {
      return
    }
    let playersindexOffset = -5 * (radiantOffsetBase - 1)
    for (let index = playersindexOffset; index < playersindexOffset + 5; index++) {
      playersMatchObject[match.players[index].steamAccountId + ''] = match.players[index]
    }
    for (let index = playersindexOffset; index < playersindexOffset + 5; index++) {
      playerSelfArray[index - playersindexOffset] = playersMatchObject[playersApi.playersInfo[index - playersindexOffset].id]
      if (playerSelfArray[index - playersindexOffset] == undefined) {
        matchCount--
        return
      }
      heroes_in_this_match[0].push(playerSelfArray[index - playersindexOffset].hero.id)
    }
    console.log(heroes_in_this_match[0])
    for (let index = 1; index < 5; index++) {
      heroes_in_this_match[index] = percom.com(heroes_in_this_match[0], index + 1)
      heroes_in_this_match[index].forEach((heroCom, comIndex) => {
        let containCheck = ArrayContainSim(allHeroesData[index], heroCom)
        if (!containCheck[0]) {
          let pairNamesCurrent = []
          let pairNamesCurrent_loc = []
          let pairNamesCurrent_english_loc = []
          let pairNamesCurrent_shortName = []
          heroCom.forEach((heroId) => {
            pairNamesCurrent.push(cachedHeroesLoc[heroId].name)
            pairNamesCurrent_loc.push(cachedHeroesLoc[heroId].name_loc)
            pairNamesCurrent_english_loc.push(cachedHeroesLoc[heroId].name_english_loc)
            pairNamesCurrent_shortName.push(cachedHeroesLoc[heroId].shortName)
          })
          allHeroesData[index].push({
            ids: heroCom,
            names: pairNamesCurrent,
            names_loc: pairNamesCurrent_loc,
            names_english_loc: pairNamesCurrent_english_loc,
            names_shortName: pairNamesCurrent_shortName,
            pickCount: 1,
            pickRate: 0,
            winCount: 0,
            winRate: 0,
            winErrorCount: 0
          })
          allHeroesMatchIndex[index][comIndex] = allHeroesData[index].length - 1
        }
        else {
          allHeroesData[index][containCheck[1]].pickCount++
          allHeroesMatchIndex[index][comIndex] = containCheck[1]
        }
      })
    }

    heroPairLaneCurrent = [[playerSelfArray[0].hero.id, playerSelfArray[4].hero.id], [playerSelfArray[2].hero.id, playerSelfArray[3].hero.id], [playerSelfArray[1].hero.id]]
    heroPairLaneCurrent.forEach((heroPairLaneCurSingle, index) => {
      let containCheck = ArrayContainExact(heroPairLane[index], heroPairLaneCurSingle)
      if (!containCheck[0]) {
        let pairNamesCurrent = []
        let pairNamesCurrent_loc = []
        let pairNamesCurrent_english_loc = []
        let pairNamesCurrent_shortName = []
        heroPairLaneCurSingle.forEach((heroId) => {
          pairNamesCurrent.push(cachedHeroesLoc[heroId].name)
          pairNamesCurrent_loc.push(cachedHeroesLoc[heroId].name_loc)
          pairNamesCurrent_english_loc.push(cachedHeroesLoc[heroId].name_english_loc)
          pairNamesCurrent_shortName.push(cachedHeroesLoc[heroId].shortName)
        })
        heroPairLane[index].push({
          ids: heroPairLaneCurrent[index],
          names: pairNamesCurrent,
          names_locs: pairNamesCurrent_loc,
          names_english_loc: pairNamesCurrent_english_loc,
          names_shortName: pairNamesCurrent_shortName,
          pickCount: 1,
          pickRate: 0,
          winCount: 0,
          winRate: 0,
          outcomeWinCount: 0,
          outcomeWinRate: 0,
          outcomeStompCount: 0,
          outcomeStompRate: 0,
          outcomeTieCount: 0,
          outcomeTieRate: 0,
          outcomeWinErrorCount: 0,
          winErrorCount: 0
        })
        heroPairLaneMatchIndex[index] = heroPairLane[index].length - 1
      }
      else {
        heroPairLane[index][containCheck[1]].pickCount++
        heroPairLaneMatchIndex[index] = containCheck[1]
      }
    })

    heroes_in_this_match[0].forEach((heroId, index) => {
      if (!allHeroes.includes(heroId)) {
        allHeroes.push(heroId)
        allHeroesData[0][heroId] = {
          id: heroId,
          name: cachedHeroesLoc[heroId].name,
          name_loc: cachedHeroesLoc[heroId].name_loc,
          name_english_loc: cachedHeroesLoc[heroId].name_english_loc,
          shortName: cachedHeroesLoc[heroId].shortName,
          pickCount: 1,
          pickRate: 0,
          winCount: 0,
          winRate: 0,
          outcomeWinCount: 0,
          outcomeWinRate: 0,
          outcomeStompCount: 0,
          outcomeStompRate: 0,
          outcomeTieCount: 0,
          outcomeTieRate: 0,
          outcomeWinErrorCount: 0,
          winErrorCount: 0,
          posCount: [0, 0, 0, 0, 0],
          posRate: [0, 0, 0, 0, 0]
        }
      }
      else {
        allHeroesData[0][heroId].pickCount++
      }
      allHeroesMatchIndex[0][index] = heroId
      allHeroesData[0][heroId].posCount[index]++
    })
    if (match.midLaneOutcome != null && match.topLaneOutcome != null && match.bottomLaneOutcome != null) {
      if (isRadiant) {
        outcomeHandler(match.topLaneOutcome, matchCampString, allHeroesMatchIndex, allHeroesData, heroPairLaneMatchIndex, heroPairLane, [2, 3], [1])
        outcomeHandler(match.bottomLaneOutcome, matchCampString, allHeroesMatchIndex, allHeroesData, heroPairLaneMatchIndex, heroPairLane, [0, 4], [0])
        globalOutcomeHandler(match.topLaneOutcome, outcomeCount, 'offLane', matchCampString)
        globalOutcomeHandler(match.midLaneOutcome, outcomeCount, 'midLane', matchCampString)
        globalOutcomeHandler(match.bottomLaneOutcome, outcomeCount, 'safeLane', matchCampString)
      }
      else {
        outcomeHandler(match.bottomLaneOutcome, matchCampString, allHeroesMatchIndex, allHeroesData, heroPairLaneMatchIndex, heroPairLane, [2, 3], [1])
        outcomeHandler(match.topLaneOutcome, matchCampString, allHeroesMatchIndex, allHeroesData, heroPairLaneMatchIndex, heroPairLane, [0, 4], [0])
        globalOutcomeHandler(match.topLaneOutcome, outcomeCount, 'safeLane', matchCampString)
        globalOutcomeHandler(match.midLaneOutcome, outcomeCount, 'midLane', matchCampString)
        globalOutcomeHandler(match.bottomLaneOutcome, outcomeCount, 'offLane', matchCampString)
      }
      outcomeHandler(match.midLaneOutcome, matchCampString, allHeroesMatchIndex, allHeroesData, heroPairLaneMatchIndex, heroPairLane, [1], [2])
    }
    else {
      allHeroesMatchIndex[0].forEach((matchIndex) => {
        allHeroesData[0][matchIndex].outcomeWinErrorCount++
      })
      heroPairLaneMatchIndex.forEach((matchIndex, index) => {
        heroPairLane[index][matchIndex].outcomeWinErrorCount++
      })
      outcomeCount.laneErrorCount++
    }

    if (!(!match.didRadiantWin != !isRadiant)) {
      winCount++
      allHeroesMatchIndex.forEach((allHeroesMatchIndexSingle, index) => {
        allHeroesMatchIndexSingle.forEach((matchIndex) => {
          allHeroesData[index][matchIndex].winCount++
        })
      })
      heroPairLaneMatchIndex.forEach((matchIndex, index) => {
        heroPairLane[index][matchIndex].winCount++
      })
      //对局胜利
    }
  })
  allHeroesData[0] = allHeroesData[0].filter(Object)
  allHeroesData.forEach((allHeroesCom) => {
    allHeroesCom.sort((a, b) => {
      return b.pickCount - a.pickCount || b.outcomeWinCount - a.outcomeWinCount || b.outcomeStompCount - a.outcomeStompCount || b.winCount - a.winCount
    })
  })
  heroPairLane.forEach((singleLaneCom) => {
    singleLaneCom.sort((a, b) => {
      return b.pickCount - a.pickCount || b.outcomeWinCount - a.outcomeWinCount || b.outcomeStompCount - a.outcomeStompCount || b.winCount - a.winCount
    })
  })
  console.log(allHeroesData)
  console.log(heroPairLane)

  allHeroesData.forEach((allHeroesCom, index) => {
    console.log(index)
    allHeroesCom.forEach((comObj) => {
      comObj.pickRate = (comObj.pickCount / matchCount).toFixed(4)
      comObj.winRate = (comObj.winCount / comObj.pickCount).toFixed(4)
      if (index == 0) {
        comObj.outcomeWinRate = (comObj.outcomeWinCount / (comObj.pickCount - comObj.outcomeWinErrorCount)).toFixed(4)
        comObj.outcomeStompRate = (comObj.outcomeStompCount / (comObj.pickCount - comObj.outcomeWinErrorCount)).toFixed(4)
        comObj.outcomeTieRate = (comObj.outcomeTieCount / (comObj.pickCount - comObj.outcomeWinErrorCount)).toFixed(4)
        for (let posIndex = 0; posIndex < 5; posIndex++) {
          comObj.posRate[posIndex] = (comObj.posCount[posIndex] / comObj.pickCount).toFixed(4)
        }
      }
    })
  })
  heroPairLane.forEach((singleLaneCom) => {
    singleLaneCom.forEach((comObj) => {
      comObj.pickRate = (comObj.pickCount / matchCount).toFixed(4)
      comObj.winRate = (comObj.winCount / comObj.pickCount).toFixed(4)
      comObj.outcomeWinRate = (comObj.outcomeWinCount / (comObj.pickCount - comObj.outcomeWinErrorCount)).toFixed(4)
      comObj.outcomeStompRate = (comObj.outcomeStompCount / (comObj.pickCount - comObj.outcomeWinErrorCount)).toFixed(4)
      comObj.outcomeTieRate = (comObj.outcomeTieCount / (comObj.pickCount - comObj.outcomeWinErrorCount)).toFixed(4)
    })
  })


  outcomeCount.safeLaneWinRate = (outcomeCount.safeLaneWinCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  outcomeCount.safeLaneStompRate = (outcomeCount.safeLaneStompCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  outcomeCount.safeLaneTieRate = (outcomeCount.safeLaneTieCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  outcomeCount.midLaneWinRate = (outcomeCount.midLaneWinCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  outcomeCount.midLaneStompRate = (outcomeCount.midLaneStompCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  outcomeCount.midLaneTieRate = (outcomeCount.midLaneTieCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  outcomeCount.offLaneWinRate = (outcomeCount.offLaneWinCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  outcomeCount.offLaneStompRate = (outcomeCount.offLaneStompCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  outcomeCount.offLaneTieRate = (outcomeCount.offLaneTieCount / (matchCount - outcomeCount.laneErrorCount)).toFixed(4)
  teamApi = {
    id: teamList[selectedTeamIndex].team_id,
    name: teamList[selectedTeamIndex].name,
    tag: teamList[selectedTeamIndex].tag,
    logo: teamList[selectedTeamIndex].logo_url,
    matchCount: matchCount,
    winCount: winCount,
    winRate: (winCount / matchCount).toFixed(4),
    radiantCount: radiantCount,
    radiantRate: (radiantCount / matchCount).toFixed(4),
    outcome: outcomeCount,
    singleHeroData: allHeroesData[0],
    pairHeroesData: [allHeroesData[1], allHeroesData[2], allHeroesData[3], allHeroesData[4]],
    pairLaneData: heroPairLane
  }
}

let globalOutcomeHandler = (outComeResult, outcomeCount, laneNameString, matchCampString) => {
  if (outComeResult == matchCampString + '_VICTORY' || outComeResult == matchCampString + '_STOMP') {
    outcomeCount[laneNameString + 'WinCount']++
    if (outComeResult == matchCampString + '_STOMP') {
      outcomeCount[laneNameString + 'StompCount']++
    }
  }
  if (outComeResult == 'TIE') {
    outcomeCount[laneNameString + 'TieCount']++
  }
}

let outcomeHandler = (outComeResult, matchCampString, allHeroesMatchIndex, allHeroesData, heroPairLaneMatchIndex, heroPairLane, singleHeroPoss, lanePoss) => {
  if (outComeResult == matchCampString + '_VICTORY' || outComeResult == matchCampString + '_STOMP') {
    singleHeroPoss.forEach((singleHeroPos) => {
      allHeroesData[0][allHeroesMatchIndex[0][singleHeroPos]].outcomeWinCount++
    })
    lanePoss.forEach((lanePos) => {
      heroPairLane[lanePos][heroPairLaneMatchIndex[lanePos]].outcomeWinCount++
    })
    if (outComeResult == matchCampString + '_STOMP') {
      singleHeroPoss.forEach((singleHeroPos) => {
        allHeroesData[0][allHeroesMatchIndex[0][singleHeroPos]].outcomeStompCount++
      })
      lanePoss.forEach((lanePos) => {
        heroPairLane[lanePos][heroPairLaneMatchIndex[lanePos]].outcomeStompCount++
      })
    }
  }
  if (outComeResult == 'TIE') {
    singleHeroPoss.forEach((singleHeroPos) => {
      allHeroesData[0][allHeroesMatchIndex[0][singleHeroPos]].outcomeTieCount++
    })
    lanePoss.forEach((lanePos) => {
      heroPairLane[lanePos][heroPairLaneMatchIndex[lanePos]].outcomeTieCount++
    })
  }
}

let twoArrayCompare = (a, b) => {
  for (let index = 0; index < a.length; index++) {
    if (!b.includes(a[index])) {
      return false
    }
  }
  return true
}

let ArrayContainSim = (allPairArr, exArr) => {
  for (let index = 0; index < allPairArr.length; index++) {
    if (twoArrayCompare(allPairArr[index].ids, exArr)) {
      return [true, index]
    }
  }
  return [false, -1]
}

let twoArrayEqualCheck = (a, b) => {
  if (a.length == b.length) {
    for (let index = 0; index < a.length; index++) {
      if (a[index] != b[index]) {
        return false
      }
    }
    return true
  }
  else {
    return false
  }
}

let ArrayContainExact = (allArr, exArr) => {
  for (let index = 0; index < allArr.length; index++) {
    if (twoArrayEqualCheck(allArr[index].ids, exArr)) {
      return [true, index]
    }
  }
  return [false, -1]
}
// let listAllPair = (num, heros) =>{
//   let allPairArray = []
//   let pairsCount = combinations(5,num)
//   for (let index = 0; index < pairsCount; index++) {
//     const element = array[index];

//   }
// }

let matchDataAnalyze = () => {
  dialogShow('数据分析中...')
  analyzersCount = 0
  cachedPlayers.forEach((cachedPlayer, index) => {
    playersApi.playersInfo[index] = cachedPlayer.steamAccount.proSteamAccount
  })
  console.time('playerAnalyze')
  playerDataAnalyzer()
  console.timeEnd('playerAnalyze')
  console.log(playersApi)
  console.time('teamAnalyze')
  teamDataAnalyzer()
  console.timeEnd('teamAnalyze')
  // let analyzers = [playerDataAnalyzer, teamDataAnalyzer]
  // await Promise.all(analyzers)
  console.log(teamApi)
}

let iniRequest = async () => {
  dialogShow('数据初始化...')
  try {
    stratzToken = (JSON.parse(fs.readFileSync('./stratz_key.json'))).stratz_token
  } catch (error) {
    dialogShow('stratz token获取错误，请在根目录下stratz_key.json中配置正确token后重启软件')
    return
  }
  try {
    await getAllHerosLoc()
    await getAllTeamsList()
    await getAllLeaguesList()
    await getAllPatchInfo()
  } catch (error) {
    dialogShow('初始化失败...3秒后重试连接')
    console.log('retry')
    setTimeout(iniRequest, 3000);
    return
  }

  frameRefresh()
  dialogHide()
}

let frameRefresh = () => {
  refreshTeamListFrame(teamList)
  refreshPatchListFrame(patchList)
  refreshLeagueListFrame(leagueList)
}

//ini
requestLimitReset()
// Test Part

let apiFileGenerate = () => {
  playersApi.playersInfo.forEach((player, index) => {
    player.startDateTime = startDateTime
    player.endDateTime = endDateTime
    player.rankDataCount = cachedPlayerMatchList[index].rank.length
    player.leagueDataCount = cachedPlayerMatchList[index].league.length
  })
  let fullApi = {
    playersApi: playersApi,
    teamApi: teamApi,
    printType: printType,
    leagueApi: leagueApi
  }
  let jsString = `let apiData = ` + JSON.stringify(fullApi)
  fs.writeFileSync(__dirname + '/webPage/apiData.js', jsString)
}

let generateBtnCall = async () => {
  dialogShow('数据请求中...')
  await getTeamData(teamList[selectedTeamIndex].team_id)
  apiFileGenerate()
  // dialogHide()
  dialogShow('PDF生成中...')
  await print()
}

let TestRun = async () => {
  await iniRequest()
  // await getTeamData(teamList[selectedTeamIndex].team_id)
}
// selectedTeamIndex = 6
// leagueFilter = [15728]
// // numFilter = 30
// // dateLimit = 30
// includeOtherPosition = false
// patchSelectedArray = [162, 163, 164, 165, 166, 167]
// startDateTime = 1691170526
// endDateTime = 1697034581
// includeRankData = true
// try {

// } catch (error) {
//   console.log(error)
// }
iniRequest()