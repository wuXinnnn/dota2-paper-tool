console.log(apiData)
let loadedEvent = new CustomEvent('loadComplete')
let pdfEl = document.getElementById('pdf')

let pos_to_loc = (pos) => {
    switch (pos) {
        case 1:
            return ('一号位')
        case 2:
            return ('二号位')
        case 3:
            return ('三号位')
        case 4:
            return ('四号位')
        case 5:
            return ('五号位')
        default:
            break;
    }
}

let timeStampSecondsToDateString = (timeStamp) => {
    let date = new Date(timeStamp * 1000)
    return date.toLocaleDateString()
}

let playerProgressStructure = (winRate, outcomeStompRate, outcomeWinRate, outComeTieRate, type) => {
    let winErrorStyleStr = ``
    let outcomeTitlePreString = ``
    if (type == 'team') {
        outcomeTitlePreString = `总`
    }
    let outcomeWinRateString = (outcomeWinRate * 100).toFixed(1) + '%'
    let outcomeStompRateString = (outcomeStompRate * 100).toFixed(1) + '%'
    let outcomeStompRateWidthString = (outcomeStompRate * 100).toFixed(1) + '%'
    let outcomeStompDisplayString = 'true'
    let outcomeTieDisplayString = 'true'
    if (outcomeStompRate == 0) {
        outcomeStompRateString = ''
        outcomeStompDisplayString = 'none'
    }
    if (outcomeStompRate == outcomeWinRate && outcomeStompRate != 0) {
        outcomeStompRateString = (outcomeStompRate * 100).toFixed(1) + '%'
        outcomeWinRateString = ''
    }
    if (outcomeWinRate == 0) {
        outcomeWinRateString = ''
    }
    let outComeTieRateString = (outComeTieRate * 100).toFixed(1) + '%'
    let outComeTieRateWidthString = (outComeTieRate * 100).toFixed(1) + '%'
    if (outComeTieRate == 0) {
        outComeTieRateString = ''
        outcomeTieDisplayString = 'none'
    }
    if (outcomeStompRate == 'NaN' || outcomeWinRate == 'NaN' || outComeTieRate == 'NaN') {
        outcomeStompRateString = ''
        outcomeStompDisplayString = 'none'
        outcomeWinRateString = '对线数据解析错误'
        winErrorStyleStr = 'style="font-size: 3.7mm;white-space: nowrap;"'
        outComeTieRateString = ''
        outcomeTieDisplayString = 'none'
    }
    let progressDom = `
    <div class="win-rate-block">
        <div class="win-rate-title">胜率: </div>
            <div class="win-rate-progress-back">
                <div class="win-rate-progress" style="width: ${(winRate * 100).toFixed(1) + '%'};">
                    <span class="win-rate-perc">${(winRate * 100).toFixed(1) + '%'}</span>
                    <div class="win-rate-text">胜</div>
                </div>
            </div>
        </div>
        <div class="outcome-rate-block">
            <div class="outcome-rate-title">${outcomeTitlePreString}线优率: </div>
            <div class="outcome-rate-progress-back">
                <div class="outcome-stomp-rate-progress" style="width: ${outcomeStompRateWidthString};">
                    <div class="outcome-stomp-rate-perc">${outcomeStompRateString}</div>
                    <div class="outcome-stomp-rate-text">碾</div>
                </div>
                <div class="outcome-win-rate-progress" style="width: ${((outcomeWinRate - outcomeStompRate) * 100).toFixed(1) + '%'};">
                    <div class="outcome-win-rate-perc" ${winErrorStyleStr}>${outcomeWinRateString}</div>
                    <div class="outcome-win-rate-text">胜+碾</div>
                </div>
                <div class="outcome-tie-rate-progress" style="width: ${outComeTieRateWidthString};">
                    <div class="outcome-tie-rate-perc">${outComeTieRateString}</div>
                    <div class="outcome-tie-rate-text">平</div>
                </div>
            </div>
        </div>
    `
    return progressDom
}

