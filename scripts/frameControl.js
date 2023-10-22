const fs = require("fs");
const autoComplete = require("@tarekraafat/autocomplete.js");
const { ipcRenderer } = require('electron')
// const { dialog } = require('@electron/remote');
// const { dialog } = remote;
let teamNameInputEl = document.getElementById('teamName')
let patchSeletcorEl = document.getElementById('patchSelector')
let leagueSelectorEl = document.getElementById('leagueSelector')
let patchViewerEl = document.getElementById('patchViewer')
let teamInputEl = document.getElementById('autoComplete')
let leagueViewerEl = document.getElementById('leagueViewer')
let IncludeRankDtaEl = document.getElementById('IncludeRankDta')
let rankDateRangeInputerStartEl = document.getElementById('rankDateRangeInputerStart')
let rankDateRangeInputerEndEl = document.getElementById('rankDateRangeInputerEnd')
let includeOtherPositionCheckBoxEl = document.getElementById('includeOtherPositionCheckBox')
let printTypeRadioEls = document.getElementsByClassName('print-type-radio')
let filePathSelector = document.getElementById('filePathSelector')
let filePathViewer = document.getElementById('filePathViewer')
let generateBtnEl = document.getElementById('generateBtn')
let dialogEl = document.getElementById('alertDialog')
let generateFolderPath = ''
try {
  // console.log(fs.readFileSync('./filePathConfig.json'))
  generateFolderPath = (JSON.parse(fs.readFileSync('./filePathConfig.json'))).folderPath
} catch (error) {
  console.log(error)
}
filePathViewer.innerText = generateFolderPath
let printType = true
rankDateRangeInputerStartEl.index = 0
rankDateRangeInputerEndEl.index = 1
let qsMonthYearEls = document.getElementsByClassName('qs-month-year')
let dateOverlayShowEls = [document.getElementsByClassName('qs-overlay-year'), document.getElementsByClassName('qs-overlay-month-container'), document.getElementsByClassName('qs-overlay-month')]

let windowOffsetHeightObject = {
  leaguePatchViewers: 0
}
let autoCompleteJs
let dateObj = []
let keepOpen = false
let dateOptions = {
  formatter: (input, date, instance) => {
    // This will display the date as `1/1/2019`.
    input.value = date.toLocaleDateString()
  },
  onSelect: instance => {
    if (instance.getRange().start) {
      startDateTime = Date.parse(instance.getRange().start) / 1000
    }
    else {
      startDateTime = 0
    }
    if (instance.getRange().end) {
      endDateTime = Date.parse(instance.getRange().end) / 1000 + 86399
    }
    else {
      endDateTime = 0
    }
    instance.show()
  },
  onShow: instance => {
    // if (!instance.calendarContainer.getElementsByClassName('qs-overlay')[0].classList.contains('qs-hidden')) {
    //   instance.toggleOverlay()
    // }
    // dateObj.forEach((dateEl) => {
    //   if (dateEl.calendarContainer.classList.contains('qs-hidden')) {
    //     dateEl.show()
    //   }
    // })
    let anotherInstance = dateObj[-1 * instance.calendarContainer.index + 1]
    if (anotherInstance.calendarContainer.classList.contains('qs-hidden')) {
      anotherInstance.show()
    }
  },
  onHide: instance => {
    // if (!instance.calendarContainer.getElementsByClassName('qs-overlay')[0].classList.contains('qs-hidden')) {
    //   instance.toggleOverlay()
    // }
    // dateObj.forEach((dateEl) => {
    //   if (!dateEl.calendarContainer.classList.contains('qs-hidden')) {
    //     dateEl.hide()
    //   }
    // })
    if (keepOpen) {
      dateObj.forEach((dateEl) => {
        if (!dateEl.calendarContainer.classList.contains('qs-hidden')) {
          dateEl.show()
          keepOpen = false
        }
      })
      return
    }
    let anotherInstance = dateObj[-1 * instance.calendarContainer.index + 1]
    if (!anotherInstance.calendarContainer.classList.contains('qs-hidden')) {
      anotherInstance.hide()
    }

  },
  id: 1,
  showAllDates: true,
  customDays: ['天', '一', '二', '三', '四', '五', '六'],
  customMonths: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  overlayButton: "确认",
  overlayPlaceholder: '四位年份',
  customOverlayMonths: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
}
dateObj[0] = datepicker('#rankDateRangeInputerStart', dateOptions)
dateObj[1] = datepicker('#rankDateRangeInputerEnd', dateOptions)
let allDatepickerEls = document.getElementsByClassName('qs-datepicker-container')
for (let index = 0; index < allDatepickerEls.length; index++) {
  allDatepickerEls[index].index = index
}

