var fs = require('fs');
let crypto = require('crypto')
let path = require('path')

let files = [];
let hashes = {};


Object.filter = (obj, predicate) => 
Object.keys(obj)
      .filter( key => predicate(obj[key]) )
      .reduce( (res, key) => (res[key] = obj[key], res), {} );


function printResults(){

	var filteredHashes = Object.filter(hashes, hash => hash.length > 1); 
	console.log(filteredHashes);

}

function calcFileMd5(entryPath, callback){
	let hash = crypto.createHash('md5');
	let stream = fs.createReadStream(entryPath);

	let fileSize = fs.lstatSync(entryPath).size;

    stream.on('data', function (data) {
        hash.update(data)
    })

    stream.on('end', function () {
        let calculatedMd5 = hash.digest('hex')
    
        if(calculatedMd5 in hashes){
        	hashes[calculatedMd5].push({path: entryPath, size: fileSize});
        }
        else{
        	hashes[calculatedMd5] = [{path: entryPath, size: fileSize}];
        }
    	callback();
    });
}

function calcNextFile(n){
	let entryPath = files[n];
	calcFileMd5(entryPath, function(){
		++n;
		if(n < files.length){
			calcNextFile(n);
		}
		else {
			printResults();
		}
	});
}

function analyzeDir(dir, minsize){
	let entries = fs.readdirSync(dir);

	for(let ei in entries){
		let entryPath = path.join(dir, entries[ei]);
		let entryStats = fs.lstatSync(entryPath);

		if (entryStats.isDirectory()) {
			analyzeDir(entryPath, minsize);
		}
		else if (entryStats.isFile()) {
			
            let fileSizeInBytes = entryStats.size;
            if (fileSizeInBytes >= minsize)
            	files.push(entryPath);

		}
	}
}

if (process.argv.length < 3){
	console.log('use: node find_dubs.js <path> [minsize]\n');
	process.exit(0);
}

analyzeDir(process.argv[2], process.argv[3] ? parseInt(process.argv[3]) : 1);
	
if(files.length !== 0)
	calcNextFile(0);





		