let playerDataDomStructure = (heroCount, winRate, outcomeStompRate, outcomeWinRate, outComeTieRate) => {
    let playerDataDom = `
    <div class="player-total-data">
        <div class="player-hero-count-block">
            <div class="hero-count">使用英雄数: </div>
            <div class="hero-data">${heroCount}</div>
        </div>
        ${playerProgressStructure(winRate, outcomeStompRate, outcomeWinRate, outComeTieRate, 'player')}
        <div class="progress-sample">
            <div class="stomp-rate-sample">
                <div class="stomp-text">碾：</div>
                <div class="stomp-progress"></div>
            </div>
            <div class="win-rate-sample">
                <div class="win-text">胜+碾：</div>
                <div class="win-progress"></div>
            </div>
            <div class="tie-rate-sample">
                <div class="tie-text">平：</div>
                <div class="tie-progress"></div>
            </div>
        </div>
    </div>
    `
    return playerDataDom
}

let playerSingleHeroDomStructure = (heroData, type) => {
    let heroShortName = heroData.shortName
    let matchCount = heroData.pickCount
    let heroName = heroData.name_loc
    let winRate = heroData.winRate
    let outcomeStompRate = heroData.outcomeStompRate
    let outcomeWinRate = heroData.outcomeWinRate
    let outcomeTieRate = heroData.outcomeTieRate
    let playerHeroDom = `
    <div class="player-hero-block">
        <div class="player-hero-block-margin">
            <div class="player-hero-single-title">
                <div class="player-hero-single-title-left">
                    <div class="player-hero-avatar"><img class="player-hero-avatar-image"
                            src="https://cdn.stratz.com/images/dota2/heroes/${heroShortName}_icon.png"
                            alt="">
                    </div>
                </div>
                <div class="player-hero-single-title-right">
                    <div class="player-hero-match-count"><span>${matchCount}</span>场</div>
                    <div class="player-hero-name">${heroName}</div>
                </div>
            </div>
            ${playerProgressStructure(winRate, outcomeStompRate, outcomeWinRate, outcomeTieRate, type)}
        </div>
    </div>
    `
    return playerHeroDom
}

let playerAllRowStructure = (index) => {
    let playerAllRowsDom = ``
    let currentPlayerHeroesData = apiData.playersApi.playersData[index].heroes
    playerAllRowsDom += `<div class="player-hero-row player-hero-row-large">`
    for (let heroIndex = 0; heroIndex < 3; heroIndex++) {
        let currentHeroData = currentPlayerHeroesData[heroIndex]
        if (!currentHeroData) {
            playerAllRowsDom += `</div>`
            return playerAllRowsDom
        }
        playerAllRowsDom += playerSingleHeroDomStructure(currentHeroData, 'large')
    }
    playerAllRowsDom += `</div><div class="player-hero-row player-hero-row-mini">`
    for (let heroIndex = 3; heroIndex < 11; heroIndex++) {
        let currentHeroData = currentPlayerHeroesData[heroIndex]
        if (!currentHeroData) {
            playerAllRowsDom += `</div>`
            return playerAllRowsDom
        }
        playerAllRowsDom += playerSingleHeroDomStructure(currentHeroData, 'mini')
    }
    playerAllRowsDom += `</div><div class="player-hero-row player-hero-row-mini">`
    for (let heroIndex = 11; heroIndex < 19; heroIndex++) {
        let currentHeroData = currentPlayerHeroesData[heroIndex]
        if (!currentHeroData) {
            playerAllRowsDom += `</div>`
            return playerAllRowsDom
        }
        playerAllRowsDom += playerSingleHeroDomStructure(currentHeroData, 'mini')
    }
    playerAllRowsDom += `</div>`
    return playerAllRowsDom
}