let refreshTeamListFrame = (teamlist) => {
  let acSrc = []
  teamlist.forEach((team, index) => {
    acSrc.push(team.name + ' - ' + team.tag + ' - [' + team.team_id + '] - ' + index)
  })
  autoCompleteJs = new autoComplete({
    placeHolder: "查找队伍...",
    data: {
      src: acSrc,
      cache: true,
    },
    resultItem: {
      highlight: true
    },
    events: {
      input: {
        selection: (event) => {
          const selection = event.detail.selection.value;
          autoCompleteJs.input.value = selection;
        }
      }
    }
  })
}

let refreshPatchListFrame = (patchList) => {
  patchSeletcorEl.innerHTML = `<option value="" disabled selected hidden>Select...</option>`
  patchList.forEach((patch, index) => {
    let optionElString = `<option value="${index + '-' + patch.id}">${patch.name}</option>`
    patchSeletcorEl.innerHTML += optionElString
  })
}

let refreshLeagueListFrame = (leagueList) => {
  leagueSelectorEl.innerHTML = `<option value="" disabled selected hidden>Select...</option>`
  leagueList.forEach((league, index) => {
    if (league == null) {
      return
    }
    let optionElString = `<option value="${index + '-' + league.id}">${league.displayName}</option>`
    leagueSelectorEl.innerHTML += optionElString
  })
}

let rankDataOnChange = (event) => {
  includeRankData = event.target.checked
}

let arraySelectorOnChange = (event, selector, viewer) => {
  if (event.target.value == '') {
    return
  }
  let selectedOptionValue = event.target.value
  let singleEl = document.createElement('div')
  singleEl.classList.add('list-single')
  singleEl.innerHTML = `<div class="list-single-displayName">` + selector.getElementsByTagName('option')[parseInt((selectedOptionValue + '').split('-')[0]) + 1].innerText + `</div>`
  singleEl.setAttribute('optionValue', selectedOptionValue)
  let deleteBtnEl = document.createElement('span')
  singleEl.appendChild(deleteBtnEl)
  deleteBtnEl.addEventListener('click', (event) => {
    let closingBlackListValue = event.target.parentNode.getAttribute('optionValue')
    let viewerEl = event.target.parentNode.parentNode
    event.target.parentNode.remove()
    selector.getElementsByTagName('option')[parseInt(closingBlackListValue) + 1].removeAttribute('hidden')
    // whiteListSelector.getElementsByTagName('option')[parseInt(closingBlackListValue) + 2].removeAttribute('hidden')
    if (viewerEl.id == 'leagueViewer' || viewerEl.id == 'patchViewer') {
      arraySelectorHeightRefresh()
    }
  })
  selector.getElementsByTagName('option')[parseInt(selectedOptionValue) + 1].setAttribute('hidden', true)
  viewer.appendChild(singleEl)
  selector.selectedIndex = 0
  if (viewer.id == 'leagueViewer' || viewer.id == 'patchViewer') {
    arraySelectorHeightRefresh()
  }
}

let arraySelectorHeightRefresh = () => {
  let heightSortArray = [patchViewerEl, leagueViewerEl]
  heightSortArray = heightSortArray.sort((a, b) => {
    return b.getElementsByClassName('list-single').length - a.getElementsByClassName('list-single').length
  })
  let listSingleCount = heightSortArray[0].getElementsByClassName('list-single').length
  patchViewerEl.style.height = listSingleCount * 25 + 'px'
  leagueViewerEl.style.height = listSingleCount * 25 + 'px'
  let windowOffsetHeight = listSingleCount * 25
  if (listSingleCount > 4) {
    patchViewerEl.style.overflowY = 'auto'
    leagueViewerEl.style.overflowY = 'auto'
    windowOffsetHeight = 100
  }
  windowOffsetHeightObject.leaguePatchViewers = windowOffsetHeight
  windowHeightUpdateCall()
}


patchSeletcorEl.addEventListener('change', (event) => {
  arraySelectorOnChange(event, patchSeletcorEl, patchViewerEl)
})

leagueSelectorEl.addEventListener('change', (event) => {
  arraySelectorOnChange(event, leagueSelectorEl, leagueViewerEl)
})

IncludeRankDtaEl.addEventListener('change', (event) => {
  rankDataOnChange(event)
})

rankDateRangeInputerStartEl.addEventListener('click', (event) => {
  event.stopPropagation()
  dateObj[event.target.index].show()
})

rankDateRangeInputerEndEl.addEventListener('click', (event) => {
  event.stopPropagation()
  dateObj[event.target.index].show()
})

dateObj.forEach((dateInstance) => {
  dateInstance.calendarContainer.addEventListener('click', (event) => {
    keepOpen = true
    // console.log(1)
    // dateObj[event.target.closest('.qs-datepicker-container').index].show()
  })
})

