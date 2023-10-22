let open = require('open')
const { PDFDocument } = PDFLib;
let getFormattedTimeNow = () => {
    var date = new Date();

    // Hours part from the timestamp
    var hours = date.getHours();

    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();

    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    // Will display time in 10:30:23 format
    return formattedTime = (date.toLocaleDateString()).replace(/[/]/g, '-') + '_' + hours + '-' + minutes.substr(-2) + '-' + seconds.substr(-2);
}
let print = async () => {
    let timeStrNow = getFormattedTimeNow();
    let reqBody = {
        source: ' file:///' + (path.join(__dirname, '/webPage/index.html')).replace(/[\\]/g, '/'),
        target: `${generateFolderPath}\\${teamList[selectedTeamIndex].tag}-${timeStrNow}.pdf` //修改路径//修改路径//修改路径//修改路径//修改路径
    }//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径
    console.log(reqBody)
    ipcRenderer.send('printCall', reqBody)
}


// printApp.post('/pdfexport', (req, res) => {

// })

let pdfCleanUp = async (filePath) => {
    // let fileUrl = './generate.pdf'
    let existingPdfBytes = fs.readFileSync(filePath)  //修改路径//修改路径//修改路径//修改路径
    //修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径//修改路径
    // Load a PDFDocument from the existing PDF bytes
    let pdfDoc = await PDFDocument.load(existingPdfBytes);

    let pageCount = pdfDoc.getPageCount()
    for (let index = 1; index < pageCount; index = index + 2) {
        pdfDoc.removePage(index);
        pageCount--
        index--
    }
    // Remove the first page of the document


    // Serialize the PDFDocument to bytes (a Uint8Array)
    let pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    fs.writeFileSync(filePath, pdfBytes)
    //   download(pdfBytes, 'pdf-lib_modification_example.pdf', 'application/pdf');
}

ipcRenderer.on('printComplete', async (event, printResData) => {
    await pdfCleanUp(printResData[0])
    await open(printResData[0])
    dialogHide()
})
// print()