let teamHeroProgressStructure = (winRate, outcomeStompRate, outcomeWinRate, outComeTieRate, type) => {
    let outcomeTitlePreString = ``
    if (type == 'team') {
        outcomeTitlePreString = `总`
    }
    let outcomeWinRateString = (outcomeWinRate * 100).toFixed(1) + '%'
    let outcomeStompRateString = (outcomeStompRate * 100).toFixed(1) + '%'
    let outcomeStompRateWidthString = (outcomeStompRate * 100).toFixed(1) + '%'
    let outcomeStompDisplayString = 'true'
    let outcomeTieDisplayString = 'true'
    if (outcomeStompRate == 0) {
        outcomeStompRateString = ''
        outcomeStompDisplayString = 'none'
    }
    if (outcomeStompRate == outcomeWinRate && outcomeStompRate != 0) {
        outcomeStompRateString = (outcomeStompRate * 100).toFixed(1) + '%'
        outcomeWinRateString = ''
    }
    if (outcomeWinRate == 0) {
        outcomeWinRateString = ''
    }
    let outComeTieRateString = (outComeTieRate * 100).toFixed(1) + '%'
    let outComeTieRateWidthString = (outComeTieRate * 100).toFixed(1) + '%'
    if (outComeTieRate == 0) {
        outComeTieRateString = ''
        outcomeTieDisplayString = 'none'
    }
    if (outcomeStompRate == 'NaN' || outcomeWinRate == 'NaN' || outComeTieRate == 'NaN') {
        outcomeStompRateString = ''
        outcomeStompDisplayString = 'none'
        outcomeWinRateString = '对线数据解析错误'
        outComeTieRateString = ''
        outcomeTieDisplayString = 'none'
    }
    let progressDom = `
    <div class="win-rate-block">
        <div class="win-rate-title">胜率: </div>
            <div class="win-rate-progress-back">
                <div class="win-rate-progress" style="width: ${(winRate * 100).toFixed(1) + '%'};">
                    <span class="win-rate-perc">${(winRate * 100).toFixed(1) + '%'}</span>
                    <div class="win-rate-text">胜</div>
                </div>
            </div>
        </div>
        <div class="outcome-rate-block">
            <div class="outcome-rate-title">${outcomeTitlePreString}线优率: </div>
            <div class="outcome-rate-progress-back">
                <div class="outcome-stomp-rate-progress" style="width: ${outcomeStompRateWidthString};">
                    <div class="outcome-stomp-rate-perc">${outcomeStompRateString}</div>
                    <div class="outcome-stomp-rate-text">碾</div>
                </div>
                <div class="outcome-win-rate-progress" style="width: ${((outcomeWinRate - outcomeStompRate) * 100).toFixed(1) + '%'};">
                    <div class="outcome-win-rate-perc">${outcomeWinRateString}</div>
                    <div class="outcome-win-rate-text">胜+碾</div>
                </div>
                <div class="outcome-tie-rate-progress" style="width: ${outComeTieRateWidthString};">
                    <div class="outcome-tie-rate-perc">${outComeTieRateString}</div>
                    <div class="outcome-tie-rate-text">平</div>
                </div>
            </div>
        </div>
    `
    return progressDom
}

let teamSingleHeroBlockStructure = (heroData, type) => {
    let heroShortName = heroData.shortName
    let matchCount = heroData.pickCount
    let heroName = heroData.name_loc
    let winRate = heroData.winRate
    let outcomeStompRate = heroData.outcomeStompRate
    let outcomeWinRate = heroData.outcomeWinRate
    let outcomeTieRate = heroData.outcomeTieRate
    let playerHeroDom = `
    <div class="player-hero-block">
        <div class="player-hero-block-margin">
            <div class="team-hero-block-left">
                <div class="player-hero-single-title">
                    <div class="player-hero-single-title-left">
                        <div class="player-hero-avatar"><img class="player-hero-avatar-image"
                                src="https://cdn.stratz.com/images/dota2/heroes/${heroShortName}_icon.png"
                                alt="">
                        </div>
                    </div>
                    <div class="player-hero-single-title-right">
                        <div class="player-hero-match-count"><span>${matchCount}</span>场</div>
                        <div class="player-hero-name">${heroName}</div>
                    </div>
                </div>
                ${teamHeroProgressStructure(winRate, outcomeStompRate, outcomeWinRate, outcomeTieRate, type)}
            </div>
            <div class="team-hero-block-right">
            ${teamHeroPosStructure(heroData.posCount)}
            </div>
        </div>
    </div>
    `
    return playerHeroDom
}