includeOtherPositionCheckBoxEl.addEventListener('click', (event) => {
  includeOtherPosition = includeOtherPositionCheckBoxEl.checked
})

for (let index = 0; index < printTypeRadioEls.length; index++) {
  printTypeRadioEls[index].addEventListener('click', (event) => {
    printType = event.target.value
  })
}

generateBtnEl.addEventListener('click', async (event) => {
  if (!generateFolderPath || !fs.existsSync(generateFolderPath)) {
    dialogShow('未选择PDF输出路径')
    setTimeout(() => {
      dialogHide()
    }, 2000)
    return
  }
  selectedTeamIndex = teamInputEl.value.split(' - ')[teamInputEl.value.split(' - ').length - 1]
  try {
    let testTeamId = teamList[selectedTeamIndex].team_id
  } catch (error) {
    dialogShow('队伍信息获取错误，请尝试重新选择队伍')
    setTimeout(() => {
      dialogHide()
    }, 2000)
    return
  }
  leagueFilter = []
  patchSelectedArray = []
  includeOtherPosition = includeOtherPositionCheckBoxEl.checked
  includeRankData = IncludeRankDtaEl.checked
  printType = document.getElementsByClassName('print-type-radio')[0].checked
  let patchElList = patchViewerEl.getElementsByClassName('list-single')
  let leagueElList = leagueViewerEl.getElementsByClassName('list-single')
  for (let index = 0; index < patchElList.length; index++) {
    patchSelectedArray.push(parseInt(patchElList[index].getAttribute('optionValue').split('-')[1]))
  }
  for (let index = 0; index < leagueElList.length; index++) {
    leagueFilter.push(parseInt(leagueElList[index].getAttribute('optionValue').split('-')[1]))
  }
  leagueApi = {
    leagueName: leagueElList[0].innerText,
    leagueCount: leagueFilter.length
  }
  await generateBtnCall()
})

let dialogShow = (alertText) => {
  document.getElementById('alertText').innerHTML = alertText
  if (dialogEl.open == false) {
    dialogEl.showModal()
    dialogEl.style.transform = "scale(1)"
  }
}

let dialogHide = () => {
  dialogEl.style.transform = "scale(0)"
  setTimeout(() => {
    dialogEl.close()
  }, 300)
}

let folderDialogCall = () => {
  ipcRenderer.send('selectGenerateFolder', generateFolderPath)
}

filePathSelector.addEventListener('click', () => {
  folderDialogCall()
})

ipcRenderer.on('folderSelected', async (event, selectResult) => {
  if (!selectResult.status || selectResult.result.canceled) {
    console.log(selectResult)
    return
  }
  console.log(selectResult)
  let result = selectResult.result
  generateFolderPath = result.filePaths[0]
  filePathViewer.innerText = generateFolderPath
  fs.writeFileSync('./filePathConfig.json', JSON.stringify({ folderPath: generateFolderPath }, null, 2))
})

// for (let index = 0; index < qsMonthYearEls.length; index++) {
//   qsMonthYearEls[index].addEventListener('click', (event) => {
//     if (event.target.closest(".qs-datepicker-container").getElementsByClassName("qs-overlay")[0].classList.contains('qs-hidden')) {
//       dateObj[event.target.closest(".qs-datepicker-container").index].toggleOverlay()
//     }
//     dateObj[event.target.closest(".qs-datepicker-container").index].show()
//     // event.stopPropagation()
//   })
// }

// dateOverlayShowEls.forEach((dateOverlayShowEl) => {
//   for (let index = 0; index < dateOverlayShowEl.length; index++) {
//     dateOverlayShowEl[index].addEventListener('click', (event) => {
//       if (event.target.closest(".qs-datepicker-container").getElementsByClassName("qs-overlay")[0].classList.contains('qs-hidden')) {
//         dateObj[event.target.closest(".qs-datepicker-container").index].toggleOverlay()
//       }
//       dateObj[event.target.closest(".qs-datepicker-container").index].show()
//       // event.target.closest('.qs-overlay').classList.remove('qs-hidden')
//     })
//   }
// })

// let leaguePatchResizeObserver = new ResizeObserver((entries) => {
//   windowOffsetHeightObject.leaguePatchViewers = entries[0].target.offsetHeight
//   windowHeightUpdateCall()
// });
// leaguePatchResizeObserver.observe(patchViewerEl);
let windowHeightUpdateCall = () => {
  let offsetValue = 0
  Object.values(windowOffsetHeightObject).forEach((offset) => {
    offsetValue += offset
  })
  ipcRenderer.send('windowHeightUpdate', offsetValue)
}

