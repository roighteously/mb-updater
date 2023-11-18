const config = require('../config.json');

const fs = require('fs');

// move the file (specififed config.fw) to the destination (specified config.dest)

const child = require('child_process');
const path = require("path");

let fwFile = path.resolve(config.fw);
let projFile = path.resolve(config.proj);

console.log('please connect microbit [maintenance or normal] mode ')

if (process.argv[2] == "ocp") {
    waitForMicrobitdrive().then(() => {
        console.log('drive is back, copying blank project')
        let prp = path.join(drive, config.proj).toString();
        console.log(projFile, 'to', prp)
        fs.cpSync(projFile, prp)
    })

    waitForMicrobitdrive().then((dr) => {
        if (fs.readdirSync(dr).includes('FAIL.TXT')) {
            console.log('Fail file found, this may not be from this session if the new project uploads.')
            console.log(fs.readFileSync(path.join(dr, 'FAIL.TXT')).toString())
        }
        console.log(fs.readFileSync(path.join(dr, 'DETAILS.TXT')).toString())
    })
    process.exit(0);
    return;
} else {

    waitForMaintenanceDrive().then((drive) => {
        console.log('Maintenance mode microbit found at', drive)
        console.log(fs.readFileSync(path.join(drive, 'DETAILS.TXT')).toString())
        let fwp = path.join(drive, config.fw).toString();
        console.log('Copying', fwFile, 'to', fwp)
        fs.cpSync(fwFile, fwp)
        console.log('Copied firmware')

        setTimeout(() => {
            console.log('Checking for maintenance drive')
            waitForMaintenanceDrive().then((dr) => {
                console.log("Maintenance drive is back.. potential fail, so recopying")
                if (fs.readdirSync(dr).includes('FAIL.TXT')) {
                    console.log('Fail file found, this may not be from this session if the new project uploads.')
                    console.log(fs.readFileSync(path.join(dr, 'FAIL.TXT')).toString())
                }
                console.log('Recopying', fwFile, 'to', fwp)
                fs.cpSync(fwFile, fwp)
                console.log('Copied firmware (x2)')
            })
        },2500)

        if (process.argv[2] !== 'nc') copyStuff();
    })

    copyStuff();
}


function copyStuff() {
    waitForMicrobitdrive().then((dr) => {
        console.log('found normal mode microbit, copying blank project after 5 seconds')
        let details = fs.readFileSync(path.join(dr, 'DETAILS.TXT')).toString();
        let dtlList = details.split('\n');
        console.log(dtlList[7])
        setTimeout(() => {
            console.log('Copying project')
            let prp = path.join(dr, config.proj).toString();
            console.log(projFile, 'to', prp)
            fs.cpSync(projFile, prp)
            waitForMicrobitdrive().then((dr) => {
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

function waitForMicrobitdrive() {
    return new Promise((resolve, reject) => {
        setInterval(() => {
            child.exec('wmic logicaldisk where "VolumeName=\'MICROBIT\'" get DeviceID', (error, stdout) => {
                let real = [];
                if (stdout.includes('No Instance(s) Available.')) {
                    console.log('no instances')
                } else {
                    stdout.trim().split('\n').forEach(drive => {
                        let driveName = drive.trim();
                        if (driveName === 'DeviceID' || driveName == '') return;
                        real.push(driveName);
                    })
                    drive = real[0];
                }
            });
            if (typeof drive !== "undefined") resolve(drive);
        },50)
    })
}

function waitForMaintenanceDrive() {
    return new Promise((resolve, reject) => {
        let int = setInterval(() => {
            child.exec('wmic logicaldisk where "VolumeName=\'MAINTENANCE\'" get DeviceID', (error, stdout) => {
                if(encodeURIComponent(stdout) === '%0D%0D%0A%0D%0D%0A') return;
                stdout.split('\n').forEach(drive => {
                    if(encodeURIComponent(drive) === '%0D%0D') return;
                    if(encodeURIComponent(drive) === 'DeviceID%20%20%0D%0D') return;
                    if(encodeURIComponent(drive) === '') return;
                    resolve(drive.trim());
                    clearInterval(int);
                })
            });
        },50)
    })
}