let teamHeroPosStructure = (posArray) => {
    let teamHeroPosDom = ``
    for (let index = 0; index < 5; index++) {
        teamHeroPosDom += `
        <div class="team-hero-pos-single">
            <div class="pos-title">${index + 1}</div>
            <div class="pos-count">${posArray[index]}</div>
        </div>
        `
    }
    return teamHeroPosDom
}

let teamHeroAllRowSctucture = () => {
    let playerAllRowsDom = ``
    let currentPlayerHeroesData = apiData.teamApi.singleHeroData
    playerAllRowsDom += `<div class="player-hero-row player-hero-row-large">`
    for (let heroIndex = 0; heroIndex < 3; heroIndex++) {
        let currentHeroData = currentPlayerHeroesData[heroIndex]
        if (!currentHeroData) {
            playerAllRowsDom += `</div>`
            return playerAllRowsDom
        }
        playerAllRowsDom += teamSingleHeroBlockStructure(currentHeroData, 'large')
    }
    playerAllRowsDom += `</div><div class="player-hero-row player-hero-row-mini">`
    for (let heroIndex = 3; heroIndex < 9; heroIndex++) {
        let currentHeroData = currentPlayerHeroesData[heroIndex]
        if (!currentHeroData) {
            playerAllRowsDom += `</div>`
            return playerAllRowsDom
        }
        playerAllRowsDom += teamSingleHeroBlockStructure(currentHeroData, 'mini')
    }
    playerAllRowsDom += `</div><div class="player-hero-row player-hero-row-mini">`
    for (let heroIndex = 9; heroIndex < 15; heroIndex++) {
        let currentHeroData = currentPlayerHeroesData[heroIndex]
        if (!currentHeroData) {
            playerAllRowsDom += `</div>`
            return playerAllRowsDom
        }
        playerAllRowsDom += teamSingleHeroBlockStructure(currentHeroData, 'mini')
    }
    playerAllRowsDom += `</div>`
    return playerAllRowsDom
}

let teamHeroDomStructure = (heroCount, winRate, outcome) => {
    let outcomeStompRate = (outcome.midLaneStompCount + outcome.offLaneStompCount + outcome.safeLaneStompCount) / ((apiData.teamApi.matchCount - apiData.teamApi.outcome.laneErrorCount) * 3)
    let outcomeWinRate = (outcome.midLaneWinCount + outcome.offLaneWinCount + outcome.safeLaneWinCount) / ((apiData.teamApi.matchCount - apiData.teamApi.outcome.laneErrorCount) * 3)
    let outcomeTieRate = (outcome.midLaneTieCount + outcome.offLaneTieCount + outcome.safeLaneTieCount) / ((apiData.teamApi.matchCount - apiData.teamApi.outcome.laneErrorCount) * 3)
    let playerDataDom = `
    <div class="player-total-data">
        <div class="player-hero-count-block">
            <div class="hero-count">使用英雄数: </div>
            <div class="hero-data">${heroCount}</div>
        </div>
        ${teamHeroProgressStructure(winRate, outcomeStompRate, outcomeWinRate, outcomeTieRate, 'team')}
        <div class="progress-sample">
            <div class="pos-sample">
                <div class="pos-text">m场n号位：</div>
                <div class="pos-sample-div">
                    <div class="pos-title">n</div>*<span>m</span>
                </div>
            </div>
            <div class="stomp-rate-sample">
                <div class="stomp-text">碾：</div>
                <div class="stomp-progress"></div>
            </div>
            <div class="win-rate-sample">
                <div class="win-text">胜+碾：</div>
                <div class="win-progress"></div>
            </div>
            <div class="tie-rate-sample">
                <div class="tie-text">平：</div>
                <div class="tie-progress"></div>
            </div>
        </div>
    </div>
    `
    return playerDataDom
}

