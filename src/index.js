const config = require('../config.json');

const fs = require('fs');
const path = require("path");

const winDriveUtil = require('win-drive-util');

let fwFile = path.resolve(config.fw);
let projFile = path.resolve(config.proj);

console.log('mb-updater')
console.log('Please connect your micro:bit in [maintenance or normal] mode!')

winDriveUtil.waitForDrive('MAINTENANCE').then((drive) => {
    console.log('Maintenance mode microbit found at', drive)
    console.log(fs.readFileSync(path.join(drive, 'DETAILS.TXT')).toString())
    let fwf = config.fw.split('files/')[1];
    let fwp = path.join(drive, fwf).toString();
    console.log('Copying', fwFile, 'to', fwp)
    fs.cpSync(fwFile, fwp)
    console.log('Copied firmware')
    setTimeout(() => {
        winDriveUtil.waitForDrive('MAINTENANCE').then((dr) => {
            console.log("Maintenance drive is back.. potential fail, so recopying")
            if (fs.readdirSync(dr).includes('FAIL.TXT')) {
                console.log('Fail file found, this may not be from this session if the new project uploads.')
                console.log(fs.readFileSync(path.join(dr, 'FAIL.TXT')).toString())
            }
            console.log('Recopying', fwFile, 'to', fwp)
            fs.cpSync(fwFile, fwp)
            console.log('Copied firmware (x2)')
        })
    },6500)
})

copyStuff();

function copyStuff() {
    winDriveUtil.waitForDrive('MICROBIT').then((dr) => {
        console.log('Found micro:bit in normal mode, copying blank project after 5 seconds')
        let details = fs.readFileSync(path.join(dr, 'DETAILS.TXT')).toString();
        let dtlList = details.split('\n');
        console.log(dtlList[7])
        setTimeout(() => {
            console.log('Copying project')
            let proj = config.proj.split('files/')[1];
            let prp = path.join(dr, proj).toString();
            console.log(projFile, 'to', prp)
            fs.cpSync(projFile, prp)
            winDriveUtil.waitForDrive('MICROBIT').then((dr) => {
                if (fs.readdirSync(dr).includes('FAIL.TXT')) {
                    console.log('Fail file found, this may not be from this session if the new project uploads.')
                    console.log(fs.readFileSync(path.join(dr, 'FAIL.TXT')).toString())
                }
                let details = fs.readFileSync(path.join(dr, 'DETAILS.TXT')).toString();
                let dtlList = details.split('\n');
                console.log(dtlList[7])
                console.log('Update finished!')
                process.exit(0)
            })
        },5000)
    })
}