let lanePairPageSingleProgressStructure = (outcomeStompRate, outcomeWinRate, outComeTieRate, outcomeTitlePreString, outcomeClassName) => {
    let outcomeWinRateString = (outcomeWinRate * 100).toFixed(1) + '%'
    let outcomeStompRateString = (outcomeStompRate * 100).toFixed(1) + '%'
    let outcomeStompRateWidthString = (outcomeStompRate * 100).toFixed(1) + '%'
    let outcomeStompDisplayString = 'true'
    let outcomeTieDisplayString = 'true'
    if (outcomeStompRate == 0) {
        outcomeStompRateString = ''
        outcomeStompDisplayString = 'none'
    }
    if (outcomeStompRate == outcomeWinRate && outcomeStompRate != 0) {
        outcomeStompRateString = (outcomeStompRate * 100).toFixed(1) + '%'
        outcomeWinRateString = ''
    }
    if (outcomeWinRate == 0) {
        outcomeWinRateString = ''
    }
    let outComeTieRateString = (outComeTieRate * 100).toFixed(1) + '%'
    let outComeTieRateWidthString = (outComeTieRate * 100).toFixed(1) + '%'
    if (outComeTieRate == 0) {
        outComeTieRateString = ''
        outcomeTieDisplayString = 'none'
    }
    if (outcomeStompRate == 'NaN' || outcomeWinRate == 'NaN' || outComeTieRate == 'NaN') {
        outcomeStompRateString = ''
        outcomeStompDisplayString = 'none'
        outcomeWinRateString = '对线数据解析错误'
        outComeTieRateString = ''
        outcomeTieDisplayString = 'none'
    }
    let progressDom = `
    <div class="outcome-rate-block ${outcomeClassName}">
        <div class="outcome-rate-title lane-rate-title">${outcomeTitlePreString}线优率: </div>
        <div class="outcome-rate-progress-back">
            <div class="outcome-stomp-rate-progress" style="width: ${outcomeStompRateWidthString};">
                <div class="outcome-stomp-rate-perc">${outcomeStompRateString}</div>
                <div class="outcome-stomp-rate-text">碾</div>
            </div>
            <div class="outcome-win-rate-progress" style="width: ${((outcomeWinRate - outcomeStompRate) * 100).toFixed(1) + '%'};">
                <div class="outcome-win-rate-perc">${outcomeWinRateString}</div>
                <div class="outcome-win-rate-text">胜+碾</div>
            </div>
            <div class="outcome-tie-rate-progress" style="width: ${outComeTieRateWidthString};">
                <div class="outcome-tie-rate-perc">${outComeTieRateString}</div>
                <div class="outcome-tie-rate-text">平</div>
            </div>
        </div>
    </div>
    `
    return progressDom
}

let lanePairPageTotalStructure = () => {
    let domStr = `
    <div class="player-total-data team-lane-total-data">
        ${lanePairPageSingleProgressStructure(apiData.teamApi.outcome.midLaneStompRate, apiData.teamApi.outcome.midLaneWinRate, apiData.teamApi.outcome.midLaneTieRate, '中路', 'mid-lane')}
        ${lanePairPageSingleProgressStructure(apiData.teamApi.outcome.safeLaneStompRate, apiData.teamApi.outcome.safeLaneWinRate, apiData.teamApi.outcome.safeLaneTieRate, '优势路', 'safe-lane')}
        ${lanePairPageSingleProgressStructure(apiData.teamApi.outcome.offLaneStompRate, apiData.teamApi.outcome.offLaneWinRate, apiData.teamApi.outcome.offLaneTieRate, '劣势路', 'off-lane')}
        <div class="progress-sample">
            <div class="stomp-rate-sample">
                <div class="stomp-text">碾：</div>
                <div class="stomp-progress"></div>
            </div>
            <div class="win-rate-sample">
                <div class="win-text">胜+碾：</div>
                <div class="win-progress"></div>
            </div>
            <div class="tie-rate-sample">
                <div class="tie-text">平：</div>
                <div class="tie-progress"></div>
            </div>
        </div>
    </div>
    `
    return domStr
}

let lanePairHeroBlockStructure = (heroData, type, numType) => {
    let heroShortName = heroData.names_shortName[0]
    let matchCount = heroData.pickCount
    let heroName = heroData.names_locs[0]
    let winRate = heroData.winRate
    let outcomeStompRate = heroData.outcomeStompRate
    let outcomeWinRate = heroData.outcomeWinRate
    let outcomeTieRate = heroData.outcomeTieRate
    let heroShortNameDual = heroShortName
    let heroNameDual = heroName
    if (numType == 'dual') {
        heroShortNameDual = `<img class="player-hero-avatar-image"
        src="https://cdn.stratz.com/images/dota2/heroes/${heroData.names_shortName[1]}_icon.png"
        alt="">`
        heroNameDual = `<div>${heroName}</div>&<div>${heroData.names_locs[1]}</div>`
    }
    let playerHeroDom = `
    <div class="player-hero-block">
        <div class="player-hero-block-margin">
            <div class="player-hero-single-title">
                <div class="player-hero-single-title-left">
                    <div class="player-hero-avatar"><img class="player-hero-avatar-image"
                            src="https://cdn.stratz.com/images/dota2/heroes/${heroShortName}_icon.png"
                            alt="">${heroShortNameDual}
                    </div>
                </div>
                <div class="player-hero-single-title-right">
                    <div class="player-hero-match-count"><span>${matchCount}</span>场</div>
                    <div class="player-hero-name">${heroNameDual}</div>
                </div>
            </div>
            ${playerProgressStructure(winRate, outcomeStompRate, outcomeWinRate, outcomeTieRate, type)}
        </div>
    </div>
    `
    return playerHeroDom
}

let lanePairPageAllRowStructure = () => {
    let domString = `
    <div
    class="player-hero-row player-hero-row-mini team-hero-pair-row-mid team-hero-pair-row-single">
    `
    for (let index = 0; index < 8; index++) {
        if (!apiData.teamApi.pairLaneData[2][index]) {
            break;
        }
        domString += lanePairHeroBlockStructure(apiData.teamApi.pairLaneData[2][index], 'pair', 'single')
    }
    domString += `
    </div>
    <div class="player-hero-row player-hero-row-mini team-hero-pair-row-safelane team-hero-pair-row-dual">
    `
    for (let index = 0; index < 8; index++) {
        if (!apiData.teamApi.pairLaneData[0][index]) {
            break;
        }
        domString += lanePairHeroBlockStructure(apiData.teamApi.pairLaneData[0][index], 'pair', 'dual')
    }
    domString += `
    </div>
    <div class="player-hero-row player-hero-row-mini team-hero-pair-row-offlane team-hero-pair-row-dual">
    `
    for (let index = 0; index < 8; index++) {
        if (!apiData.teamApi.pairLaneData[1][index]) {
            break;
        }
        domString += lanePairHeroBlockStructure(apiData.teamApi.pairLaneData[1][index], 'pair', 'dual')
    }
    domString += `</div>`
    return domString
}

let anyPairComBlockStructure = (heroData, type) => {
    let heroShortName = heroData.names_shortName[0]
    let matchCount = heroData.pickCount
    let winRate = heroData.winRate
    let heroShortNameDual = heroShortName
    let heroNameDomStr = `<div>${heroData.names_loc[0]}</div>`
    let heroAvatarIconDomStr = ``
    for (let index = 0; index < heroData.names_shortName.length; index++) {
        heroAvatarIconDomStr += `<img class="player-hero-avatar-image"
        src="https://cdn.stratz.com/images/dota2/heroes/${heroData.names_shortName[index]}_icon.png"
        alt="">`
    }
    for (let index = 1; index < heroData.names_loc.length; index++) {
        heroNameDomStr += `&<div>${heroData.names_loc[index]}</div>`
    }
    let playerHeroDom = `
    <div class="player-hero-block">
        <div class="player-hero-block-margin">
            <div class="player-hero-single-title">
                <div class="player-hero-single-title-left">
                    <div class="player-hero-avatar">
                        ${heroAvatarIconDomStr}
                    </div>
                </div>
                <div class="player-hero-single-title-right">
                    <div class="player-hero-match-count"><span>${matchCount}</span>场</div>
                    <div class="player-hero-name">${heroNameDomStr}</div>
                </div>
            </div>
            ${playerProgressStructure(winRate, 0, 0, 0, type)}
        </div>
    </div>
    `
    return playerHeroDom
}

let anyPairPageAllRowStructure = () => {
    let domStr = ``
    for (let index = 2; index < 4; index++) {
        domStr += `<div class="player-hero-row player-hero-row-mini team-hero-pair-row-${index} team-hero-pair-row-big">`
        for (let comIndex = 0; comIndex < 8; comIndex++) {
            if (!apiData.teamApi.pairHeroesData[index - 2][comIndex]) {
                break;
            }
            domStr += anyPairComBlockStructure(apiData.teamApi.pairHeroesData[index - 2][comIndex])
        }
        domStr += `</div>`
    }
    for (let index = 4; index < 6; index++) {
        domStr += `<div class="player-hero-row player-hero-row-mini team-hero-pair-row-${index} team-hero-pair-row-small">`
        for (let comIndex = 0; comIndex < 8; comIndex++) {
            if (!apiData.teamApi.pairHeroesData[index - 2][comIndex]) {
                break;
            }
            domStr += anyPairComBlockStructure(apiData.teamApi.pairHeroesData[index - 2][comIndex])
        }
        domStr += `</div>`
    }
    return domStr
}

let allPageStructure = () => {
    if (!apiData.printType) {
        pdfEl.classList.add('monochrome')
    }
    for (let index = 0; index < 5; index++) {
        let domStr = `
        <div id="player${index + 1}" class="paper-single">
            <div class="page-content">
                <div class="page-title">
                    <div class="team-logo">
                        <img class="team-logo-img" src="https://cdn.stratz.com/images/dota2/teams/${apiData.teamApi.id}.png" alt="">
                    </div>
                    <div class="player-title">
                        <div class="player-name">${apiData.playersApi.playersInfo[index].name}</div>
                        <div class="player-pos">${pos_to_loc(index + 1)}</div>
                    </div>
                    <div class="player-describe">
                        *数据采集自 <span>${timeStampSecondsToDateString(apiData.playersApi.playersInfo[index].startDateTime)}</span> 至 <span>${timeStampSecondsToDateString(apiData.playersApi.playersInfo[index].endDateTime)}</span> 的 <span>${apiData.playersApi.playersInfo[index].rankDataCount}</span> 场天梯和 <span>${apiData.playersApi.playersInfo[index].leagueDataCount}</span> 局联赛
                    </div>
                </div>
                <div class="page-body">
                    ${playerDataDomStructure(apiData.playersApi.playersData[index].heroCount, apiData.playersApi.playersData[index].winRate, apiData.playersApi.playersData[index].outcomeStompRate, apiData.playersApi.playersData[index].outcomeWinRate, apiData.playersApi.playersData[index].outcomeTieRate)}
                    <div class="player-hero-data-body">
                        ${playerAllRowStructure(index)}
                    </div>
                </div>
            </div>
        </div>
        `
        pdfEl.innerHTML += domStr
    }
    pdfEl.innerHTML += `
    <div id="teamPart1" class="paper-single team-paper">
        <div class="page-content">
            <div class="page-title">
                <div class="team-logo">
                    <img class="team-logo-img" src="https://cdn.stratz.com/images/dota2/teams/${apiData.teamApi.id}.png" alt="">
                </div>
                <div class="player-title">
                    <div class="player-name">${apiData.teamApi.name}</div>
                    <div class="player-pos">队伍数据——总览</div>
                </div>
                <div class="player-describe">
                *数据采集自包括 <span>${apiData.leagueApi.leagueName}</span> 在内 <span>${apiData.leagueApi.leagueCount}</span> 项赛事中的 <span>${apiData.teamApi.matchCount}</span> 局比赛
                </div>
            </div>
            <div class="page-body">
                ${teamHeroDomStructure(apiData.teamApi.singleHeroData.length, apiData.teamApi.winRate, apiData.teamApi.outcome)}
                <div class="player-hero-data-body">
                    ${teamHeroAllRowSctucture()}
                </div>
            </div>
        </div>
    </div>
    `
    pdfEl.innerHTML += `
    <div id="teamPart2" class="paper-single team-paper team-paper-pair-lane">
        <div class="page-content">
            <div class="page-title">
                <div class="team-logo">
                    <img class="team-logo-img" src="https://cdn.stratz.com/images/dota2/teams/${apiData.teamApi.id}.png" alt="">
                </div>
                <div class="player-title">
                    <div class="player-name">${apiData.teamApi.name}</div>
                    <div class="player-pos">队伍数据——分路数据</div>
                </div>
                <div class="player-describe">
                *数据采集自包括 <span>${apiData.leagueApi.leagueName}</span> 在内 <span>${apiData.leagueApi.leagueCount}</span> 项赛事中的 <span>${apiData.teamApi.matchCount}</span> 局比赛
                </div>
            </div>
            <div class="page-body">
                ${lanePairPageTotalStructure()}
                <div class="player-hero-data-body">
                    ${lanePairPageAllRowStructure()}
                </div>
            </div>
        </div>
    </div>
    `
    pdfEl.innerHTML += `
    <div id="teamPart3" class="paper-single team-paper team-paper-pair-lane team-paper-pair-any">
        <div class="page-content">
            <div class="page-title">
                <div class="team-logo">
                    <img class="team-logo-img" src="https://cdn.stratz.com/images/dota2/teams/${apiData.teamApi.id}.png" alt="">
                </div>
                <div class="player-title">
                    <div class="player-name">${apiData.teamApi.name}</div>
                    <div class="player-pos">队伍数据——任意复选组合</div>
                </div>
                <div class="player-describe">
                *数据采集自包括 <span>${apiData.leagueApi.leagueName}</span> 在内 <span>${apiData.leagueApi.leagueCount}</span> 项赛事中的 <span>${apiData.teamApi.matchCount}</span> 局比赛
                </div>
            </div>
            <div class="page-body">
                <div class="player-hero-data-body">
                    ${anyPairPageAllRowStructure()}
                </div>
            </div>
        </div>
    </div>
    `
}

allPageStructure()

let progressTextWidthFix = (textEl, top) => {
    if ((textEl.scrollWidth - 16) > $(textEl).innerWidth()) {
        textEl.style.top = top
    }
}

for (let index = 0; index < $('.player-total-data .outcome-stomp-rate-perc').length; index++) {
    progressTextWidthFix($('.player-total-data .outcome-stomp-rate-perc')[index], '-5mm')
}

for (let index = 0; index < $('.player-hero-data-body .outcome-stomp-rate-perc').length; index++) {
    progressTextWidthFix($('.player-hero-data-body .outcome-stomp-rate-perc')[index], '5mm')
}

for (let index = 0; index < $('.player-total-data .outcome-tie-rate-perc').length; index++) {
    progressTextWidthFix($('.player-total-data .outcome-tie-rate-perc')[index], '-5mm')
}

for (let index = 0; index < $('.player-hero-data-body .outcome-tie-rate-perc').length; index++) {
    progressTextWidthFix($('.player-hero-data-body .outcome-tie-rate-perc')[index], '5mm')
}

document.body.dispatchEvent(new CustomEvent('view-ready'))